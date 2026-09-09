/**
 * 案件数据英文残片迁移脚本（P2-05）
 * 规则：
 *  - GLOBAL_PLAIN：全局散文词汇，统一译为中文
 *  - PER_FILE：按文件生效的人名/地名词典，首次出现为「中文（原文）」，其后仅中文；
 *    路径以 .姓名 结尾的结构化字段始终保留原文
 *  - FULL_REPLACE：整段字符串的定向替换（如整句英文简介）
 * 运行：node scripts/migrate-english-fragments.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');

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

// 全局：英文散文词/通用词 → 中文（首次出现加原文注释的用 [中文, 原文] 形式）
const GLOBAL_PLAIN = {
  'vs': '对',
  'unnamed': '没有名字',
  'aunt': '姨妈',
  'guilt': '愧疚',
  'repeatedly': '反复',
  'whistleblower': '内部举报人',
  'episodic': '章节式',
  'sarcastic': '尖酸刻薄',
  'helpful': '乐于助人',
  'mercenary': '雇佣兵',
  'freezer': '冷冻柜',
  'infrasound': '次声波',
  'A-B-C': 'A、B、C',
  'aspiring actress': '怀揣演员梦的年轻女演员',
  'allegedly': '据称',
};

// 定向整段替换（精确匹配整个字符串）
const FULL_REPLACE = {
  '1947年洛杉矶， aspiring actress Elizabeth Short was found brutally murdered, body cut in half and posed, case remains unsolved.':
    '1947年洛杉矶，怀揣演员梦的伊丽莎白·肖特（Elizabeth Short）被残忍杀害，尸体被切成两半并摆成特定姿势，案件至今未破。',
  ' aspiring actress，22岁': '怀揣演员梦的女演员，22岁',
};

// 人名/地名：[中文, 原文]；按文件名匹配，避免跨文件误替换
const PER_FILE = {
  '七宗罪': {
    'William Somerset': ['威廉·萨默塞特'],
    'David Mills': ['大卫·米尔斯'],
    'John Doe': ['约翰·杜'],
    'Tracy Mills': ['特蕾茜·米尔斯'],
    'Somerset': '萨默塞特', 'Mills': '米尔斯', 'Doe': '杜', 'Tracy': '特蕾茜',
  },
  '控方证人': {
    'Leonard Vole': ['伦纳德·沃尔'],
    'Christine Vole': ['克里斯汀·沃尔'],
    'Wilfrid Robarts': ['威尔弗里德·罗巴茨'],
    'Emily French': ['埃米莉·弗伦奇'],
    'Janet Mackenzie': ['珍妮特·麦肯齐'],
    'Leonard': '伦纳德', 'Christine': '克里斯汀', 'Robarts': '罗巴茨',
    'French': '弗伦奇', 'Diana': '戴安娜', 'Max': '马克斯',
  },
  '消失的爱人': {
    'Amy Dunne': ['艾米·邓恩'], 'Nick Dunne': ['尼克·邓恩'],
    'Desi Collings': ['德西·科林斯'], 'Tanner Bolt': ['坦纳·博尔特'],
    'Andie': ['安迪'],
    'Amy': '艾米', 'Nick': '尼克', 'Desi': '德西',
  },
  '非常嫌疑犯': {
    "Roger 'Verbal' Kint": ['罗杰·“维伯”·金特'],
    'Keyser Söze': ['凯撒·索泽'],
    'Dave Kujan': ['戴夫·库扬'],
    'Dean Keaton': ['迪恩·基顿'],
    'Michael McManus': ['迈克尔·麦克马纳斯'],
    'Fred Fenster': ['弗雷德·芬斯特'],
    'Todd Hockney': ['托德·霍克尼'],
    'Saul Berg': ['索尔·伯格'],
    'Redfoot': '雷德富特', 'Kobayashi': '小林',
    'Verbal': '维伯', 'Kint': '金特', 'Söze': '索泽',
    'Kujan': '库扬', 'Keaton': '基顿', 'Fenster': '芬斯特',
  },
  '十二宫杀手': {
    'David Faraday': ['大卫·法拉第'], 'Betty Lou Jensen': ['贝蒂·卢·詹森'],
    'Blue Rock Springs': ['蓝岩泉'], 'Darlene Ferrin': ['达琳·费林'],
    'Mike Mageau': ['迈克·马乔'], 'Bryan Hartnell': ['布莱恩·哈特内尔'],
    'Cecelia Shepard': ['塞西莉亚·谢泼德'], 'Paul Stine': ['保罗·斯泰恩'],
    'Arthur Leigh Allen': ['亚瑟·利·艾伦'],
    'Vallejo': '瓦列霍', 'Napa': '纳帕', 'Berryessa': '贝里埃萨',
    'Ferrin': '费林', 'Mageau': '马乔', 'Shepard': '谢泼德',
    'Hartnell': '哈特内尔', 'Stine': '斯泰恩', 'Jensen': '詹森', 'Allen': '艾伦',
  },
  '泰德·邦迪': {
    'Lynda Ann Healy': ['琳达·安·希利'], 'Donna Gail Manson': ['唐娜·盖尔·曼森'],
    'Susan Rancourt': ['苏珊·兰科特'], 'Roberta Parks': ['罗伯塔·帕克斯'],
    'Brenda Ball': ['布伦达·鲍尔'], 'Georgann Hawkins': ['乔治安·霍金斯'],
    'Lake Sammamish': ['萨马米什湖'], 'Elizabeth Kloepfer': ['伊丽莎白·克洛普弗'],
    'Carol DaRonch': ['卡罗尔·达龙奇'], 'Chi Omega': ['奇奥米加'],
    'Lisa Levy': ['莉萨·利维'], 'Cheryl Thomas': ['谢丽尔·托马斯'],
    'Kimberly Leach': ['金伯莉·利奇'], 'Margaret Bowman': ['玛格丽特·鲍曼'],
    'Ted': '泰德',
  },
  '辛普森杀妻案': {
    'Nicole Brown Simpson': ['妮可·布朗·辛普森'], 'Ron Goldman': ['罗恩·戈德曼'],
    'Mark Fuhrman': ['马克·弗尔曼'], 'A.C. Cowlings': ['A.C.考林斯'],
    'Johnnie Cochran': ['约翰尼·科克伦'], 'F. Lee Bailey': ['F.李·贝利'],
    'Alan Dershowitz': ['艾伦·德肖维茨'],
    'Nicole': '妮可', 'Goldman': '戈德曼', 'Fuhrman': '弗尔曼',
    'Cowlings': '考林斯', 'Bronco': '烈马',
  },
  '黑色大丽花': {
    'Elizabeth Short': ['伊丽莎白·肖特', 'Elizabeth Short'],
    'Leimert Park': ['莱默特公园'], 'Robert Manley': ['罗伯特·曼利'],
    'George Hodel': ['乔治·霍德尔'],
    'Short': '肖特', 'Manley': '曼利', 'Biltmore': '比尔提摩', 'Hodel': '霍德尔',
  },
  '迪亚特洛夫事件': {
    'Otorten': ['奥托尔滕'], 'Kholat Syakhl': ['霍拉特夏赫尔'], 'Vizhai': ['维扎伊'],
  },
  '极乐迪斯科': {
    "Harrier 'Harry' Du Bois": ['哈里尔·“哈里”·杜博阿'],
    'Harry Du Bois': ['哈里·杜博阿'],
    'Kim Kitsuragi': ['金·曷城'], 'Evrart Claire': ['埃弗拉特·克莱尔'],
    'Revachol': '瑞瓦肖', 'Garte': '加特', 'Klaasje': '克拉谢',
    'Lely': '莱利', 'Du Bois': '杜博阿', 'Harrier': '哈里尔', 'Harry': '哈里',
  },
  '传送门2': {
    'P-body': ['P体'],
  },
  '塔科马': {
    'AI Odin': ['AI 奥丁'], 'Venturis': ['文特里斯'], 'Odin': ['奥丁'],
    'crew': ['乘组', 'crew'],
  },
  '玛德琳': {
    'Ocean Club': ['海洋俱乐部'], 'Tapas': ['塔帕斯'],
    'The Disappearance of Madeleine McCann': ['玛德琳·麦卡恩的失踪'],
  },
  'Hello Kitty藏尸案': {
    'Hello Kitty': ['凯蒂猫'],
  },
  '极限脱出': {
    'Rupert Sheldrake': ['鲁珀特·谢尔德雷克'],
  },
  'AI：梦境档案': {
    'Psync': ['精神同步', 'Psync'], 'Boss': ['老板', 'Boss'],
  },
  '428：被封锁的涩谷（续）': {
    'Bonus': ['番外', 'Bonus'],
  },
  '黑色洛城': {
    'Vice': ['风化组', 'Vice'],
  },
  '蓝可儿事件': {
    'contributing factor': ['促成因素之一', 'contributing factor'],
  },
  '钟表馆事件': {
    'CHAOS': ['混沌', 'CHAOS'],
  },
  '命运石之门': {
    'Reading Steiner': ['命运探知', 'Reading Steiner'],
  },
  '血字的研究': {
    'Rachel': ['蕾切尔'],
  },
  '开膛手杰克': {
    'canonical five': ['“经典五案”', 'canonical five'],
  },
  'BTK杀手案': {
    'Torture': '折磨', 'Kill': '杀害',
  },
  '山姆之子案': {
    'Galaxie': ['“银河”', 'Galaxie'],
  },
};

// 转义正则特殊字符
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 渲染「中文（原文）」：首次出现加括号原文，其后仅中文。
// 若后随开括号（如「英文名（中文注释）」），仍返回带原文形式，
// 重复的中文注释由 cleanup-spacing 的 reTriple 清理
function renderName(zh, orig, first, out, offset, m) {
  if (!first) return zh;
  return `${zh}（${orig}）`;
}

// 判断某位置是否已处于「（原文）」注释内（向前找最近的未闭合开括号；
// 括号内含中文 → 普通中文括号，不保护，其中的英文残片仍应翻译）
function insideGloss(text, start) {
  const before = text.slice(0, start);
  const cn = before.lastIndexOf('（');
  const en = before.lastIndexOf('(');
  const open = Math.max(cn, en);
  if (open === -1) return false;
  const between = text.slice(open + 1, start);
  if (between.includes('）') || between.includes(')')) return false;
  if (/[\u4e00-\u9fff]/.test(between)) return false;
  return true;
}

function migrateFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  const rel = path.basename(file, '.json');
  const fileDict = Object.entries(PER_FILE).find(([k]) => rel.includes(k))?.[1] || {};
  const seen = new Set();
  let changed = 0;

  // 合并词典，长 key 优先
  const entries = [
    ...Object.entries(fileDict).map(([k, v]) => [k, v, true]),
    ...Object.entries(GLOBAL_PLAIN).map(([k, v]) => [k, v, false]),
  ].sort((a, b) => b[0].length - a[0].length);

  function replaceIn(str, isNameField) {
    let out = str;
    if (FULL_REPLACE[str] !== undefined) {
      changed++;
      return FULL_REPLACE[str];
    }
    for (const [key, val, isName] of entries) {
      const re = new RegExp(esc(key), 'g');
      out = out.replace(re, (m, offset) => {
        // 幂等保护：处于括号注释内的片段（如已生成的「中文（原文）」）不再替换
        if (offset > 0 && insideGloss(out, offset)) return m;
        changed++;
        if (typeof val === 'string') {
          // 全局散文词：直接译中文；文件词典内的短名（字符串形式）首次出现保留原文
          if (!isName) return val;
          const first = !seen.has(key) || isNameField;
          seen.add(key);
          return renderName(val, key, first, out, offset, m);
        }
        const [zh, orig] = val;
        // 首次出现或结构化姓名字段：中文（原文）；其后仅中文。原文缺省取 key 本身
        const first = !seen.has(key) || isNameField;
        seen.add(key);
        return renderName(zh, orig || key, first, out, offset, m);
      });
    }
    // 血字的研究：为无注释的 RACHE 补释义
    let before = out;
    if (rel.includes('血字的研究')) {
      out = out
        .replace(/墙上用血写着RACHE。/g, '墙上用血写着德文血字“RACHE”（意为复仇）。')
        .replace(/现场同样留下"RACHE"字样/g, '现场同样留下“RACHE”（复仇）字样')
        .replace(/读者不知道墙上的RACHE是德语复仇/g, '读者不知道墙上的“RACHE”是德语“复仇”')
        .replace(/墙上血字被警方误认为是女人名Rachel/g, '墙上血字被警方误认为是女人名蕾切尔（Rachel）')
        .replace(/墙上的“RACHE”是德语“复仇”而非女人名蕾切尔/g, '墙上的德文血字“RACHE”（复仇）并非女人名蕾切尔');
    }
    // 冰菓：英文双关补中文解释
    if (rel.includes('冰菓')) {
      out = out.replace(/含义是I scream，/g, '含义是英文“I scream”（意为“我尖叫”），');
    }
    if (out !== before) changed++;
    return out;
  }

  function walkNode(v, pth) {
    if (typeof v === 'string') {
      return replaceIn(v, /(^|\.)姓名$/.test(pth));
    }
    if (Array.isArray(v)) return v.map((x, i) => walkNode(x, `${pth}[${i}]`));
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) v[k] = walkNode(v[k], `${pth}.${k}`);
      return v;
    }
    return v;
  }
  walkNode(data, '');

  if (changed > 0) {
    let text = JSON.stringify(data, null, 2);
    if (raw.includes('\r\n')) text = text.replace(/\n/g, '\r\n');
    if (raw.endsWith('\n')) text += '\r\n';
    if (!DRY) fs.writeFileSync(file, text, 'utf8');
    console.log(`${DRY ? '[dry] ' : ''}${rel}: ${changed} 处替换`);
  }
  return changed;
}

const root = path.join(__dirname, '..', 'cases');
let total = 0;
for (const f of walk(root)) total += migrateFile(f);
console.log(`\n合计 ${total} 处替换${DRY ? '（dry-run，未写盘）' : '（已写盘）'}`);
