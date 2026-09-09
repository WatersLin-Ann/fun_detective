/**
 * 发布前文本质量检查：扫描 cases/ 下中文正文中的未翻译英文残片（P2-05）
 *
 * 放行规则：
 *  1. 技术字段（id/飞书记录ID/URL/来源/类型）与参考链接、推荐视频分支不扫描；
 *  2. 白名单：公认缩写、平台/厂商/作品名等约定保留英文的词；
 *  3. 处于中文/英文括号（）() 内的英文视为「专名原文/注释」，放行；
 *  4. 英文片段后紧跟括号（中文注释）的，放行；
 *  5. 纯大写短缩写（1-4 位，可含连字符）放行。
 * 退出码：发现疑似残片返回 1，可接入 build / CI。
 * 用法：node scripts/scan-english-fragments.cjs
 */
const fs = require('fs');
const path = require('path');

function walk(d) {
  let r = [];
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) r = r.concat(walk(p));
    else if (f.endsWith('.json')) r.push(p);
  }
  return r;
}

const root = path.join(__dirname, '..', 'cases');

// 中英文混排白名单：约定保留英文的缩写、平台、厂商、作品/角色名
const WHITELIST = new Set([
  // 通用缩写
  'DNA','RNA','HIV','ATM','FBI','CIA','CSI','KGB','MI5','MI6','NSA','NYPD','LAPD',
  'BBC','CNN','NBC','ABC','HBO','PC','RPG','FPS','AVG','AI','VR','AR','IP','TV',
  'CD','DVD','GPS','Y-DNA','O.J.','A.C.','II','III','IV','VI','VII','VIII','IX','XI','XII',
  'Jr','Sr','Mr','Mrs','Ms','Dr','OK','Se7en','P-body','e-fit','221B',
  // 平台 / 互联网
  'IMDb','YouTube','Wikipedia','Google','Twitter','Facebook','Instagram','TikTok',
  'Netflix','Amazon','Apple','Sony','Xbox','PlayStation','Switch','Steam',
  // 厂商 / 工作室
  'Chunsoft','Spike Chunsoft','Telltale Games','Quantic Dream','Team Bondi',
  'Rockstar Games','Remedy Entertainment','Dontnod Entertainment','Frogwares',
  'Fullbright','The Chinese Room','The Astronauts','Valve','5pb','07th Expansion',
  // 约定保留原名的作品/角色
  'Among Us','Ever17','Remember11','GLaDOS',
]);

const SKIP_PATH = /(^|\.)(id|飞书记录ID|URL|来源|类型|线索编号|录入日期|最后更新|版本)$/;
const SKIP_BRANCH = /(参考链接|推荐视频)/;
// 字母数字混合片段（覆盖 Se7en / 5pb / 07th Expansion 等）
const tokenRe = /[A-Za-z0-9]+(?:[' .-][A-Za-z0-9]+)*/g;

// 结构化编号/型号/首字母缩写等非散文英文，统一放行
function isStructural(t) {
  if (/^\d/.test(t)) return true; // 日期、数字区间、小数、200X 等数字开头
  if (/^[A-Za-z]{1,4}-?\d+[A-Za-z0-9-]*$/.test(t)) return true; // DL6 / DL-6 / RK800 / V3
  if (/^([A-Z]\.)+[A-Z]?\.?$/.test(t)) return true; // H.M / G.K / O.J 人名首字母
  return false;
}

// 空格复合词（如 AI GLaDOS）：每个组成部分都合法则整体放行
function partsAllOk(t) {
  if (!/\s/.test(t)) return false;
  return t.split(/\s+/).every((p) => WHITELIST.has(p) || /^[A-Z]{1,4}$/.test(p) || isStructural(p));
}

// 判断 token 在原文中是否被括号包裹，或其后紧跟中文注释括号
function isGlossed(text, start, end) {
  // 向前找最近的未配对开括号
  const before = text.slice(0, start);
  const cnOpen = before.lastIndexOf('（');
  const enOpen = before.lastIndexOf('(');
  const open = Math.max(cnOpen, enOpen);
  if (open !== -1) {
    const after = text.slice(end);
    const cnClose = after.indexOf('）');
    const enClose = after.indexOf(')');
    const close = Math.min(
      cnClose === -1 ? Infinity : cnClose,
      enClose === -1 ? Infinity : enClose,
    );
    if (close !== Infinity) return true; // 括号在其后闭合，说明 token 处于括号内
  }
  // 其后 2 个字符内出现开括号（如：RACHE（复仇））
  return /^.{0,2}[（(]/.test(text.slice(end));
}

let total = 0;
const byFile = {};

for (const file of walk(root)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const hits = [];
  function scan(v, pth) {
    if (typeof v === 'string') {
      if (SKIP_PATH.test(pth) || SKIP_BRANCH.test(pth)) return;
      if (/^https?:/.test(v.trim())) return;
      const bad = [];
      let m;
      tokenRe.lastIndex = 0;
      while ((m = tokenRe.exec(v)) !== null) {
        const t = m[0];
        if (WHITELIST.has(t)) continue;
        if (/^[A-Z]{1,4}(-[A-Z]+)?$/.test(t)) continue;
        if (isStructural(t)) continue;
        if (partsAllOk(t)) continue;
        if (isGlossed(v, m.index, m.index + t.length)) continue;
        bad.push(t);
      }
      if (bad.length) hits.push(`${pth} => ${JSON.stringify(bad)}`);
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => scan(x, `${pth}[${i}]`));
    } else if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) scan(v[k], `${pth}.${k}`);
    }
  }
  scan(data, '');
  if (hits.length) {
    byFile[path.relative(root, file)] = hits;
    total += hits.length;
  }
}

for (const [f, hs] of Object.entries(byFile)) {
  console.log('### ' + f + '  (' + hs.length + ')');
  hs.forEach((h) => console.log('  ' + h));
}
console.log(`\n疑似未翻译残片字段数: ${total}, 涉及文件: ${Object.keys(byFile).length}`);
process.exit(total > 0 ? 1 : 0);
