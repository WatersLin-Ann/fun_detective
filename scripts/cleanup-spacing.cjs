// 迁移后排版清理：仅作用于本次迁移涉及的文件
// 1) 中/全角字符之间的多余半角空格收敛
// 2) 中文与 ASCII 单引号（作中文引号用）之间的空格收敛
// 3) 开膛手 canonical five 一处引号整理
const fs = require('fs');
const path = require('path');

const TARGETS = [
  '目击者之追凶','隐秘的角落','搏击俱乐部','穆赫兰道','七宗罪','控方证人','消失的爱人',
  '非常嫌疑犯','ZOO-向阳之诗','钟表馆事件','ABC谋杀案','血字的研究','逃生',
  '428：被封锁的涩谷（续）','AI：梦境档案','命运石之门','极限脱出','塔科马','黑色洛城',
  '极乐迪斯科','传送门2','心灵杀手','Hello Kitty藏尸案','迪亚特洛夫事件','BTK杀手案',
  '山姆之子案','杰弗里·达默案','辛普森杀妻案','十二宫杀手','泰德·邦迪','蓝可儿事件',
  '黑色大丽花','开膛手杰克','玛德琳·麦卡恩失踪案','呼兰大侠案','冰菓',
];

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

const CJK = '\\u3000-\\u303F\\uFF00-\\uFFEF\\u4E00-\\u9FFF\\u00B7'; // 含全角标点与间隔号·
const reBetween = new RegExp('([' + CJK + '])[ \\t]+([' + CJK + '])', 'g');
const reBeforeApos = new RegExp('([' + CJK + '])[ \\t]+\'', 'g');
const reAfterApos = new RegExp('\'[ \\t]+([' + CJK + '])', 'g');
// 「中文（原文）（同中文）」→「中文（原文）」；「中文（同中文）」→「中文」
const reTriple = new RegExp('([' + CJK + ']{1,16})（([A-Za-z0-9 .\\u2019\\u201c\\u201d\\u0027-]{1,40})）（\\1）', 'g');
const reDupZh = new RegExp('([' + CJK + ']{1,16})（\\1）', 'g');

let n = 0;
for (const file of walk(path.join(__dirname, '..', 'cases'))) {
  const base = path.basename(file, '.json');
  if (!TARGETS.includes(base)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  let changed = 0;
  function clean(v) {
    if (typeof v === 'string') {
      let out = v;
      let prev;
      do { prev = out; out = out.replace(reBetween, '$1$2'); } while (out !== prev);
      out = out.replace(reBeforeApos, '$1\'').replace(reAfterApos, '\'$1');
      out = out.replace(reTriple, '$1（$2）').replace(reDupZh, '$1');
      out = out.replace(/'\s*“经典五案”（canonical five）\s*'/g, '“经典五案”（canonical five）');
      if (out !== v) changed++;
      return out;
    }
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = clean(v[k]); return v; }
    return v;
  }
  clean(data);
  if (changed) {
    let text = JSON.stringify(data, null, 2);
    if (raw.includes('\r\n')) text = text.replace(/\n/g, '\r\n');
    if (raw.endsWith('\n')) text += '\r\n';
    fs.writeFileSync(file, text, 'utf8');
    n++;
    console.log(base + ': 清理 ' + changed + ' 字段');
  }
}
console.log('清理文件数:', n);
