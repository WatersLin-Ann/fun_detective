// 案件数据加载器
import type { CaseData, CaseWithSlug, RelatedWork, RelationType } from './types';

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
  const asia = ['中国', '日本', '韩国', '印度', '约旦'];
  const europe = ['英国', '法国', '德国', '芬兰', '爱沙尼亚', '葡萄牙', '西班牙', '俄罗斯', '苏联', '挪威', '荷兰'];
  const northAmerica = ['美国', '加拿大'];
  const southAmerica = ['阿根廷'];
  const oceania = ['澳大利亚', '新西兰'];

  if (asia.includes(region)) return '亚洲';
  if (europe.includes(region)) return '欧洲';
  if (northAmerica.includes(region)) return '北美洲';
  if (southAmerica.includes(region)) return '南美洲';
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
  // 按固定顺序排序：亚洲、欧洲、北美洲、南美洲、大洋洲、其他
  const order = ['亚洲', '欧洲', '北美洲', '南美洲', '大洋洲', '其他'];
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

// ========== 关联作品：反向索引 ==========

// 关联关系反向映射表
const reverseRelationMap: Record<RelationType, RelationType> = {
  '改编为': '改编自',
  '改编自': '改编为',
  '原型为': '改编为',
  '衍生': '灵感来源',
  '灵感来源': '衍生',
  '同系列': '同系列',
  '翻拍': '翻拍',
  '其他': '其他',
};

/**
 * 构建关联作品反向索引
 * key: 被关联的站内Slug
 * value: 反向关联的作品信息数组（含来源案件的 slug 和基本信息）
 */
function buildReverseRelationIndex(): Map<string, Array<{ work: RelatedWork; fromSlug: string; fromName: string; fromSourceType: string }>> {
  const index = new Map<string, Array<{ work: RelatedWork; fromSlug: string; fromName: string; fromSourceType: string }>>();
  const cases = loadAllCases();

  for (const c of cases) {
    const works = c.基本信息.关联作品 || [];
    for (const work of works) {
      if (work.站内Slug) {
        const key = work.站内Slug;
        if (!index.has(key)) {
          index.set(key, []);
        }
        index.get(key)!.push({
          work,
          fromSlug: c.slug,
          fromName: c.基本信息.案件名称,
          fromSourceType: c.sourceType,
        });
      }
    }
  }

  return index;
}

/**
 * 获取指定案件的所有关联作品（正向 + 反向合并）
 * 正向：当前案件的 基本信息.关联作品
 * 反向：其他案件的 关联作品 中通过 站内Slug 指向当前案件的条目
 */
export function getRelatedWorks(slug: string): RelatedWork[] {
  const currentCase = getCaseBySlug(slug);
  if (!currentCase) return [];

  // 正向关联
  const forwardWorks: RelatedWork[] = [...(currentCase.基本信息.关联作品 || [])];

  // 反向关联
  const reverseIndex = buildReverseRelationIndex();
  const reverseEntries = reverseIndex.get(slug) || [];

  const reverseWorks: RelatedWork[] = reverseEntries.map(({ work, fromSlug, fromName, fromSourceType }) => {
    // 将对方案件本身作为关联作品展示
    const reverseRelation = reverseRelationMap[work.关联关系] || '其他';
    // 推断对方作品类型：根据来源类型映射
    const workTypeMap: Record<string, RelatedWork['作品类型']> = {
      '推理小说': '小说',
      '影视': '电影',
      '游戏': '游戏',
      '真实案件': '其他',
      '历史谜案': '其他',
      '其他': '其他',
    };
    return {
      作品名称: fromName,
      作品类型: workTypeMap[fromSourceType] || '其他',
      关联关系: reverseRelation,
      站内Slug: fromSlug,
      _isReverse: true,
    };
  });

  // 合并并去重（按 站内Slug 或 作品名称+作品类型 去重）
  const seen = new Set<string>();
  const result: RelatedWork[] = [];

  for (const work of [...forwardWorks, ...reverseWorks]) {
    const key = work.站内Slug || `${work.作品名称}-${work.作品类型}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(work);
    }
  }

  return result;
}
