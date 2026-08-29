// 案件数据加载器
import type { CaseData, CaseWithSlug } from './types';

// 导入所有案件 JSON 文件（Vite 静态导入）
const caseModules = import.meta.glob('../../cases/**/*.json', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

// 生成 slug
function generateSlug(sourceType: string, region: string, name: string): string {
  return `${sourceType}/${region}/${name}`;
}

// 从文件路径提取来源类型和地区
function parsePath(filePath: string): { sourceType: string; region: string } {
  // 路径格式: ../../cases/来源类型/地区/案件名称.json
  const parts = filePath.replace('../../cases/', '').replace('.json', '').split('/');
  return {
    sourceType: parts[0] || '未分类',
    region: parts[1] || '未分类',
  };
}

// 加载所有案件
export function loadAllCases(): CaseWithSlug[] {
  const cases: CaseWithSlug[] = [];

  for (const [filePath, rawContent] of Object.entries(caseModules)) {
    try {
      const caseData = JSON.parse(rawContent) as CaseData;
      const { sourceType, region } = parsePath(filePath);
      const slug = generateSlug(sourceType, region, caseData.基本信息.案件名称);

      cases.push({
        ...caseData,
        slug,
        sourceType,
        region,
      });
    } catch (e) {
      console.error(`解析案件文件失败: ${filePath}`, e);
    }
  }

  // 按录入日期排序（最新的在前）
  return cases.sort((a, b) => {
    const dateA = a.元数据?.录入日期 || '';
    const dateB = b.元数据?.录入日期 || '';
    return dateB.localeCompare(dateA);
  });
}

// 根据 slug 获取单个案件
export function getCaseBySlug(slug: string): CaseWithSlug | undefined {
  const cases = loadAllCases();
  return cases.find((c) => c.slug === slug);
}

// 获取所有来源类型
export function getSourceTypes(): string[] {
  const cases = loadAllCases();
  return [...new Set(cases.map((c) => c.sourceType))].sort();
}

// 获取所有地区
export function getRegions(): string[] {
  const cases = loadAllCases();
  return [...new Set(cases.map((c) => c.region))].sort();
}

// 获取所有诡计类型
export function getTrickTypes(): string[] {
  const cases = loadAllCases();
  const tricks = new Set<string>();
  cases.forEach((c) => c.设计视图.诡计类型.forEach((t) => tricks.add(t)));
  return [...tricks].sort();
}

// 按来源类型筛选
export function filterBySourceType(sourceType: string): CaseWithSlug[] {
  return loadAllCases().filter((c) => c.sourceType === sourceType);
}

// 按地区筛选
export function filterByRegion(region: string): CaseWithSlug[] {
  return loadAllCases().filter((c) => c.region === region);
}

// 获取统计数据
export function getStats() {
  const cases = loadAllCases();
  return {
    total: cases.length,
    bySourceType: cases.reduce((acc, c) => {
      acc[c.sourceType] = (acc[c.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byRegion: cases.reduce((acc, c) => {
      acc[c.region] = (acc[c.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgDifficulty: cases.length > 0
      ? (cases.reduce((sum, c) => sum + (c.设计视图.难度评分.综合 || 0), 0) / cases.length).toFixed(1)
      : '0',
  };
}
