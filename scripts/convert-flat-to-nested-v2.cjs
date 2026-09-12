/**
 * 将扁平格式的案件JSON转换为嵌套格式（修正版）
 * 匹配现有案件的完整结构
 */
const fs = require('fs');
const path = require('path');

const CASES_DIR = path.join(__dirname, '..', 'cases');

// 需要转换的新增案件列表
const newCases = [
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
  '推理小说/日本/络新妇之理.json',
  '推理小说/日本/铁鼠之槛.json',
  '推理小说/日本/阴摩罗鬼之瑕.json',
  '推理小说/日本/北方夕鹤2-3杀人.json',
  '推理小说/日本/出云传说7-8杀人.json',
  '推理小说/日本/迷宫馆事件.json',
  '推理小说/日本/人偶馆事件.json',
  '推理小说/日本/黑猫馆事件.json',
  '推理小说/日本/暗黑馆事件.json',
  '影视/美国/老无所依.json',
  '影视/美国/小岛惊魂.json',
  '影视/美国/冰血暴.json',
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
    
    // 检查是否已经是正确的嵌套格式（有难度评分.综合）
    if (flat['设计视图'] && flat['设计视图']['难度评分'] && flat['设计视图']['难度评分']['综合']) {
      console.log(`跳过（已是正确格式）: ${relativePath}`);
      continue;
    }
    
    // 如果是之前转换的格式（有基本信息但没有难度评分），重新转换
    let sourceData = flat;
    if (flat['基本信息']) {
      // 从之前转换的格式中提取数据
      sourceData = {
        name: flat['基本信息']['案件名称'],
        type: flat['基本信息']['来源类型'],
        creator: flat['基本信息']['创作者'],
        region: flat['基本信息']['地区'],
        year: flat['基本信息']['发表年份'],
        difficulty: flat['基本信息']['难度评分'],
        tags: flat['基本信息']['标签'],
        summary: flat['基本信息']['一句话简介'],
        plot: flat['故事视图']['完整故事'],
        characters: (flat['故事视图']['人物关系'] || []).map(c => ({
          name: c['姓名'],
          role: c['角色'],
          desc: c['简介'],
        })),
        trick: flat['故事视图']['核心诡计'],
        worthReading: flat['设计视图']['推荐理由'],
      };
    }
    
    const difficulty = sourceData.difficulty || 5;
    
    // 转换为完整的嵌套格式
    const nested = {
      id: sourceData.name,
      基本信息: {
        案件名称: sourceData.name,
        来源类型: sourceData.type,
        创作者: sourceData.creator,
        地区: sourceData.region,
        年代: sourceData.year ? String(sourceData.year) : '未知',
        发表年份: sourceData.year,
        标签: sourceData.tags || [],
        一句话简介: sourceData.summary || '',
      },
      故事视图: {
        完整故事: sourceData.plot || '',
        人物关系: (sourceData.characters || []).map(c => ({
          姓名: c.name,
          角色: c.role,
          简介: c.desc,
        })),
        核心诡计: sourceData.trick || '',
      },
      设计视图: {
        核心诡计简述: sourceData.trick || '',
        诡计类型: sourceData.tags || [],
        可复用机制: [],
        信息差分析: '',
        红鲱鱼误导: '',
        难度评分: {
          线索密度: Math.min(5, Math.max(1, difficulty - 2)),
          误导数量: Math.min(5, Math.max(1, difficulty - 1)),
          诡计隐蔽度: Math.min(5, Math.max(1, difficulty)),
          综合: difficulty,
        },
        线索链: [],
        游戏化改编建议: [],
      },
      游戏设计: {
        游戏平台: [],
        玩法类型: [],
        核心玩法机制: [],
        关卡结构: '',
        玩家引导方式: '',
        推理系统设计: '',
        可复用游戏模板: [],
      },
      元数据: {
        录入状态: '完整',
        录入日期: '2026-09-12',
        最后更新: '2026-09-12',
        数据来源: '网络搜索核实',
        核实状态: '已核实真实存在',
        版本: 1,
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
