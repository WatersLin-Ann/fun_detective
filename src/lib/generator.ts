// 关卡生成器工具函数
import type { CaseWithSlug } from './types';

// 线索时机到阶段的映射
const timingToStage: Record<string, number> = {
  '开篇': 0,
  '前期': 1,
  '中期': 2,
  '后期': 3,
  '终局': 3,
};

// 生成的关卡结构类型
export interface LevelStage {
  阶段名称: string;
  玩家目标: string;
  关键机制: string[];
  线索分配: Array<{
    线索编号?: string;
    线索内容?: string;
    线索类型?: string;
    指向结论?: string;
    出现时机?: string;
  }>;
  设计要点: string[];
}

export interface LevelStructure {
  基本信息: {
    案例名称: string;
    案例类型: string;
    模板名称: string;
    核心诡计: string;
    适配诡计: string[];
    难度评分: {
      线索密度: number;
      误导数量: number;
      诡计隐蔽度: number;
      综合: number;
    };
  };
  阶段设计: LevelStage[];
  难度曲线: string;
  机制配置: Array<{
    机制名称: string;
    实现方式: string;
    对应阶段: number[];
  }>;
  改编建议?: {
    改编方向: string;
    核心玩法: string;
    关键机制: string[];
    难度适配: string;
    改编说明: string;
  };
}

// 模板类型
interface TemplateStage {
  阶段: string;
  玩家目标: string;
  关键机制: string[];
  设计要点?: string;
}

interface GameTemplate {
  描述: string;
  核心循环: string;
  阶段设计: TemplateStage[];
  适配诡计类型: string[];
  参考案例: string[];
  难度曲线: string;
  适合时长: string;
}

// 将线索分配到阶段
export function mapCluesToStages(clues: any[], stages: TemplateStage[]) {
  const stageClues: LevelStage['线索分配'][] = stages.map(() => []);
  
  clues.forEach((clue) => {
    const timing = clue.出现时机 || '中期';
    const stageIndex = timingToStage[timing] ?? 1;
    const targetIndex = Math.min(stageIndex, stages.length - 1);
    stageClues[targetIndex].push(clue);
  });
  
  return stageClues;
}

// 推荐适配模板
export function recommendTemplate(caseData: CaseWithSlug, templates: Record<string, GameTemplate>) {
  const caseTricks = new Set(caseData.设计视图.诡计类型 || []);
  
  const scored = Object.entries(templates).map(([name, template]) => {
    const matchCount = (template.适配诡计类型 || []).filter((t) => caseTricks.has(t)).length;
    return { name, score: matchCount, template };
  });
  
  return scored.sort((a, b) => b.score - a.score);
}

// 生成关卡结构
export function generateLevelStructure(
  caseData: CaseWithSlug,
  templateName: string,
  template: GameTemplate
): LevelStructure {
  const stages = template.阶段设计 || [];
  const clues = caseData.设计视图.线索链 || [];
  const stageClues = mapCluesToStages(clues, stages);
  
  // 生成阶段设计
  const levelStages: LevelStage[] = stages.map((stage, index) => {
    const designPoints: string[] = [];
    if (stage.设计要点) designPoints.push(stage.设计要点);
    
    // 根据案例特点补充设计要点
    if (index === 0 && caseData.故事视图.故事摘要) {
      designPoints.push(`开场需快速建立案件背景：${caseData.基本信息.一句话简介}`);
    }
    if (index === stages.length - 1 && caseData.故事视图.结局) {
      designPoints.push('结局设计需呼应案件真相，提供明确的推理反馈');
    }
    
    return {
      阶段名称: stage.阶段,
      玩家目标: stage.玩家目标,
      关键机制: stage.关键机制 || [],
      线索分配: stageClues[index] || [],
      设计要点: designPoints,
    };
  });
  
  // 生成机制配置
  const allMechanisms = new Set<string>();
  stages.forEach((s) => (s.关键机制 || []).forEach((m) => allMechanisms.add(m)));
  
  const mechanismConfig = Array.from(allMechanisms).map((mechanism) => {
    const stageIndices = stages
      .map((s, i) => ((s.关键机制 || []).includes(mechanism) ? i : -1))
      .filter((i) => i >= 0);
    
    return {
      机制名称: mechanism,
      实现方式: getMechanismImplementation(mechanism, caseData),
      对应阶段: stageIndices,
    };
  });
  
  // 查找最匹配的改编建议
  let adaptationSuggestion: LevelStructure['改编建议'];
  const adaptations = (caseData.设计视图 as any).游戏化改编建议 || [];
  if (adaptations.length > 0) {
    // 选择与模板最匹配的改编建议
    adaptationSuggestion = adaptations[0];
  }
  
  return {
    基本信息: {
      案例名称: caseData.基本信息.案件名称,
      案例类型: caseData.sourceType,
      模板名称: templateName,
      核心诡计: caseData.设计视图.核心诡计简述 || '未指定',
      适配诡计: (template.适配诡计类型 || []).filter((t) =>
        (caseData.设计视图.诡计类型 || []).includes(t)
      ),
      难度评分: caseData.设计视图.难度评分,
    },
    阶段设计: levelStages,
    难度曲线: template.难度曲线 || '前期低→中期中→后期高',
    机制配置: mechanismConfig,
    改编建议: adaptationSuggestion,
  };
}

