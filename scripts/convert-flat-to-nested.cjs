/**
 * 将扁平格式的案件JSON转换为嵌套格式
 * 匹配现有案件的结构：id / 基本信息 / 故事视图 / 设计视图 / 游戏设计 / 元数据
 */
const fs = require('fs');
const path = require('path');

const CASES_DIR = path.join(__dirname, '..', 'cases');

// 需要转换的新增案件列表（扁平格式）
const newCases = [
  // 第一批
  '推理小说/日本/如首无作祟之物.json',
  '推理小说/日本/脑髓地狱.json',
  '推理小说/日本/黑死馆杀人事件.json',
  '推理小说/日本/献给虚无的供物.json',
  '推理小说/日本/匣中失乐.json',
  '推理小说/日本/有翼之暗.json',
  '推理小说/日本/夏与冬的奏鸣曲.json',
  '推理小说/日本/独眼少女.json',
  '影视/美国/盗梦空间.json',
  '影视/美国/沉默的羔羊.json',
  '影视/韩国/杀人回忆.json',
  '影视/美国/万能钥匙.json',
  '影视/日本/未麻的部屋.json',
  '真实案件/美国/黄道十二宫杀手.json',
  // 第二批
  '推理小说/日本/络新妇之理.json',
  '推理小说/日本/铁鼠之槛.json',
  '推理小说/日本/阴摩罗鬼之瑕.json',
  '推理小说/日本/北方夕鹤2-3杀人.json',
  '推理小说/日本/出云传说7-8杀人.json',
  '推理小说/日本/迷宫馆事件.json',
  '推理小说/日本/人偶馆事件.json',
  '推理小说/日本/黑猫馆事件.json',
  '推理小说/日本/暗黑馆事件.json',
  // 第三批
  '影视/美国/老无所依.json',
  '影视/美国/小岛惊魂.json',
  '影视/美国/冰血暴.json',
  // 第六批
  '推理小说/日本/新参者.json',
  '推理小说/日本/红手指.json',
  '推理小说/日本/祈祷落幕时.json',
];

let converted = 0;
let failed = 0;

for (const relativePath of newCases) {
  const filePath = path.join(CASES_DIR, relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`跳过（不存在）: ${relativePath}`);
    continue;
  }
  
  try {
    const flat = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 检查是否已经是嵌套格式
    if (flat['基本信息']) {
      console.log(`跳过（已是嵌套格式）: ${relativePath}`);
      continue;
    }
    
    // 转换为嵌套格式
    const nested = {
      id: flat.name,
      基本信息: {
        案件名称: flat.name,
        来源类型: flat.type,
        创作者: flat.creator,
        地区: flat.region,
        年代: flat.year ? String(flat.year) : '未知',
        发表年份: flat.year,
        难度评分: flat.difficulty,
        标签: flat.tags || [],
        一句话简介: flat.summary || '',
      },
      故事视图: {
        完整故事: flat.plot || '',
        人物关系: (flat.characters || []).map(c => ({
          姓名: c.name,
          角色: c.role,
          简介: c.desc,
        })),
        核心诡计: flat.trick || '',
      },
      设计视图: {
        推荐理由: flat.worthReading || '',
        阅读建议: '',
      },
      游戏设计: {
        可玩度: 0,
        互动元素: [],
      },
      元数据: {
        数据来源: '网络搜索核实',
        核实状态: '已核实真实存在',
        创建时间: new Date().toISOString(),
      },
    };
    
    fs.writeFileSync(filePath, JSON.stringify(nested, null, 2), 'utf8');
    console.log(`已转换: ${relativePath}`);
    converted++;
  } catch (err) {
    console.error(`转换失败: ${relativePath} - ${err.message}`);
    failed++;
  }
}

console.log(`\n转换完成！成功: ${converted} 个，失败: ${failed} 个`);
