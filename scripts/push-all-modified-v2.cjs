const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'WatersLin-Ann';
const REPO = 'fun_detective';
const BRANCH = 'main';
const REPO_ROOT = 'E:\\Work\\AIProjects\\fun_detective';

function api(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path: '/repos/' + OWNER + '/' + REPO + endpoint,
      method,
      headers: {
        'Authorization': 'token ' + TOKEN,
        'User-Agent': 'bot',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(j);
          else reject(new Error('HTTP ' + res.statusCode + ': ' + j.message));
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(d);
          else reject(new Error('HTTP ' + res.statusCode));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. 鑾峰彇git status涓殑淇敼鏂囦欢锛堜娇鐢ㄦ纭殑涓枃鏂囦欢鍚嶏級
  const statusOutput = execSync('git -c core.quotepath=false status --short', { cwd: REPO_ROOT, encoding: 'utf8' });
  const lines = statusOutput.trim().split('\n').filter(l => l.trim());
  
  const filesToPush = [];
  
  for (const line of lines) {
    const status = line.substring(0, 2);
    const filePath = line.substring(3).trim();
    // 鍙鐞嗕慨鏀瑰拰鏂板鐨勬枃浠讹紝璺宠繃鍒犻櫎鐨?    if (status.includes('M') || status.includes('A') || status === '??') {
      const fullPath = path.join(REPO_ROOT, filePath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        filesToPush.push(filePath);
      }
    }
  }
  
  console.log(`闇€瑕佹帹閫佺殑鏂囦欢: ${filesToPush.length}涓猔);
  
  if (filesToPush.length === 0) {
    console.log('娌℃湁闇€瑕佹帹閫佺殑鏇存敼');
    return;
  }
  
  // 2. 鑾峰彇鏈€鏂癱ommit
  const ref = await api('GET', '/git/refs/heads/' + BRANCH);
  const commit = await api('GET', '/git/commits/' + ref.object.sha);
  console.log('鏈€鏂版彁浜?', commit.sha.substring(0, 7));
  
  // 3. 涓烘瘡涓枃浠跺垱寤篵lob锛堝垎鎵瑰鐞嗭級
  const treeItems = [];
  const batchSize = 30;
  let failed = 0;
  
  for (let i = 0; i < filesToPush.length; i += batchSize) {
    const batch = filesToPush.slice(i, i + batchSize);
    console.log(`澶勭悊鎵规 ${Math.floor(i / batchSize) + 1}/${Math.ceil(filesToPush.length / batchSize)} (${batch.length}涓枃浠?`);
    
    const promises = batch.map(async (filePath) => {
      try {
        const fullPath = path.join(REPO_ROOT, filePath);
        const content = fs.readFileSync(fullPath);
        const blob = await api('POST', '/git/blobs', {
          content: content.toString('base64'),
          encoding: 'base64'
        });
        return {
          path: filePath.replace(/\\/g, '/'),
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        };
      } catch (e) {
        console.log('  澶辫触:', filePath, e.message);
        failed++;
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    treeItems.push(...results.filter(Boolean));
  }
  
  console.log(`鎴愬姛鍒涘缓 ${treeItems.length} 涓猙lob锛屽け璐?${failed} 涓猔);
  
  if (treeItems.length === 0) {
    console.log('娌℃湁鍙帹閫佺殑鏂囦欢');
    return;
  }
  
  // 4. 鍒涘缓tree
  const tree = await api('POST', '/git/trees', {
    base_tree: commit.tree.sha,
    tree: treeItems
  });
  
  // 5. 鍒涘缓commit
  const newCommit = await api('POST', '/git/commits', {
    message: `chore: 鎵归噺鏇存柊 ${treeItems.length} 涓枃浠禱n\n- 妗堜欢鏁版嵁娣诲姞鍙戣〃骞翠唤瀛楁\n- 棣栭〉鍗＄墖绱у噾鍖栦紭鍖朶n- 缃戞牸甯冨眬鏀逛负grid鎸夎濉厖`,
    tree: tree.sha,
    parents: [commit.sha]
  });
  
  // 6. 鏇存柊ref
  await api('PATCH', '/git/refs/heads/' + BRANCH, { sha: newCommit.sha });
  console.log('鎺ㄩ€佹垚鍔?', newCommit.sha.substring(0, 7));
}

main().catch(e => {
  console.error('澶辫触:', e.message);
  process.exit(1);
});
