/**
 * 最终修复
 * 用法: node scripts/final-fix.cjs
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

let fixed = 0;
files.forEach(fp => {
  let content = fs.readFileSync(fp, 'utf-8');
  let changed = false;
  
  // 修复泰y娅 -> 泰雅
  if (content.includes('泰y娅')) {
    content = content.split('泰y娅').join('泰雅');
    changed = true;
  }
  
  // 修复iOS -> iOS手机 (只在游戏平台数组中)
  // 直接替换所有 "iOS" 为 "iOS手机"，但要注意不要替换URL中的
  // 用更精确的方式：只替换 "iOS" 后面跟着 , 或 ] 的情况
  content = content.replace(/"iOS"(?=[,\]\s])/g, '"iOS手机"');
  
  // 修复 Cing -> Cing公司
  content = content.replace(/"Cing"/g, '"Cing公司"');
  
  // 修复 Xbox Series (各种形式)
  content = content.replace(/"Xbox Series[^"]*"/g, '"Xbox Series主机"');
  
  // 修复其他常见英文平台
  content = content.replace(/"Android"(?=[,\]\s])/g, '"安卓手机"');
  content = content.replace(/"Mobile"(?=[,\]\s])/g, '"手机"');
  content = content.replace(/"PC"(?=[,\]\s])/g, '"电脑"');
  content = content.replace(/"Mac"(?=[,\]\s])/g, '"苹果电脑"');
  content = content.replace(/"Switch"(?=[,\]\s])/g, '"Switch主机"');
  content = content.replace(/"Console"(?=[,\]\s])/g, '"游戏主机"');
  
  if (changed || content !== fs.readFileSync(fp, 'utf-8')) {
    fs.writeFileSync(fp, content, 'utf-8');
    fixed++;
  }
});

console.log(`修复了 ${fixed} 个文件`);
