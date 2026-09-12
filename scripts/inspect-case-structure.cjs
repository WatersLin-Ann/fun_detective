const fs = require('fs');
const path = require('path');

const caseFile = path.join(__dirname, '..', 'cases', '推理小说', '英国', '东方快车谋杀案.json');
const content = fs.readFileSync(caseFile, 'utf8');
const data = JSON.parse(content);

console.log('=== 顶层字段 ===');
console.log(JSON.stringify(Object.keys(data), null, 2));

console.log('\n=== 基本信息 ===');
console.log(JSON.stringify(data['基本信息'], null, 2));

console.log('\n=== 故事视图（前1000字符）===');
console.log(JSON.stringify(data['故事视图'], null, 2).substring(0, 1000));

console.log('\n=== 元数据 ===');
console.log(JSON.stringify(data['元数据'], null, 2));
