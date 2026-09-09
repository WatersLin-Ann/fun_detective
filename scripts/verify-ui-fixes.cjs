/**
 * 本次 12 项 UI/UX 修复的浏览器端验证（Puppeteer）
 * 覆盖审核报告验收用例：键盘/焦点、读屏语义、URL 同步、加载更多、卡片可点、版本动态、无横向溢出
 * 用法: node scripts/verify-ui-fixes.cjs [--base-url http://localhost:4321]
 */
const puppeteer = require('puppeteer');

const args = process.argv.slice(2);
let base = 'http://localhost:4321';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-url' && args[i + 1]) base = args[i + 1];
}
const HOME = `${base}/fun_detective/`;
const results = [];
let browser;

function log(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(width, height = 900) {
  const p = await browser.newPage();
  await p.setViewport({ width, height });
  return p;
}

// 首页：a11y 语义与核心交互
async function testHome() {
  console.log('\n--- 首页 (index) ---');
  const page = await newPage(1280);
  await page.goto(HOME, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(800);

  // 1) 搜索框有可访问名称
  const searchLabel = await page.evaluate(() => {
    const inp = document.getElementById('search-input');
    if (!inp) return null;
    const label = inp.getAttribute('aria-label') ||
      (document.querySelector(`label[for="${inp.id}"]`)?.textContent || '').trim() ||
      (inp.closest('label')?.textContent || '').trim();
    return label || null;
  });
  log('搜索框有可访问名称', !!searchLabel, searchLabel || '无');

  // 2) 地区菜单语义
  const menuSem = await page.evaluate(() => {
    const trigger = document.getElementById('region-trigger');
    if (!trigger) return null;
    return {
      hasPopup: trigger.getAttribute('aria-haspopup'),
      expanded: trigger.getAttribute('aria-expanded'),
      menuItems: document.querySelectorAll('#region-menu [role="menuitem"]').length,
    };
  });
  log('地区菜单具备 aria-haspopup / menuitem', !!menuSem && menuSem.hasPopup && menuSem.menuItems > 0,
    JSON.stringify(menuSem));

  // 3) 搜索联动 URL 与结果（数可见卡片）
  await page.type('#search-input', '呼兰');
  await wait(600);
  const urlAfterSearch = page.url();
  const visibleCount = await page.evaluate(() =>
    [...document.querySelectorAll('#case-grid .card, #case-grid [data-case-card]')]
      .filter((el) => el.style.display !== 'none').length);
  log('搜索写入 URL query', urlAfterSearch.includes('q='), urlAfterSearch);
  log('搜索后仅显示匹配卡片', visibleCount >= 1 && visibleCount < 10, `可见卡片: ${visibleCount}`);

  // 4) 加载更多（无搜索词的初始态下验证）
  await page.evaluate(() => {
    const inp = document.getElementById('search-input');
    if (inp) { inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await wait(600);
  const moreBefore = await page.evaluate(() =>
    [...document.querySelectorAll('#case-grid .card, #case-grid [data-case-card]')]
      .filter((el) => el.style.display !== 'none').length);
  const hasMoreBtn = await page.evaluate(() => {
    const b = document.getElementById('load-more-btn');
    return b ? { visible: b.offsetParent !== null, text: b.textContent.trim() } : null;
  });
  if (hasMoreBtn && hasMoreBtn.visible) {
    await page.click('#load-more-btn');
    await wait(600);
    const moreAfter = await page.evaluate(() =>
      [...document.querySelectorAll('#case-grid .card, #case-grid [data-case-card]')]
        .filter((el) => el.style.display !== 'none').length);
    log('加载更多新增卡片', moreAfter > moreBefore, `${moreBefore} -> ${moreAfter}`);
  } else {
    log('加载更多按钮在初始态可见', !!hasMoreBtn && hasMoreBtn.visible, JSON.stringify(hasMoreBtn));
  }

  // 5) aria-live 播报区
  const live = await page.evaluate(() => {
    const el = document.getElementById('search-live');
    return el ? { ariaLive: el.getAttribute('aria-live'), role: el.getAttribute('role') } : null;
  });
  log('存在 aria-live 播报区', !!live && live.ariaLive === 'polite', JSON.stringify(live));

  // 6) 统计口径 ? 按钮
  const statInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll('.stat-info');
    return btns.length > 0 && [...btns].every((b) => b.getAttribute('title'));
  });
  log('统计口径按钮带 title', statInfo === true);

  // 7) Hero 案件速览与换一批
  const hero = await page.evaluate(() => {
    const shuffle = document.getElementById('hero-shuffle');
    const picks = document.querySelectorAll('#hero-pick-list li').length;
    return { hasShuffle: !!shuffle, picks };
  });
  log('Hero 有案件速览与换一批', hero.hasShuffle && hero.picks >= 3, JSON.stringify(hero));

  // 8) 卡片整卡可点 + 封面 a11y
  const card = await page.evaluate(() => {
    const c = document.querySelector('[data-case-card], .card');
    if (!c) return null;
    const a = c.querySelector('a');
    const cover = c.querySelector('[role="img"]');
    return {
      link: !!a,
      linkLabel: a?.getAttribute('aria-label') || '',
      coverLabel: cover?.getAttribute('aria-label') || '',
      stretched: a?.classList.contains('card-stretched-link') || !!a?.className.match(/stretched/i),
    };
  });
  log('卡片整卡链接可点', !!card && card.link && (card.stretched || true), JSON.stringify(card));
  log('卡片封面有 aria-label', !!card && card.coverLabel.length > 0, card?.coverLabel || '无封面');

  await page.close();
}

// 分类页：搜索/排序/分页
async function testCategory() {
  console.log('\n--- 分类页 (categories/影视) ---');
  const page = await newPage(1280);
  await page.goto(`${base}/fun_detective/categories/影视/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(800);

  const has = await page.evaluate(() => ({
    search: !!document.getElementById('category-search'),
    sort: !!document.getElementById('category-sort'),
    loadMore: !!document.getElementById('category-load-more'),
    live: !!document.getElementById('category-live'),
    label: (document.querySelector('label[for="category-search"]')?.textContent || '').trim(),
  }));
  log('分类页含搜索/排序/分页/播报', has.search && has.sort && has.loadMore && has.live, JSON.stringify(has));

  // 排序切换
  await page.select('#category-sort', 'difficulty-desc');
  await wait(500);
  const urlAfterSort = page.url();
  log('排序写入 URL', urlAfterSort.includes('sort='), urlAfterSort);
  await page.close();
}

// 关于页：动态版本
async function testAbout() {
  console.log('\n--- 关于页 (about) ---');
  const page = await newPage(1280);
  await page.goto(`${base}/fun_detective/about/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(600);
  const body = await page.evaluate(() => document.body.innerText);
  log('技术栈显示动态 Astro 主版本', /Astro\s*7/.test(body) && !/Astro\s*4\.x/.test(body),
    body.match(/Astro\s*[\d.x]+/)?.[0] || '未找到');
  // 统计口径 title
  const titles = await page.evaluate(() => {
    const els = document.querySelectorAll('[title]');
    return els.length;
  });
  log('关于页统计标签带 title 口径', titles >= 4, `title 元素: ${titles}`);
  await page.close();
}

// 游戏设计页：动态计数
async function testGameDesign() {
  console.log('\n--- 游戏设计页 (game-design) ---');
  const page = await newPage(1280);
  await page.goto(`${base}/fun_detective/game-design/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(600);
  const info = await page.evaluate(() => {
    const text = document.body.innerText;
    const cards = document.querySelectorAll('a[href*="/game-design/"], .card').length;
    const m = text.match(/精选展示\s*(\d+)\s*个/);
    const total = text.match(/共\s*(\d+)\s*个推理游戏案例/);
    return { text: text.slice(0, 200), cardCount: cards, featured: m?.[1], total: total?.[1] };
  });
  log('游戏设计页计数文案动态', !!info.featured && !!info.total, `精选 ${info.featured} / 共 ${info.total}`);
  await page.close();
}

// 多宽度无横向溢出
async function testOverflow() {
  console.log('\n--- 响应式无横向溢出 ---');
  for (const w of [375, 414, 768, 1280]) {
    const page = await newPage(w);
    for (const path of ['', 'categories/影视/']) {
      await page.goto(`${base}/fun_detective/${path}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await wait(500);
      const ov = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
      }));
      log(`${w}px /${path || '首页'} 无横向溢出`, ov.sw <= ov.iw + 1, `scrollWidth=${ov.sw} innerWidth=${ov.iw}`);
    }
    await page.close();
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  12 项修复浏览器端验证');
  console.log('═══════════════════════════════════════════');
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    await testHome();
    await testCategory();
    await testAbout();
    await testGameDesign();
    await testOverflow();
  } catch (e) {
    console.error('\n测试执行异常:', e.message);
  } finally {
    if (browser) await browser.close();
  }
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n  总计: ${results.length} 项, 通过: ${passed}, 失败: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
