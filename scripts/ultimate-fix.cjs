/**
 * 彻底修复 - 所有英文改纯中文
 * 用法: node scripts/ultimate-fix.cjs
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

// 彻底替换规则
const replacements = [
  // 游戏平台 - 纯中文
  ['iOS手机', '苹果手机'],
  ['iOS', '苹果手机'],
  ['Android', '安卓手机'],
  ['Mobile', '手机'],
  ['PC', '电脑'],
  ['Mac', '苹果电脑'],
  ['Switch', ' Switch主机'],
  ['PS3', ' PS3主机'],
  ['PS4', ' PS4主机'],
  ['PS5', ' PS5主机'],
  ['PSP', ' PSP掌机'],
  ['PSV', ' PSV掌机'],
  ['3DS', ' 3DS掌机'],
  ['DS掌机', ' DS掌机'],
  ['GBA', ' GBA掌机'],
  ['Xbox One', ' Xbox主机'],
  ['Xbox Series主机', ' Xbox系列主机'],
  ['Xbox Series', ' Xbox系列主机'],
  ['Xbox', ' Xbox主机'],
  ['Console', '游戏主机'],
  
  // 开发商 - 纯中文描述
  ['Level-5（雷顿教授开发商）', '日本游戏开发商Level-5'],
  ['Level-5', '日本游戏开发商'],
  ['Cing公司', '日本游戏开发商Cing'],
  ['Cing', '日本游戏开发商'],
  ['Kaizen Game Works（天堂岛杀手开发商）', '英国游戏开发商'],
  ['Kaizen Game Works', '英国游戏开发商'],
  ['Lucas Pope（奥伯拉丁开发者）', '独立游戏开发者'],
  ['Lucas Pope', '独立游戏开发者'],
  ['Spike Chunsoft（弹丸论破开发商）', '日本游戏开发商'],
  ['Spike Chunsoft', '日本游戏开发商'],
  ['Chunsoft（极限脱出开发商）', '日本游戏开发商'],
  ['Chunsoft', '日本游戏开发商'],
  ['ZA/UM（极乐迪斯科开发商）', '爱沙尼亚游戏开发商'],
  ['ZA/UM', '爱沙尼亚游戏开发商'],
  ['Team Bondi（黑色洛城开发商）', '澳大利亚游戏开发商'],
  ['Team Bondi', '澳大利亚游戏开发商'],
  
  // 其他英文
  ['COVID-19', '新冠'],
  ['Helter Skelter', ' Helter Skelter（混乱）'],
  ['Momento Mortem', '死亡纪念怀表'],
  ['Memento Mortem', '死亡纪念怀表'],
  ['Obra Dinn', '奥伯拉丁号'],
  ['Return of the Obra Dinn', '奥伯拉丁的回归'],
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
