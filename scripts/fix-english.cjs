/**
 * 全面修复英文残片
 * 用法: node scripts/fix-english.cjs
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

// 替换规则
const replacements = [
  // 游戏平台
  ['"Mac"', '"苹果电脑"'],
  ['"Xbox One"', '"Xbox主机"'],
  ['"Xbox Series X"', '"Xbox Series主机"'],
  ['"Xbox Series X/S"', '"Xbox Series主机"'],
  ['"PS3"', '"PS3主机"'],
  ['"PS4"', '"PS4主机"'],
  ['"PS5"', '"PS5主机"'],
  ['"PSP"', '"PSP掌机"'],
  ['"PSV"', '"PSV掌机"'],
  ['"3DS"', '"3DS掌机"'],
  ['"DS"', '"DS掌机"'],
  ['"GBA"', '"GBA掌机"'],
  ['"Switch"', '"Switch主机"'],
  ['"iOS"', '"iOS手机"'],
  ['"Android"', '"安卓手机"'],
  ['"Mobile"', '"手机"'],
  ['"PC"', '"电脑"'],
  
  // 英文残片
  ['COVID-19', '新冠'],
  ['"y"', '"泰y娅"'],
  ['Helter Skelter', ' Helter Skelter（混乱）'],
  ['Momento Mortem', 'Momento Mortem（死亡纪念）'],
  ['Lucas Pope', 'Lucas Pope（卢卡斯·波普）'],
  ['Kaizen Game Works', 'Kaizen Game Works'],
];

let fixed = 0;
files.forEach(fp => {
  let content = fs.readFileSync(fp, 'utf-8');
  let changed = false;
  
  replacements.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(fp, content, 'utf-8');
    fixed++;
  }
});

console.log(`修复了 ${fixed} 个文件`);
