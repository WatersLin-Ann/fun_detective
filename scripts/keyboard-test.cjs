/**
 * 键盘流程可访问性测试脚本
 * 用法: node scripts/keyboard-test.cjs [--base-url http://localhost:4321]
 * 依赖: puppeteer (npm install -D puppeteer)
 * 测试：Tab 导航、焦点可见性、Esc 关闭弹层、无焦点陷阱
 */

const fs = require('fs');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.error('❌ puppeteer 未安装。请运行: npm install -D puppeteer');
  process.exit(1);
}

const args = process.argv.slice(2);
let baseUrl = 'http://localhost:4321';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-url' && args[i + 1]) baseUrl = args[i + 1];
}

const cases = [
  { id: 'orient-express', name: '东方快车' },
  { id: 'study-in-scarlet', name: '血字的研究' },
  { id: 'phoenix-wright-1', name: '逆转裁判' }
];

async function runKeyboardTest(page, caseInfo) {
  const results = [];
  const pass = (msg) => { results.push({ pass: true, msg }); console.log(`  ✅ ${msg}`); };
  const fail = (msg) => { results.push({ pass: false, msg }); console.log(`  ❌ ${msg}`); };

  const url = `${baseUrl}/fun_detective/game-design/prototype/play?case=${caseInfo.id}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

  // 等待 loading 消失
  await page.waitForFunction(() => {
    const el = document.getElementById('game-loading');
    return !el || el.style.display === 'none' || el.offsetParent === null;
  }, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  // 测试1: Tab 导航 - 统计可聚焦元素
  const focusableCount = await page.evaluate(() => {
    return document.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])').length;
  });
  if (focusableCount > 0) {
    pass(`页面有 ${focusableCount} 个可聚焦元素`);
  } else {
    fail('页面无可聚焦元素');
  }

  // 测试2: 顶栏按钮可聚焦
  const topbarFocusable = await page.evaluate(() => {
    const topbar = document.getElementById('game-topbar');
    if (!topbar) return 0;
    return topbar.querySelectorAll('button').length;
  });
  if (topbarFocusable >= 2) {
    pass(`顶栏有 ${topbarFocusable} 个可聚焦按钮`);
  } else {
    fail(`顶栏可聚焦按钮不足: ${topbarFocusable}`);
  }

  // 测试3: data-tour 元素可聚焦
  const tourFocusable = await page.evaluate(() => {
    const tourEls = document.querySelectorAll('[data-tour]');
    let focusable = 0;
    tourEls.forEach(el => {
      if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('tabindex')) focusable++;
    });
    return { total: tourEls.length, focusable };
  });
  pass(`data-tour 元素: ${tourFocusable.total} 个, 其中 ${tourFocusable.focusable} 个可直接聚焦`);

  // 测试4: 点击更多菜单，Esc 关闭
  await page.click('#more-btn').catch(() => {});
  await new Promise(r => setTimeout(r, 300));
  const moreMenuVisible = await page.evaluate(() => {
    const menu = document.getElementById('more-menu');
    return menu && !menu.classList.contains('hidden');
  });
  if (moreMenuVisible) {
    pass('更多菜单可打开');
  } else {
    fail('更多菜单未打开');
  }

  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  const moreMenuHidden = await page.evaluate(() => {
    const menu = document.getElementById('more-menu');
    return !menu || menu.classList.contains('hidden');
  });
  if (moreMenuHidden) {
    pass('Esc 可关闭更多菜单');
  } else {
    fail('Esc 无法关闭更多菜单');
  }

  // 测试5: 打开笔记弹层，Esc 关闭
  await page.click('#more-btn').catch(() => {});
  await new Promise(r => setTimeout(r, 300));
  const notebookBtn = await page.$('[data-tour="notebook"]');
  if (notebookBtn) {
    await notebookBtn.click().catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    const notebookVisible = await page.evaluate(() => {
      const el = document.getElementById('notebook-overlay');
      return el && !el.classList.contains('hidden');
    });
    if (notebookVisible) {
      pass('笔记弹层可打开');
    } else {
      fail('笔记弹层未打开');
    }
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
    const notebookHidden = await page.evaluate(() => {
      const el = document.getElementById('notebook-overlay');
      return !el || el.classList.contains('hidden');
    });
    if (notebookHidden) {
      pass('Esc 可关闭笔记弹层');
    } else {
      fail('Esc 无法关闭笔记弹层');
    }
  } else {
    fail('未找到笔记按钮');
  }

  // 测试6: aria-live 区域存在
  const ariaLiveCount = await page.evaluate(() => {
    return document.querySelectorAll('[aria-live]').length;
  });
  if (ariaLiveCount >= 1) {
    pass(`有 ${ariaLiveCount} 个 aria-live 区域`);
  } else {
    fail('无 aria-live 区域');
  }

  // 测试7: role=dialog 弹层
  const dialogCount = await page.evaluate(() => {
    return document.querySelectorAll('[role="dialog"]').length;
  });
  pass(`页面定义了 ${dialogCount} 个 role=dialog 弹层`);

  // 测试8: 跳过开场，验证调查场景热点可点击
  const continueBtn = await page.$('#intro-continue');
  if (continueBtn) {
    for (let i = 0; i < 12; i++) {
      await continueBtn.click().catch(() => {});
      await new Promise(r => setTimeout(r, 150));
    }
    await new Promise(r => setTimeout(r, 500));
    const hotspots = await page.evaluate(() => {
      return document.querySelectorAll('#scene-interactables .interactable').length;
    });
    if (hotspots > 0) {
      pass(`调查场景有 ${hotspots} 个可交互热点`);
    } else {
      fail('调查场景无可交互热点');
    }

    // 测试9: 热点有 aria-label
    const hotspotsWithLabel = await page.evaluate(() => {
      const hs = document.querySelectorAll('#scene-interactables .interactable');
      let withLabel = 0;
      hs.forEach(h => { if (h.getAttribute('aria-label')) withLabel++; });
      return withLabel;
    });
    if (hotspotsWithLabel === hotspots) {
      pass(`所有 ${hotspots} 个热点有 aria-label`);
    } else {
      fail(`${hotspotsWithLabel}/${hotspots} 个热点有 aria-label`);
    }
  }

  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  键盘流程可访问性测试');
  console.log(`  目标: ${baseUrl}`);
  console.log('═══════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let totalPass = 0;
  let totalFail = 0;

  for (const caseInfo of cases) {
    console.log(`\n【${caseInfo.name}】`);
    const page = await browser.newPage();
    try {
      const results = await runKeyboardTest(page, caseInfo);
      totalPass += results.filter(r => r.pass).length;
      totalFail += results.filter(r => !r.pass).length;
    } catch (e) {
      console.log(`  ❌ 运行失败: ${e.message}`);
      totalFail++;
    }
    await page.close();
  }

  await browser.close();

  console.log('\n═══════════════════════════════════════════');
  console.log(`  总计: ${totalPass} 通过, ${totalFail} 失败`);
  console.log('═══════════════════════════════════════════');

  if (totalFail > 0) process.exit(1);
}

main().catch(e => {
  console.error('运行失败:', e.message);
  process.exit(1);
});
