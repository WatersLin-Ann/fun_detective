/**
 * 冒烟测试脚本
 * 用法: node scripts/smoke-test.cjs [--base-url http://localhost:4321] [--dist dist]
 * 检查：案件数据文件语法、JS 文件完整性、可选 HTTP 可达性
 * 有错误时退出码为 1
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GAME_DIR = path.join(ROOT, 'public', 'game');
const SRC_GAME_DIR = path.join(ROOT, 'src', 'game');

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) { passed++; console.log(`  ✅ ${msg}`); }
function fail(msg) { failed++; console.log(`  ❌ ${msg}`); }
function warn(msg) { warnings++; console.log(`  ⚠️  ${msg}`); }

// 解析参数
const args = process.argv.slice(2);
let baseUrl = null;
let distDir = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-url' && args[i + 1]) baseUrl = args[i + 1];
  if (args[i] === '--dist' && args[i + 1]) distDir = path.join(ROOT, args[i + 1]);
}

console.log('═══════════════════════════════════════════');
console.log('  冒烟测试 Smoke Test');
console.log('═══════════════════════════════════════════\n');

// ========== 1. 案件数据文件语法检查 ==========
console.log('【1】案件数据文件语法检查');
const dataFiles = fs.readdirSync(SRC_GAME_DIR).filter(f => f.startsWith('data-') && f.endsWith('.js'));
if (dataFiles.length === 0) {
  fail('未找到任何 data-*.js 文件');
} else {
  for (const file of dataFiles) {
    const filePath = path.join(SRC_GAME_DIR, file);
    try {
      execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
      pass(`${file} 语法正确`);
    } catch (e) {
      fail(`${file} 语法错误: ${e.stderr?.toString().split('\n')[0] || e.message}`);
    }
  }
}

// ========== 2. public/game JS 文件完整性检查 ==========
console.log('\n【2】public/game JS 文件完整性检查');
const requiredFiles = [
  'ui.js', 'gameState.js', 'gameRender.js', 'gameInteractions.js',
  'guideUI.js', 'playerData.js', 'notebookUI.js', 'evidence-board.js',
  'timelineUI.js', 'endingUI.js', 'audioManager.js', 'audio-config.js',
  'cases/index.js',
  'data-orient-express.js', 'data-study-in-scarlet.js', 'data-phoenix-wright.js'
];

for (const relPath of requiredFiles) {
  const filePath = path.join(GAME_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    fail(`缺少文件: public/game/${relPath}`);
  } else {
    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      fail(`文件为空: public/game/${relPath}`);
    } else {
      pass(`public/game/${relPath} 存在 (${stat.size} bytes)`);
    }
  }
}

// ========== 3. src/game 与 public/game 同步检查 ==========
console.log('\n【3】src/game 与 public/game 同步检查');
const srcJsFiles = fs.readdirSync(SRC_GAME_DIR).filter(f => f.endsWith('.js'));
for (const file of srcJsFiles) {
  const srcPath = path.join(SRC_GAME_DIR, file);
  const pubPath = path.join(GAME_DIR, file);
  if (!fs.existsSync(pubPath)) {
    warn(`src/game/${file} 未同步到 public/game/`);
    continue;
  }
  const srcContent = fs.readFileSync(srcPath, 'utf-8');
  const pubContent = fs.readFileSync(pubPath, 'utf-8');
  if (srcContent !== pubContent) {
    fail(`src/game/${file} 与 public/game/${file} 内容不一致，请运行 npm run sync:game`);
  } else {
    pass(`${file} 已同步`);
  }
}

// ========== 4. 案件配置检查 ==========
console.log('\n【4】案件配置检查');
try {
  const casesCode = fs.readFileSync(path.join(GAME_DIR, 'cases', 'index.js'), 'utf-8');
  const caseIds = ['orient-express', 'study-in-scarlet', 'phoenix-wright-1'];
  for (const id of caseIds) {
    if (casesCode.includes(`id: '${id}'`)) {
      pass(`案件配置包含: ${id}`);
    } else {
      fail(`案件配置缺少: ${id}`);
    }
  }
  // 检查每个案件的 dataFile 路径对应的文件存在
  for (const id of caseIds) {
    const dataFile = path.join(GAME_DIR, `data-${id === 'phoenix-wright-1' ? 'phoenix-wright' : id}.js`);
    if (fs.existsSync(dataFile)) {
      pass(`${id} 数据文件存在`);
    } else {
      fail(`${id} 数据文件不存在: ${path.basename(dataFile)}`);
    }
  }
} catch (e) {
  fail(`案件配置检查失败: ${e.message}`);
}

// ========== 5. HTTP 可达性检查（可选） ==========
async function runHttpChecks() {
  if (!baseUrl) {
    console.log('\n【5】HTTP 可达性检查（跳过，未提供 --base-url）');
    warn('使用 --base-url http://localhost:4321 可启用 HTTP 检查');
    return;
  }
  console.log('\n【5】HTTP 可达性检查');
  const casePaths = [
    '/fun_detective/game-design/prototype/',
    '/fun_detective/game-design/prototype/play?case=orient-express',
    '/fun_detective/game-design/prototype/play?case=study-in-scarlet',
    '/fun_detective/game-design/prototype/play?case=phoenix-wright-1'
  ];

  for (const urlPath of casePaths) {
    try {
      const status = await httpGet(baseUrl + urlPath);
      if (status === 200) {
        pass(`HTTP 200: ${urlPath}`);
      } else {
        fail(`HTTP ${status}: ${urlPath}`);
      }
    } catch (e) {
      fail(`HTTP 请求失败: ${urlPath} - ${e.message}`);
    }
  }
}

// ========== 6. dist 构建产物检查（可选） ==========
function runDistChecks() {
  if (distDir && fs.existsSync(distDir)) {
    console.log('\n【6】构建产物检查');
    const builtGameDir = path.join(distDir, 'fun_detective', 'game');
    if (fs.existsSync(builtGameDir)) {
      pass(`构建产物包含 game 目录`);
      const builtFiles = fs.readdirSync(builtGameDir).filter(f => f.endsWith('.js'));
      pass(`构建产物包含 ${builtFiles.length} 个 JS 文件`);
    } else {
      warn(`构建产物中未找到 game 目录: ${builtGameDir}`);
    }
  }
}

// ========== 主流程 ==========
async function main() {
  await runHttpChecks();
  runDistChecks();

  // ========== 汇总 ==========
  console.log('\n═══════════════════════════════════════════');
  console.log(`  结果: ${passed} 通过, ${failed} 失败, ${warnings} 警告`);
  console.log('═══════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n❌ 冒烟测试失败，请修复上述问题。');
    process.exit(1);
  } else {
    console.log('\n✅ 冒烟测试通过。');
    process.exit(0);
  }
}

main();

// ========== 工具函数 ==========
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}
