/**
 * 调试脚本：诊断浏览器端问题
 */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const allRequests = [];
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  await page.goto('http://localhost:4321/fun_detective/game-design/prototype/play?case=orient-express', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // 等待案件数据加载
  console.log('\n--- 等待案件数据加载 ---');
  for (let i = 0; i < 20; i++) {
    const hasData = await page.evaluate(() => !!window.GameData);
    if (hasData) {
      console.log(`案件数据已加载（等待 ${i * 500}ms）`);
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const gameDataInfo = await page.evaluate(() => {
    if (!window.GameData) return { exists: false };
    return {
      exists: true,
      metaId: window.GameData.meta?.id,
      objectivesCount: window.GameData.objectives?.length,
      objectiveTypes: window.GameData.objectives?.map(o => o.type),
      hasFindRelation: window.GameData.objectives?.some(o => o.type === 'find_relation')
    };
  });
  console.log('GameData:', JSON.stringify(gameDataInfo, null, 2));

  // 检查 GameState
  const gameStateInfo = await page.evaluate(() => {
    if (!window.GameState) return { exists: false };
    return {
      exists: true,
      phase: window.GameState.state?.gamePhase,
      hasReset: typeof window.GameState.resetSavedGame === 'function',
      resetFnStr: window.GameState.resetSavedGame?.toString().substring(0, 200)
    };
  });
  console.log('\nGameState:', JSON.stringify(gameStateInfo, null, 2));

  // 测试 resetSavedGame
  console.log('\n--- 测试 resetSavedGame ---');
  const resetTest = await page.evaluate(() => {
    try {
      const s = window.GameState.state;
      s.gamePhase = 'ending';
      s.confidence = 50;
      s.collectedEvidence = ['test'];
      console.log('before reset:', s.gamePhase, s.confidence, s.collectedEvidence.length);

      window.GameState.resetSavedGame();

      console.log('after reset:', s.gamePhase, s.confidence, s.collectedEvidence.length);
      console.log('window.GameState.state after:', window.GameState.state.gamePhase, window.GameState.state.confidence);

      return {
        success: true,
        phaseAfter: window.GameState.state.gamePhase,
        confidenceAfter: window.GameState.state.confidence,
        evidenceLenAfter: window.GameState.state.collectedEvidence.length
      };
    } catch (e) {
      return { success: false, error: e.message, stack: e.stack };
    }
  });
  console.log('Reset test result:', JSON.stringify(resetTest, null, 2));

  // 检查 console 日志
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  await browser.close();
})();