// 获取机制的实现方式建议
function getMechanismImplementation(mechanism: string, caseData: CaseWithSlug): string {
  const implementations: Record<string, string> = {
    '证据收集': `在场景中放置可交互物品，玩家点击收集。本案可设置${Math.min(5, (caseData.设计视图.线索链 || []).length)}件关键证据。`,
    '矛盾指证': '玩家在证词中发现矛盾后，选择对应证据进行指证。正确指证推进剧情，错误指证扣除信心值。',
    '对话选择': '与NPC对话时提供2-3个选项，不同选项影响获取的信息和NPC态度。',
    '线索拼接': '玩家将多条线索组合，推导出新的结论。可设计为拖拽式拼图界面。',
    '时间回溯': '玩家可回到之前的时间点，利用新获得的信息改变行动。需设计流程图显示已探索分支。',
    '多视角切换': '在不同角色视角之间切换，每个视角有独特信息。关键真相需要交叉对比多视角信息。',
    '心理量表': '记录玩家与NPC的关系值，影响对话选项和结局。可设计为隐藏数值，通过反馈间接体现。',
    '环境探查': '场景中设置可调查的热点，鼠标悬停高亮。关键线索藏在环境细节中。',
    '密室谜题': '设计需要特定物品或密码才能打开的机关。谜题答案藏在场景线索中。',
    '时间线还原': '玩家将事件按时间顺序排列，还原案件经过。可设计为时间轴拖拽界面。',
    '嫌疑人档案': '为每个嫌疑人建立档案，记录证词、动机、不在场证明。随调查进展更新。',
    '法庭对决': '分为询问和质证两个环节。询问获取信息，质证指出矛盾。设计节奏感强的对决氛围。',
    '搜查推理': '在场景中自由探索，收集证据后自动整理推理。设计为开放探索+线性推进结合。',
    '推理拼图': '将推理过程拆分为多个碎片，玩家逐步拼凑完整真相。每个碎片对应一条关键线索。',
    '模式识别': '在多起案件中寻找共同模式，玩家需建立案件之间的联系。可设计为案件对比板。',
  };
  
  return implementations[mechanism] || `根据案件特点设计${mechanism}的具体实现方式，确保与核心诡计配合。`;
}

// 导出为Markdown
export function exportToMarkdown(structure: LevelStructure): string {
  const lines: string[] = [];
  
  lines.push(`# ${structure.基本信息.案例名称} - 关卡结构设计`);
  lines.push('');
  lines.push(`> 基于「${structure.基本信息.模板名称}」模板生成`);
  lines.push('');
  
  // 基本信息
  lines.push('## 一、基本信息');
  lines.push('');
  lines.push(`| 项目 | 内容 |`);
  lines.push(`|------|------|`);
  lines.push(`| 案例名称 | ${structure.基本信息.案例名称} |`);
  lines.push(`| 案例类型 | ${structure.基本信息.案例类型} |`);
  lines.push(`| 使用模板 | ${structure.基本信息.模板名称} |`);
  lines.push(`| 核心诡计 | ${structure.基本信息.核心诡计} |`);
  lines.push(`| 适配诡计 | ${structure.基本信息.适配诡计.join('、') || '无'} |`);
  lines.push(`| 综合难度 | ${structure.基本信息.难度评分.综合} |`);
  lines.push(`| 难度曲线 | ${structure.难度曲线} |`);
  lines.push('');
  
  // 阶段设计
  lines.push('## 二、阶段设计');
  lines.push('');
  structure.阶段设计.forEach((stage, index) => {
    lines.push(`### 阶段${index + 1}：${stage.阶段名称}`);
    lines.push('');
    lines.push(`**玩家目标**：${stage.玩家目标}`);
    lines.push('');
    lines.push(`**关键机制**：${stage.关键机制.join('、') || '无'}`);
    lines.push('');
    
    if (stage.线索分配.length > 0) {
      lines.push(`**线索分配**（${stage.线索分配.length}条）：`);
      lines.push('');
      stage.线索分配.forEach((clue, i) => {
        lines.push(`${i + 1}. **${clue.线索内容 || '未命名线索'}**`);
        if (clue.线索类型) lines.push(`   - 类型：${clue.线索类型}`);
        if (clue.指向结论) lines.push(`   - 指向：${clue.指向结论}`);
        if (clue.出现时机) lines.push(`   - 时机：${clue.出现时机}`);
      });
      lines.push('');
    }
    
    if (stage.设计要点.length > 0) {
      lines.push('**设计要点**：');
      lines.push('');
      stage.设计要点.forEach((point) => {
        lines.push(`- ${point}`);
      });
      lines.push('');
    }
  });
  
  // 机制配置
  lines.push('## 三、机制配置');
  lines.push('');
  lines.push('| 机制名称 | 实现方式 | 对应阶段 |');
  lines.push('|----------|----------|----------|');
  structure.机制配置.forEach((mech) => {
    const stages = mech.对应阶段.map((i) => `阶段${i + 1}`).join('、');
    lines.push(`| ${mech.机制名称} | ${mech.实现方式} | ${stages} |`);
  });
  lines.push('');
  
  // 改编建议
  if (structure.改编建议) {
    lines.push('## 四、改编建议');
    lines.push('');
    lines.push(`**改编方向**：${structure.改编建议.改编方向}`);
    lines.push('');
    lines.push(`**核心玩法**：${structure.改编建议.核心玩法}`);
    lines.push('');
    lines.push(`**关键机制**：${structure.改编建议.关键机制.join('、')}`);
    lines.push('');
    lines.push(`**难度适配**：${structure.改编建议.难度适配}`);
    lines.push('');
    lines.push(`**改编说明**：${structure.改编建议.改编说明}`);
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  lines.push('*由 Fun Detective 关卡生成器自动生成*');
  
  return lines.join('\n');
}

// 导出为JSON
export function exportToJSON(structure: LevelStructure): string {
  return JSON.stringify(structure, null, 2);
}

// 触发文件下载
export function downloadFile(content: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
