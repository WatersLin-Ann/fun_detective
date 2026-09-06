/**
 * 截图回归测试脚本
 * 用法: node scripts/visual-regression.cjs [--base-url http://localhost:4321] [--output docs/screenshots]
 * 依赖: puppeteer (npm install -D puppeteer)
 * 对三案 play 页各截 3 张：loading / 调查 / 审判
 */

const fs = require('fs');
const path = require('path');

// 检查 puppeteer
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.error('❌ puppeteer 未安装。请运行: npm install -D puppeteer');
  console.error('   安装后重新运行此脚本。');
  process.exit(1);
}

// 解析参数
const args = process.argv.slice(2);
let baseUrl = 'http://localhost:4321';
let outputDir = path.join(__dirname, '..', 'docs', 'screenshots');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-url' && args[i + 1]) baseUrl = args[i + 1];
  if (args[i] === '--output' && args[i + 1]) outputDir = path.resolve(args[i + 1]);
}

const cases = [
  { id: 'orient-express', name: '东方快车' },
  { id: 'study-in-scarlet', name: '血字的研究' },
  { id: 'phoenix-wright-1', name: '逆转裁判' }
];

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  截图回归测试 Visual Regression');
  console.log(`  目标: ${baseUrl}`);
  console.log(`  输出: ${outputDir}`);
  console.log('═══════════════════════════════════════════\n');

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let passed = 0;
  let failed = 0;

  for (const caseInfo of cases) {
    const page = await browser.newPage();
    const url = `${baseUrl}/fun_detective/game-design/prototype/play?case=${caseInfo.id}`;
    console.log(`\n【${caseInfo.name}】${url}`);

    try {
      // 1. Loading 截图
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      await page.waitForSelector('#game-loading', { visible: true, timeout: 5000 }).catch(() => {});
      await page.screenshot({ path: path.join(outputDir, `${caseInfo.id}-01-loading.png`) });
      console.log(`  ✅ loading 截图`);
      passed++;

      // 等待 loading 消失
      await page.waitForFunction(() => {
        const el = document.getElementById('game-loading');
        return !el || el.style.display === 'none' || el.offsetParent === null;
      }, { timeout: 10000 });

      // 2. 调查阶段截图（点击继续跳过开场）
      await new Promise(r => setTimeout(r, 1000));
      const continueBtn = await page.$('#intro-continue');
      if (continueBtn) {
        for (let i = 0; i < 12; i++) {
          await continueBtn.click().catch(() => {});
          await new Promise(r => setTimeout(r, 200));
        }
      }
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outputDir, `${caseInfo.id}-02-investigation.png`) });
      console.log(`  ✅ 调查阶段截图`);
      passed++;

      // 3. 顶栏+更多菜单截图
      await page.click('#more-btn').catch(() => {});
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(outputDir, `${caseInfo.id}-03-more-menu.png`) });
      console.log(`  ✅ 更多菜单截图`);
      passed++;

      // 关闭更多菜单
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 300));

    } catch (e) {
      console.log(`  ❌ 失败: ${e.message}`);
      failed++;
    }

    await page.close();
  }

  await browser.close();

  console.log('\n═══════════════════════════════════════════');
  console.log(`  结果: ${passed} 截图成功, ${failed} 失败`);
  console.log(`  截图保存在: ${outputDir}`);
  console.log('═══════════════════════════════════════════');

  if (failed > 0) process.exit(1);
}

main().catch(e => {
  console.error('运行失败:', e.message);
  process.exit(1);
});
