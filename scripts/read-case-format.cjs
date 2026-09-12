const fs = require('fs');
const path = require('path');

// 读取一个案件文件查看格式
const caseFile = path.join(__dirname, '..', 'cases', '推理小说', '英国', '东方快车谋杀案.json');
const content = fs.readFileSync(caseFile, 'utf8');
const data = JSON.parse(content);

console.log('=== 字段列表 ===');
console.log(JSON.stringify(Object.keys(data), null, 2));
console.log('\n=== 完整内容（前3000字符）===');
console.log(JSON.stringify(data, null, 2).substring(0, 3000));
