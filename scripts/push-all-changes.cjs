/**
 * 閫氳繃GitHub API鎺ㄩ€佹墍鏈夋湰鍦板彉鏇? * 浣跨敤git diff鑾峰彇鍙樻洿鏂囦欢鍒楄〃锛岀劧鍚庨€氳繃API鍒涘缓tree鍜宑ommit
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'WatersLin-Ann';
const REPO = 'fun_detective';
const BRANCH = 'main';
const REPO_ROOT = path.join(__dirname, '..');

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}${endpoint}`,
      method: method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'fun-detective-bot',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.message || data.substring(0, 500)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getLatestCommit() {
  const ref = await apiRequest('GET', `/git/refs/heads/${BRANCH}`);
  const commit = await apiRequest('GET', `/git/commits/${ref.object.sha}`);
  return { ref, commit, treeSha: commit.tree.sha };
}

async function createBlob(content) {
  return apiRequest('POST', '/git/blobs', {
    content: Buffer.from(content).toString('base64'),
    encoding: 'base64',
  });
}

async function createTree(baseTree, treeEntries) {
  return apiRequest('POST', '/git/trees', {
    base_tree: baseTree,
    tree: treeEntries,
  });
}

async function createCommit(tree, parent, message) {
  return apiRequest('POST', '/git/commits', {
    message: message,
    tree: tree,
    parents: [parent],
  });
}

async function updateRef(commitSha) {
  return apiRequest('PATCH', `/git/refs/heads/${BRANCH}`, {
    sha: commitSha,
  });
}

function getChangedFiles() {
  // 鑾峰彇鎵€鏈夊彉鏇存枃浠讹紙宸叉殏瀛樸€佹湭鏆傚瓨銆佹湭璺熻釜锛?  const files = new Set();
  
  // 宸叉殏瀛樺拰鏈殏瀛樼殑淇敼/鍒犻櫎
  try {
    const diffNameStatus = execSync('git diff --name-status HEAD', { cwd: REPO_ROOT, encoding: 'utf8' });
    diffNameStatus.split('\n').filter(Boolean).forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const status = parts[0];
        const filePath = parts[parts.length - 1];
        if (status !== 'D') {
          files.add(filePath);
        }
      }
    });
  } catch (e) {
    console.log('git diff HEAD澶辫触:', e.message);
  }
  
  // 鏈窡韪枃浠?  try {
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: REPO_ROOT, encoding: 'utf8' });
    untracked.split('\n').filter(Boolean).forEach(f => files.add(f));
  } catch (e) {
    console.log('git ls-files澶辫触:', e.message);
  }
  
  return Array.from(files).filter(f => {
    // 鎺掗櫎涓嶉渶瑕佹帹閫佺殑鏂囦欢
    if (f.startsWith('dist/')) return false;
    if (f.startsWith('.final-tree')) return false;
    if (f.startsWith('build-output')) return false;
    if (f === 'screenshot2.png' || f === 'screenshot3.png') return false;
    return true;
  });
}

async function main() {
  console.log('鑾峰彇鏈€鏂版彁浜?..');
  const { commit, treeSha } = await getLatestCommit();
  console.log(`鏈€鏂版彁浜? ${commit.sha}`);
  console.log(`鏈€鏂癟ree: ${treeSha}`);

  console.log('\n鑾峰彇鏈湴鍙樻洿鏂囦欢鍒楄〃...');
  const changedFiles = getChangedFiles();
  console.log(`鍏?${changedFiles.length} 涓彉鏇存枃浠禶);
  
  if (changedFiles.length === 0) {
    console.log('娌℃湁鍙樻洿闇€瑕佹帹閫?);
    return;
  }

  // 鍒嗘壒澶勭悊锛屾瘡鎵规渶澶?0涓枃浠?  const BATCH_SIZE = 50;
  let currentTreeSha = treeSha;
  let totalPushed = 0;
  
  for (let i = 0; i < changedFiles.length; i += BATCH_SIZE) {
    const batch = changedFiles.slice(i, i + BATCH_SIZE);
    console.log(`\n澶勭悊绗?${Math.floor(i / BATCH_SIZE) + 1} 鎵?(${batch.length} 涓枃浠?...`);
    
    const treeEntries = [];
    for (const filePath of batch) {
      const fullPath = path.join(REPO_ROOT, filePath);
      if (!fs.existsSync(fullPath)) {
        console.log(`  璺宠繃锛堜笉瀛樺湪锛? ${filePath}`);
        continue;
      }
      
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const blob = await createBlob(content);
        treeEntries.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
        console.log(`  宸插噯澶? ${filePath}`);
      } catch (e) {
        console.log(`  璺宠繃锛堣鍙栧け璐ワ級: ${filePath} - ${e.message}`);
      }
    }
    
    if (treeEntries.length === 0) {
      console.log('  鏈壒鏃犳湁鏁堟枃浠讹紝璺宠繃');
      continue;
    }
    
    console.log(`  鍒涘缓Tree...`);
    const newTree = await createTree(currentTreeSha, treeEntries);
    currentTreeSha = newTree.sha;
    totalPushed += treeEntries.length;
    console.log(`  Tree鍒涘缓鎴愬姛: ${newTree.sha}`);
  }
  
  if (totalPushed === 0) {
    console.log('娌℃湁鏈夋晥鏂囦欢闇€瑕佹帹閫?);
    return;
  }

  console.log(`\n鍒涘缓Commit (鍏?${totalPushed} 涓枃浠?...`);
  const newCommit = await createCommit(currentTreeSha, commit.sha, 
    'feat: 鍙戣〃骞翠唤鍔熻兘 + 鐪熷疄妗堜欢鎵╁厖 + 棣栭〉UI浼樺寲\n\n' +
    '- 鏂板鍙戣〃骞翠唤瀛楁锛屾敮鎸佸勾浠界瓫閫夊拰鎸夊彂琛ㄦ椂闂存帓搴廫n' +
    '- 鏂板29涓湡瀹炴帹鐞嗕綔鍝侊紙閫氳繃缃戠粶鎼滅储鏍稿疄锛塡n' +
    '- 棣栭〉UI浼樺寲锛氬帇缂〩ero鍖哄煙銆佺槮韬崱鐗囥€佺€戝竷娴佹棤闄愭粴鍔╘n' +
    '- 绾夸笂灞忚斀娓告垙鍏ュ彛锛屾湰鍦颁繚鐣橽n' +
    '- 淇鍏宠仈鏉緽ug鍜孯-01~R-10閬楃暀闂'
  );
  
  console.log(`Commit鍒涘缓鎴愬姛: ${newCommit.sha}`);
  
  console.log('鏇存柊鍒嗘敮寮曠敤...');
  await updateRef(newCommit.sha);
  
  console.log(`\n鉁?鎺ㄩ€佹垚鍔燂紒`);
  console.log(`鏂版彁浜? ${newCommit.sha}`);
  console.log(`鍏辨帹閫?${totalPushed} 涓枃浠禶);
  console.log(`鏌ョ湅: https://github.com/${OWNER}/${REPO}/commit/${newCommit.sha}`);
}

main().catch(err => {
  console.error('\n鉂?鎺ㄩ€佸け璐?', err.message);
  process.exit(1);
});
