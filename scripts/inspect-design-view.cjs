const fs = require('fs');
const path = require('path');

const caseFile = path.join(__dirname, '..', 'cases', '推理小说', '英国', '东方快车谋杀案.json');
const data = JSON.parse(fs.readFileSync(caseFile, 'utf8'));

console.log('=== 设计视图 ===');
console.log(JSON.stringify(data['设计视图'], null, 2));

console.log('\n=== 游戏设计 ===');
console.log(JSON.stringify(data['游戏设计'], null, 2));

console.log('\n=== 元数据 ===');
console.log(JSON.stringify(data['元数据'], null, 2));
