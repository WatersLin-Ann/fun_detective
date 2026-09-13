/**
 * 批量填充案件「关联作品」字段
 *
 * 版权合规说明：
 * - 仅记录作品名称、创作者、年份等事实性信息
 * - 简介为概括性描述，不引用受版权保护的原文
 * - 站外链接指向公开的百科/影评页面
 */

const fs = require('fs');
const path = require('path');

const CASES_DIR = path.join(__dirname, '..', 'cases');

// 辅助：读取 JSON
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// 辅助：写入 JSON（保持 2 空格缩进）
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// 辅助：根据 slug 找到文件路径
function findCaseFile(slug) {
  // slug 格式: 来源类型/地区/案件名称
  const parts = slug.split('/');
  if (parts.length < 3) return null;
  const [sourceType, region, ...nameParts] = parts;
  const name = nameParts.join('/');
  const filePath = path.join(CASES_DIR, sourceType, region, name + '.json');
  return fs.existsSync(filePath) ? filePath : null;
}

// 辅助：为指定 slug 的案件添加关联作品（如果已存在同名作品则跳过）
function addRelatedWork(slug, work) {
  const filePath = findCaseFile(slug);
  if (!filePath) {
    console.log('  [跳过] 文件不存在: ' + slug);
    return false;
  }
  const data = readJSON(filePath);
  if (!data.基本信息.关联作品) {
    data.基本信息.关联作品 = [];
  }
  // 去重：按作品名称
  const exists = data.基本信息.关联作品.some(w => w.作品名称 === work.作品名称);
  if (exists) {
    console.log('  [跳过] 已存在: ' + slug + ' -> ' + work.作品名称);
    return false;
  }
  data.基本信息.关联作品.push(work);
  writeJSON(filePath, data);
  console.log('  [添加] ' + slug + ' -> ' + work.作品名称 + ' (' + work.关联关系 + ')');
  return true;
}

let addedCount = 0;
let skipCount = 0;

function add(slug, work) {
  if (addRelatedWork(slug, work)) {
    addedCount++;
  } else {
    skipCount++;
  }
}

console.log('=== 开始填充关联作品数据 ===\n');

// ========== 一、影视 ↔ 推理小说（改编自 / 改编为）==========
console.log('--- 影视 ↔ 推理小说 ---');

// 告白：影视改编自小说
add('影视/日本/告白', {
  作品名称: '告白',
  作品类型: '小说',
  关联关系: '改编自',
  创作者: '凑佳苗',
  年份: 2008,
  简介: '凑佳苗同名长篇小说，以女教师复仇为核心的多视角叙事作品',
  站内Slug: '推理小说/日本/告白',
});
add('推理小说/日本/告白', {
  作品名称: '告白',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '中岛哲也（导演）',
  年份: 2010,
  简介: '根据凑佳苗同名小说改编，中岛哲也执导的悬疑电影',
  站内Slug: '影视/日本/告白',
});

// 祈祷落幕时：影视改编自小说
add('影视/日本/祈祷落幕时', {
  作品名称: '祈祷落幕时',
  作品类型: '小说',
  关联关系: '改编自',
  创作者: '东野圭吾',
  年份: 2013,
  简介: '东野圭吾加贺恭一郎系列最终作，围绕亲情与连环命案展开',
  站内Slug: '推理小说/日本/祈祷落幕时',
});
add('推理小说/日本/祈祷落幕时', {
  作品名称: '祈祷落幕时',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '福泽克雄（导演）',
  年份: 2018,
  简介: '根据东野圭吾同名小说改编，阿部宽主演的加贺系列电影',
  站内Slug: '影视/日本/祈祷落幕时',
});

// ========== 二、真实案件 ↔ 影视（改编为 / 原型为）==========
console.log('\n--- 真实案件 ↔ 影视 ---');

