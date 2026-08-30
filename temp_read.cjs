const fs = require('fs');
const c = JSON.parse(fs.readFileSync('cases/推理小说/日本/白夜行.json', 'utf8'));
console.log(JSON.stringify(c, null, 2));
