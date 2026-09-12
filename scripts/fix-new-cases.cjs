/**
 * 修复新增案件的问题：
 * 1. 游戏平台"Console"改为"游戏主机"
 * 2. 英文残片翻译
 * 3. 删除重复案件
 * 用法: node scripts/fix-new-cases.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// 删除重复案件
const duplicates = [
  'cases/真实案件/英国/哈罗德·希普曼医生.json',
  'cases/真实案件/美国/黄道十二宫杀手.json', // 与十二宫杀手重复
];

duplicates.forEach(f => {
  const fp = path.join(ROOT, f);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
    console.log(`删除重复: ${f}`);
  }
});

// 修复所有案件文件
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
let fixed = 0;

files.forEach(fp => {
  let content = fs.readFileSync(fp, 'utf-8');
  let changed = false;
  
  // 修复游戏平台
  if (content.includes('"Console"')) {
    content = content.replace(/"Console"/g, '"游戏主机"');
    changed = true;
  }
  
  // 修复英文残片
  const fixes = [
    ['"y"', '"女友"'],
    ['"COVID-19"', '"新冠"'],
    ['widower', '鳏夫'],
  ];
  
  fixes.forEach(([from, to]) => {
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
console.log(`当前案件总数: ${files.length - duplicates.filter(f => fs.existsSync(path.join(ROOT, f)) === false).length}`);
