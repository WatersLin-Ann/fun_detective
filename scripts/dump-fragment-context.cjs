// 导出所有疑似英文残片字段的完整上下文到文件，避免命令行中文编码问题
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
const files = walk(root);
const SKIP_PATH = /(^|\.)(id|飞书记录ID|URL|来源|类型)$/;
const SKIP_BRANCH = /(参考链接|推荐视频)/;
const WHITELIST = new Set([
  'DNA','RNA','HIV','ATM','FBI','CIA','CSI','KGB','MI5','MI6','NSA','NYPD','LAPD',
  'IMDb','YouTube','Wikipedia','Google','Twitter','Facebook','Instagram','TikTok',
  'BBC','CNN','NBC','ABC','HBO','Netflix','Amazon','Apple','Sony','Xbox','PS',
  'PC','RPG','FPS','AVG','AI','VR','AR','IP','TV','CD','DVD','GPS','Y-DNA',
  'OK','II','III','IV','VI','VII','VIII','IX','XI','XII','Jr','Sr','Mr','Mrs','Ms','Dr',
  'PlayStation','Switch','Steam','Chunsoft','Spike Chunsoft','Telltale Games','Quantic Dream',
  'Team Bondi','Rockstar Games','Remedy Entertainment','Dontnod Entertainment','Frogwares',
  'Fullbright','The Chinese Room','The Astronauts','Valve','Among Us','Ever17','Remember11',
  'GLaDOS','Hello Kitty','Scotland Yard','Operation Grange',
]);
const tokenRe = /[A-Za-z]+(?:[' -][A-Za-z]+)*/g;
let out = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const hits = [];
  function scan(v, pth) {
    if (typeof v === 'string') {
      if (SKIP_PATH.test(pth) || SKIP_BRANCH.test(pth)) return;
      if (/^https?:/.test(v.trim())) return;
      const tokens = v.match(tokenRe) || [];
      const bad = [];
      for (const t of tokens) {
        if (WHITELIST.has(t)) continue;
        if (/^[A-Z]{1,4}(-[A-Z]+)?$/.test(t)) continue;
        const idx = v.indexOf(t);
        const before = v.slice(Math.max(0, idx - 1), idx);
        if (before === '（' || before === '(') continue;
        bad.push(t);
      }
      if (bad.length) hits.push(`[${pth}] tokens=${JSON.stringify(bad)}\n${v}\n`);
    } else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${pth}[${i}]`));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) scan(v[k], `${pth}.${k}`);
  }
  scan(data, '');
  if (hits.length) {
    out.push('===== ' + path.relative(root, file) + ' =====');
    out = out.concat(hits);
  }
}
fs.writeFileSync(path.join(__dirname, 'fragment-context.txt'), out.join('\n'), 'utf8');
console.log('written', out.length, 'blocks');
