// 鍒嗘壒鍒涘缓GitHub tree
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'WatersLin-Ann';
const REPO = 'fun_detective';
const BASE_TREE = 'af299ed13e89301261867c2a4eaad1f6fd7c28db';
const BATCH_SIZE = 50;

function apiPost(endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/${endpoint}`,
      method: 'POST',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'fun-detective-script',
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function walkDir(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (item.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  const casesDir = path.join(__dirname, '..', 'cases');
  const files = walkDir(casesDir).map(f => f.replace(path.join(__dirname, '..') + path.sep, '').replace(/\\/g, '/'));
  console.log(`鎵惧埌 ${files.length} 涓浠舵枃浠禶);

  let currentTree = BASE_TREE;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const tree = batch.map(f => ({
      path: f,
      mode: '100644',
      type: 'blob',
      content: fs.readFileSync(path.join(__dirname, '..', f), 'utf-8'),
    }));

    console.log(`鎵规 ${Math.floor(i / BATCH_SIZE) + 1}: 鏂囦欢 ${i}-${i + batch.length - 1}, 澶у皬绾?${JSON.stringify(tree).length} 瀛楄妭`);

    const result = await apiPost('git/trees', { base_tree: currentTree, tree });
    if (result.status !== 201) {
      console.error(`鍒涘缓tree澶辫触: ${result.status}`, result.data);
      process.exit(1);
    }
    currentTree = result.data.sha;
    console.log(`  tree=${currentTree}`);
  }

  // 娣诲姞鑴氭湰鏂囦欢
  const scriptContent = fs.readFileSync(path.join(__dirname, 'add-publish-year.cjs'), 'utf-8');
  const result = await apiPost('git/trees', {
    base_tree: currentTree,
    tree: [{ path: 'scripts/add-publish-year.cjs', mode: '100644', type: 'blob', content: scriptContent }],
  });
  if (result.status !== 201) {
    console.error('娣诲姞鑴氭湰澶辫触:', result.data);
    process.exit(1);
  }
  currentTree = result.data.sha;
  console.log(`娣诲姞鑴氭湰鍚?tree=${currentTree}`);

  console.log(`\n鏈€缁坱ree: ${currentTree}`);
  fs.writeFileSync(path.join(__dirname, '..', '.final-tree.txt'), currentTree);
}

main().catch(console.error);