// 华城连环杀人案 ↔ 杀人回忆（站内互链）
add('真实案件/韩国/华城连环杀人案', {
  作品名称: '杀人回忆',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '奉俊昊（导演）',
  年份: 2003,
  简介: '奉俊昊执导，以华城连环杀人案为原型的犯罪悬疑电影',
  站内Slug: '影视/韩国/杀人回忆',
});
add('影视/韩国/杀人回忆', {
  作品名称: '华城连环杀人案',
  作品类型: '其他',
  关联关系: '原型为',
  年份: 1986,
  简介: '韩国华城地区发生的连环杀人案，电影《杀人回忆》的原型事件',
  站内Slug: '真实案件/韩国/华城连环杀人案',
});

// 三亿日元抢劫案（站外）
add('真实案件/日本/三亿日元抢劫案', {
  作品名称: '三亿日元抢劫案相关影视',
  作品类型: '其他',
  关联关系: '衍生',
  简介: '该案被多次改编为影视作品和纪录片，如《三亿日元事件》等',
  外部链接: 'https://zh.wikipedia.org/wiki/三亿日元抢劫案',
});

// 十二宫杀手（站外）
add('真实案件/美国/十二宫杀手', {
  作品名称: '十二宫',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '大卫·芬奇（导演）',
  年份: 2007,
  简介: '大卫·芬奇执导，以十二宫杀手案为原型的犯罪悬疑电影',
  外部链接: 'https://movie.douban.com/subject/1865009/',
});
add('真实案件/美国/黄道十二宫杀手', {
  作品名称: '十二宫',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '大卫·芬奇（导演）',
  年份: 2007,
  简介: '大卫·芬奇执导，以十二宫杀手案为原型的犯罪悬疑电影',
  外部链接: 'https://movie.douban.com/subject/1865009/',
});

// 黑色大丽花（站外）
add('真实案件/美国/黑色大丽花', {
  作品名称: '黑色大丽花',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '布莱恩·德·帕尔玛（导演）',
  年份: 2006,
  简介: '根据詹姆斯·艾尔罗伊小说改编，以黑色大丽花案为背景的犯罪电影',
  外部链接: 'https://movie.douban.com/subject/1477450/',
});
add('真实案件/美国/黑色大丽花案', {
  作品名称: '黑色大丽花',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '布莱恩·德·帕尔玛（导演）',
  年份: 2006,
  简介: '根据詹姆斯·艾尔罗伊小说改编，以黑色大丽花案为背景的犯罪电影',
  外部链接: 'https://movie.douban.com/subject/1477450/',
});
add('真实案件/欧美/黑色大丽花案', {
  作品名称: '黑色大丽花',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '布莱恩·德·帕尔玛（导演）',
  年份: 2006,
  简介: '根据詹姆斯·艾尔罗伊小说改编，以黑色大丽花案为背景的犯罪电影',
  外部链接: 'https://movie.douban.com/subject/1477450/',
});

// 辛普森杀妻案（站外）
add('真实案件/美国/辛普森杀妻案', {
  作品名称: '美国罪案故事：辛普森公诉案',
  作品类型: '电视剧',
  关联关系: '衍生',
  创作者: '瑞恩·墨菲（制作人）',
  年份: 2016,
  简介: 'FX剧集，重现辛普森杀妻案的审判全过程',
  外部链接: 'https://movie.douban.com/subject/26300311/',
});
add('真实案件/欧美/辛普森杀妻案', {
  作品名称: '美国罪案故事：辛普森公诉案',
  作品类型: '电视剧',
  关联关系: '衍生',
  创作者: '瑞恩·墨菲（制作人）',
  年份: 2016,
  简介: 'FX剧集，重现辛普森杀妻案的审判全过程',
  外部链接: 'https://movie.douban.com/subject/26300311/',
});

// 开膛手杰克（站外）
add('真实案件/英国/开膛手杰克', {
  作品名称: '开膛手杰克相关影视',
  作品类型: '其他',
  关联关系: '灵感来源',
  简介: '开膛手杰克案被大量影视、文学作品引用和改编',
  外部链接: 'https://zh.wikipedia.org/wiki/开膛手杰克',
});

// 迪亚特洛夫事件（站外）
add('真实案件/俄罗斯/迪亚特洛夫事件', {
  作品名称: '迪亚特洛夫事件',
  作品类型: '电影',
  关联关系: '改编为',
  创作者: '雷尼·哈林（导演）',
  年份: 2013,
  简介: '以迪亚特洛夫事件为原型的伪纪录恐怖电影',
  外部链接: 'https://movie.douban.com/subject/2270187/',
});

