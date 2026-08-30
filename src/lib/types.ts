// 案件数据类型定义

export interface ReferenceLink {
  标题: string;
  URL: string;
  类型?: string;
}

export interface BasicInfo {
  案件名称: string;
  来源类型: string;
  来源作品?: string;
  作者?: string;
  大洲: string;
  地区: string;
  年代?: string;
  案件状态: string;
  一句话简介: string;
  参考链接?: ReferenceLink[];
}

export interface StoryView {
  故事摘要?: string;
  完整故事?: string;
  人物关系?: string;
  关键时间线?: string;
  结局?: string;
}

export interface Difficulty {
  线索密度: number;
  误导数量: number;
  诡计隐蔽度: number;
  综合: number;
}

export interface Clue {
  线索编号?: string;
  线索内容?: string;
  线索类型?: string;
  指向结论?: string;
  出现时机?: string;
}

export interface DesignView {
  核心诡计简述?: string;
  诡计类型: string[];
  可复用机制: string[];
  信息差分析?: string;
  红鲱鱼?: string;
  难度评分: Difficulty;
  线索链: Clue[];
}

export interface GameDesign {
  游戏平台: string[];
  玩法类型: string[];
  核心玩法机制: string[];
  关卡结构?: string;
  玩家引导方式?: string;
  推理系统设计?: string;
  可复用游戏模板: string[];
}

export interface Metadata {
  录入状态: string;
  录入日期: string;
  最后更新: string;
  飞书记录ID?: string;
  版本?: number;
}

export interface CaseData {
  id: string;
  基本信息: BasicInfo;
  故事视图: StoryView;
  设计视图: DesignView;
  游戏设计?: GameDesign;
  元数据: Metadata;
}

export interface CaseWithSlug extends CaseData {
  slug: string;
  sourceType: string;
  continent: string;
  region: string;
}

export interface CharacterProfile {
  姓名: string;
  身份?: string;
  与案件关系?: string;
  动机?: string;
  关键行为?: string;
}
