// 案件列表浏览器：搜索、筛选、排序、客户端分页、URL 状态同步、加载反馈
// 首页与分类页共用，避免筛选逻辑重复实现
import Fuse from 'fuse.js';

export interface CaseItem {
  element: HTMLElement;
  name: string;
  source: string;
  continent: string;
  region: string;
  difficulty: number;
  date: string;
  searchText: string;
}

export interface BrowserOptions {
  grid: HTMLElement;
  search?: HTMLInputElement | null;
  source?: HTMLSelectElement | null;
  sort?: HTMLSelectElement | null;
  loadMoreBtn?: HTMLButtonElement | null;
  loadMoreContainer?: HTMLElement | null;
  count?: HTMLElement | null;
  noResults?: HTMLElement | null;
  /** aria-live 播报区域 */
  live?: HTMLElement | null;
  pageSize?: number;
  /** 是否把 q/source/sort/page 同步到 URL query string */
  syncUrl?: boolean;
  /** 额外筛选器（首页的大洲/国家二级菜单使用） */
  extraFilter?: (item: CaseItem) => boolean;
  /** 每次渲染后的回调（首页用于同步地区按钮文本等） */
  onAfterRender?: (shownCount: number, totalCount: number) => void;
}

export interface CaseBrowser {
  refresh: (extraFilter?: (item: CaseItem) => boolean) => void;
  getFiltered: () => CaseItem[];
}

export function initCaseBrowser(opts: BrowserOptions): CaseBrowser {
  const pageSize = opts.pageSize ?? 12;
  let currentPage = 1;
  let currentFiltered: CaseItem[] = [];
  let extraFilter = opts.extraFilter;
  let lastShownCount = 0;

  // 从 DOM data-* 提取案件数据
  const caseItems: CaseItem[] = Array.from(opts.grid.querySelectorAll('[data-case]')).map((el) => {
    const element = el as HTMLElement;
    return {
      element,
      name: element.dataset.name || '',
      source: element.dataset.source || '',
      continent: element.dataset.continent || '',
      region: element.dataset.region || '',
      difficulty: parseFloat(element.dataset.difficulty || '0'),
      date: element.dataset.date || '',
      searchText: (element.dataset.searchtext || '').toLowerCase(),
    };
  });

  const fuse = new Fuse(caseItems, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'searchText', weight: 0.3 },
      { name: 'source', weight: 0.1 },
      { name: 'region', weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 1,
  });

  // ===== URL 状态同步 =====
  function readUrlState() {
    if (!opts.syncUrl) return;
    const params = new URLSearchParams(window.location.search);
    if (opts.search && params.has('q')) opts.search.value = params.get('q') || '';
    if (opts.source && params.has('source')) opts.source.value = params.get('source') || '';
    if (opts.sort && params.has('sort')) opts.sort.value = params.get('sort') || '';
    const p = parseInt(params.get('page') || '1', 10);
    if (!Number.isNaN(p) && p > 1) currentPage = p;
  }

  function writeUrlState() {
    if (!opts.syncUrl) return;
    const params = new URLSearchParams(window.location.search);
    const q = opts.search?.value.trim() || '';
    const source = opts.source?.value || '';
    const sort = opts.sort?.value || '';
    if (q) params.set('q', q); else params.delete('q');
    if (source) params.set('source', source); else params.delete('source');
    if (sort && sort !== 'date') params.set('sort', sort); else params.delete('sort');
    if (currentPage > 1) params.set('page', String(currentPage)); else params.delete('page');
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    window.history.replaceState(null, '', url);
  }

  // ===== 渲染 =====
  function render(announce = false) {
    caseItems.forEach((item) => {
      item.element.style.display = 'none';
    });

    const endIndex = currentPage * pageSize;
    const toShow = currentFiltered.slice(0, endIndex);
    toShow.forEach((item) => {
      opts.grid.appendChild(item.element);
      item.element.style.display = '';
    });

    if (opts.loadMoreContainer) {
      if (endIndex >= currentFiltered.length) {
        opts.loadMoreContainer.classList.add('hidden');
      } else {
        opts.loadMoreContainer.classList.remove('hidden');
        if (opts.loadMoreBtn) {
          opts.loadMoreBtn.disabled = false;
          opts.loadMoreBtn.textContent = `加载更多（已显示 ${toShow.length}/${currentFiltered.length}）`;
        }
      }
    }

    if (opts.count) opts.count.textContent = `共 ${currentFiltered.length} 条`;
    if (opts.noResults) opts.noResults.classList.toggle('hidden', currentFiltered.length > 0);

    if (announce && opts.live) {
      opts.live.textContent = `当前显示 ${toShow.length} 条，共 ${currentFiltered.length} 条匹配结果`;
    }
    opts.onAfterRender?.(toShow.length, currentFiltered.length);
    writeUrlState();
    return toShow;
  }

  function applyFilters() {
    const query = opts.search?.value.trim() || '';
    const source = opts.source?.value || '';
    const sort = opts.sort?.value || 'date';

    let filtered: CaseItem[];
    if (query) {
      filtered = fuse.search(query).map((r) => r.item);
    } else {
      filtered = [...caseItems];
    }

    filtered = filtered.filter((item) => {
      const matchSource = !source || item.source === source;
      return matchSource && (!extraFilter || extraFilter(item));
    });

    if (!query || sort !== 'date') {
      filtered.sort((a, b) => {
        switch (sort) {
          case 'name':
            return a.name.localeCompare(b.name, 'zh-CN');
          case 'difficulty-desc':
            return b.difficulty - a.difficulty;
          case 'difficulty-asc':
            return a.difficulty - b.difficulty;
          case 'date':
          default:
            return b.date.localeCompare(a.date);
        }
      });
    }

    currentFiltered = filtered;
    currentPage = 1;
    render(true);
  }

  // ===== 加载更多：禁用反馈 + 焦点落点 + aria-live =====
  function loadMore() {
    if (!opts.loadMoreBtn) return;
    const prevShown = Math.min(currentPage * pageSize, currentFiltered.length);
    opts.loadMoreBtn.disabled = true;
    opts.loadMoreBtn.textContent = '正在加载…';
    // 让浏览器先绘制加载状态，再完成同步渲染
    window.setTimeout(() => {
      currentPage += 1;
      const toShow = render(true);
      // 焦点落到第一条新增卡片的标题链接
      const firstNew = toShow[prevShown];
      const link = firstNew?.element.querySelector('a') as HTMLAnchorElement | null;
      link?.focus({ preventScroll: false });
    }, 80);
  }

  // ===== 事件绑定 =====
  opts.search?.addEventListener('input', applyFilters);
  opts.source?.addEventListener('change', applyFilters);
  opts.sort?.addEventListener('change', applyFilters);
  opts.loadMoreBtn?.addEventListener('click', loadMore);

  // 浏览器前进/后退时恢复状态
  window.addEventListener('popstate', () => {
    currentPage = 1;
    readUrlState();
    applyFilters();
  });

  readUrlState();
  applyFilters();
  lastShownCount = currentFiltered.length;

  return {
    refresh(newExtraFilter?: (item: CaseItem) => boolean) {
      if (newExtraFilter) extraFilter = newExtraFilter;
      applyFilters();
    },
    getFiltered: () => currentFiltered,
  };
}