// ========== 三、翻拍关系 ==========
console.log('\n--- 翻拍关系 ---');

add('影视/中国/误杀', {
  作品名称: '误杀瞒天记',
  作品类型: '电影',
  关联关系: '翻拍',
  创作者: '尼西卡特·卡马特（导演）',
  年份: 2015,
  简介: '印度电影《误杀瞒天记》的中国翻拍版',
  站内Slug: '影视/印度/误杀瞒天记',
});
add('影视/印度/误杀瞒天记', {
  作品名称: '误杀',
  作品类型: '电影',
  关联关系: '翻拍',
  创作者: '柯汶利（导演）',
  年份: 2019,
  简介: '根据印度电影《误杀瞒天记》翻拍的中国犯罪悬疑电影',
  站内Slug: '影视/中国/误杀',
});

// ========== 四、推理小说同系列 ==========
console.log('\n--- 推理小说同系列 ---');

// ZOO 短篇集（乙一）
const zooStories = [
  '推理小说/日本/ZOO',
  '推理小说/日本/七个房间',
  '推理小说/日本/小饰与阳子',
  '推理小说/日本/向阳之诗',
  '推理小说/日本/衣橱',
  '推理小说/日本/神的咒语',
  '推理小说/日本/把血液找出来！',
  '推理小说/日本/寒冷森林中的小白屋',
  '推理小说/日本/从前，在太阳西沉的公园里',
  '推理小说/日本/在即将坠落的飞机中',
  '推理小说/日本/远离的夫妇',
];
for (const slug of zooStories) {
  const name = slug.split('/').pop();
  const others = zooStories.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '乙一',
    简介: '乙一短篇集《ZOO》中的篇目',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 冰菓系列（米泽穗信）
const hyoukaSeries = [
  '推理小说/日本/冰菓',
  '推理小说/日本/愚者的片尾',
  '推理小说/日本/库特莉亚芙卡的排序',
];
for (const slug of hyoukaSeries) {
  const others = hyoukaSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '米泽穗信',
    简介: '米泽穗信古典部系列（冰菓系列）作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 馆系列（绫辻行人）
const yaSeries = [
  '推理小说/日本/十角馆事件',
  '推理小说/日本/十角馆杀人预告',
  '推理小说/日本/钟表馆事件',
  '推理小说/日本/钟表馆幽灵',
  '推理小说/日本/迷宫馆事件',
  '推理小说/日本/人偶馆事件',
  '推理小说/日本/暗黑馆事件',
  '推理小说/日本/黑猫馆事件',
];
for (const slug of yaSeries) {
  const others = yaSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '绫辻行人',
    简介: '绫辻行人馆系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 金田一耕助系列（横沟正史）
const kindaichiSeries = [
  '推理小说/日本/本阵杀人事件',
  '推理小说/日本/狱门岛',
  '推理小说/日本/八墓村',
  '推理小说/日本/犬神家族',
  '推理小说/日本/恶魔吹着笛子来',
];
for (const slug of kindaichiSeries) {
  const others = kindaichiSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '横沟正史',
    简介: '横沟正史金田一耕助系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 伽利略系列（东野圭吾）
const galileoSeries = [
  '推理小说/日本/嫌疑人X的献身',
  '推理小说/日本/圣女的救济',
];
for (const slug of galileoSeries) {
  const others = galileoSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '东野圭吾',
    简介: '东野圭吾伽利略系列（汤川学）作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 加贺恭一郎系列（东野圭吾）
const kagaSeries = [
  '推理小说/日本/祈祷落幕时',
  '推理小说/日本/红手指',
  '推理小说/日本/新参者',
];
for (const slug of kagaSeries) {
  const others = kagaSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '东野圭吾',
    简介: '东野圭吾加贺恭一郎系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 波洛系列（阿加莎）
const poirotSeries = [
  '推理小说/英国/东方快车谋杀案',
  '推理小说/英国/尼罗河上的惨案',
  '推理小说/英国/罗杰疑案',
  '推理小说/欧美/ABC谋杀案',
  '推理小说/欧美/人性记录',
  '推理小说/英国/人性记录',
  '推理小说/欧美/啤酒谋杀案',
  '推理小说/英国/啤酒谋杀案',
  '推理小说/欧美/悬崖山庄奇案',
  '推理小说/英国/悬崖山庄奇案',
  '推理小说/欧美/死亡约会',
  '推理小说/约旦/死亡约会',
  '推理小说/法国/高尔夫球场命案',
  '推理小说/英国/斯泰尔斯庄园奇案',
  '推理小说/英国/四魔头',
];
for (const slug of poirotSeries) {
  const others = poirotSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '阿加莎·克里斯蒂',
    简介: '阿加莎·克里斯蒂波洛系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 马普尔系列（阿加莎）
const marpleSeries = [
  '推理小说/欧美/破镜谋杀案',
  '推理小说/欧美/藏书室女尸之谜',
  '推理小说/欧美/谋杀启事',
  '推理小说/英国/谋杀启事',
];
for (const slug of marpleSeries) {
  const others = marpleSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '阿加莎·克里斯蒂',
    简介: '阿加莎·克里斯蒂马普尔小姐系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 菲利普·马洛系列（钱德勒）
const marloweSeries = [
  '推理小说/欧美/漫长的告别',
  '推理小说/美国/漫长的告别',
  '推理小说/欧美/长眠不醒',
];
for (const slug of marloweSeries) {
  const others = marloweSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '小说',
    关联关系: '同系列',
    创作者: '雷蒙德·钱德勒',
    简介: '雷蒙德·钱德勒菲利普·马洛系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// ========== 五、游戏同系列 ==========
console.log('\n--- 游戏同系列 ---');

// 弹丸论破系列
const danganSeries = [
  '游戏/日本/弹丸论破',
  '游戏/日本/弹丸论破2：再见绝望学园',
  '游戏/日本/弹丸论破V3',
];
for (const slug of danganSeries) {
  const others = danganSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '游戏',
    关联关系: '同系列',
    创作者: 'Spike Chunsoft',
    简介: '弹丸论破系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 极限脱出系列
const zeroEscapeSeries = [
  '游戏/日本/9小时9个人9扇门',
  '游戏/日本/极限脱出',
  '游戏/日本/极限脱出2：善人死亡',
  '游戏/日本/极限脱出ADV：善人死亡',
  '游戏/日本/极限脱出：9小时9个人9扇门',
];
for (const slug of zeroEscapeSeries) {
  const others = zeroEscapeSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '游戏',
    关联关系: '同系列',
    创作者: '打越钢太郎',
    简介: '极限脱出系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 逆转裁判系列
const gyakutenSeries = [
  '游戏/日本/逆转裁判',
  '游戏/日本/逆转裁判1-2：逆转姐妹',
  '游戏/日本/逆转裁判2：再见，逆转',
  '游戏/日本/逆转裁判3',
  '游戏/日本/逆转裁判4',
  '游戏/日本/逆转检事',
  '游戏/日本/大逆转裁判',
];
for (const slug of gyakutenSeries) {
  const others = gyakutenSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '游戏',
    关联关系: '同系列',
    创作者: '卡普空',
    简介: '逆转裁判系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

// 寒蝉/海猫系列
const higurashiSeries = [
  '游戏/日本/寒蝉鸣泣之时',
  '游戏/日本/海猫鸣泣之时',
];
for (const slug of higurashiSeries) {
  const others = higurashiSeries.filter(s => s !== slug).map(s => ({
    作品名称: s.split('/').pop(),
    作品类型: '游戏',
    关联关系: '同系列',
    创作者: '07th Expansion',
    简介: '07th Expansion 鸣泣系列作品',
    站内Slug: s,
  }));
  for (const w of others) {
    add(slug, w);
  }
}

console.log('\n=== 填充完成 ===');
console.log('新增: ' + addedCount + ' 条');
console.log('跳过（已存在/文件不存在）: ' + skipCount + ' 条');
