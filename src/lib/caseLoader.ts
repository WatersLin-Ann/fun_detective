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

// 从文件路径提取来源类型和地区（国家）
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
      // 大洲优先从 JSON 字段读取，兼容旧数据（无大洲字段时根据地区推断）
      const continent = caseData.基本信息.大洲 || inferContinent(region);

      cases.push({
        ...caseData,
        slug,
        sourceType,
        continent,
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

// 兼容旧数据：根据地区推断大洲
function inferContinent(region: string): string {
  const asia = ['中国', '日本', '韩国'];
  const europe = ['英国', '法国', '德国', '芬兰', '爱沙尼亚', '葡萄牙', '俄罗斯', '苏联'];
  const northAmerica = ['美国', '加拿大'];
  const oceania = ['澳大利亚', '新西兰'];

  if (asia.includes(region)) return '亚洲';
  if (europe.includes(region)) return '欧洲';
  if (northAmerica.includes(region)) return '北美';
  if (oceania.includes(region)) return '大洋洲';
  return '其他';
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

// 获取所有大洲
export function getContinents(): string[] {
  const cases = loadAllCases();
  // 按固定顺序排序：亚洲、欧洲、北美、大洋洲、其他
  const order = ['亚洲', '欧洲', '北美', '大洋洲', '其他'];
  const continents = [...new Set(cases.map((c) => c.continent))];
  return continents.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

// 获取所有国家/地区
export function getRegions(): string[] {
  const cases = loadAllCases();
  return [...new Set(cases.map((c) => c.region))].sort();
}

// 获取指定大洲下的所有国家
export function getRegionsByContinent(continent: string): string[] {
  const cases = loadAllCases();
  return [...new Set(cases.filter((c) => c.continent === continent).map((c) => c.region))].sort();
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

// 按大洲筛选
export function filterByContinent(continent: string): CaseWithSlug[] {
  return loadAllCases().filter((c) => c.continent === continent);
}

// 按国家/地区筛选
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
    byContinent: cases.reduce((acc, c) => {
      acc[c.continent] = (acc[c.continent] || 0) + 1;
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

// 加载诡计-机制映射表
export function getTrickMechanismMap(): Record<string, any> {
  try {
    const data = import.meta.glob('../data/trick-to-mechanism.json', {
      eager: true,
      query: '?raw',
      import: 'default',
    }) as Record<string, string>;
    const firstKey = Object.keys(data);
    return firstKey ? JSON.parse(data[firstKey]) : {};
  } catch (e) {
    console.error('加载诡计映射表失败', e);
    return {};
  }
}

// 加载游戏模板库
export function getGameTemplates(): Record<string, any> {
  try {
    const data = import.meta.glob('../data/game-templates.json', {
      eager: true,
      query: '?raw',
      import: 'default',
    }) as Record<string, string>;
    const firstKey = Object.keys(data);
    return firstKey ? JSON.parse(data[firstKey]) : {};
  } catch (e) {
    console.error('加载游戏模板库失败', e);
    return {};
  }
}

// 获取所有游戏案例
export function getGameCases(): CaseWithSlug[] {
  return loadAllCases().filter((c) => c.sourceType === '游戏');
}
