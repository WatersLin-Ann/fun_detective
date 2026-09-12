/**
 * 全面修复英文残片 - 最终版
 * 用法: node scripts/fix-all-english.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function walkDir(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(f => {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) results.push(...walkDir(fp));
    else if (f.endsWith('.json')) results.push(fp);
  });
  return results;
}

const casesDir = path.join(ROOT, 'cases');
const files = walkDir(casesDir);

// 替换规则 - 按顺序执行
const replacements = [
  // 游戏平台 - 全部中文
  [/"iOS"/g, '"iOS手机"'],
  [/"Android"/g, '"安卓手机"'],
  [/"Mobile"/g, '"手机"'],
  [/"PC"/g, '"电脑"'],
  [/"Mac"/g, '"苹果电脑"'],
  [/"Switch"/g, '"Switch主机"'],
  [/"PS3"/g, '"PS3主机"'],
  [/"PS4"/g, '"PS4主机"'],
  [/"PS5"/g, '"PS5主机"'],
  [/"PSP"/g, '"PSP掌机"'],
  [/"PSV"/g, '"PSV掌机"'],
  [/"3DS"/g, '"3DS掌机"'],
  [/"DS"/g, '"DS掌机"'],
  [/"GBA"/g, '"GBA掌机"'],
  [/"Xbox One"/g, '"Xbox主机"'],
  [/"Xbox Series X\/S"/g, '"Xbox Series主机"'],
  [/"Xbox Series X"/g, '"Xbox Series主机"'],
  [/"Xbox Series"/g, '"Xbox Series主机"'],
  [/"Console"/g, '"游戏主机"'],
  
  // 特定的y问题
  [/"y"/g, '"泰y娅"'],
  
  // COVID
  [/COVID-19/g, '新冠'],
  
  // 作者公司名 - 加中文译名
  [/"Level-5"/g, '"Level-5（雷顿教授开发商）"'],
  [/"Cing"/g, '"Cing（黄昏旅馆开发商）"'],
  [/"Kaizen Game Works"/g, '"Kaizen Game Works（天堂岛杀手开发商）"'],
  [/"Lucas Pope"/g, '"Lucas Pope（奥伯拉丁开发者）"'],
  [/"Spike Chunsoft"/g, '"Spike Chunsoft（弹丸论破开发商）"'],
  [/"Chunsoft"/g, '"Chunsoft（极限脱出开发商）"'],
  [/"ZA\/UM"/g, '"ZA/UM（极乐迪斯科开发商）"'],
  [/"Team Bondi"/g, '"Team Bondi（黑色洛城开发商）"'],
];

let fixed = 0;
files.forEach(fp => {
  let content = fs.readFileSync(fp, 'utf-8');
  let changed = false;
  
  replacements.forEach(([regex, to]) => {
    const before = content;
    content = content.replace(regex, to);
    if (content !== before) changed = true;
  });
  
  if (changed) {
    fs.writeFileSync(fp, content, 'utf-8');
    fixed++;
  }
});

console.log(`修复了 ${fixed} 个文件`);
