/**
 * 寮哄埗鎺ㄩ€佹墍鏈塩ases鐩綍涓嬬殑鏂囦欢鍒癎itHub锛堣鐩栬繙绋嬬増鏈級
 * 鐢ㄤ簬鍚屾鎵€鏈夊凡淇敼鐨勬浠舵枃浠? */
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'WatersLin-Ann';
const REPO = 'fun_detective';
const BRANCH = 'main';
const REPO_ROOT = path.join(__dirname, '..');
const CASES_DIR = path.join(REPO_ROOT, 'cases');

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
            reject(new Error(`HTTP ${res.statusCode}: ${json.message || data.substring(0, 300)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function getAllCaseFiles(dir, basePath = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...getAllCaseFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.json')) {
      files.push({
        path: `cases/${relativePath}`,
        fullPath: fullPath,
      });
    }
  }
  return files;
}

async function main() {
  console.log('鑾峰彇鏈€鏂版彁浜?..');
  const ref = await apiRequest('GET', `/git/refs/heads/${BRANCH}`);
  const commit = await apiRequest('GET', `/git/commits/${ref.object.sha}`);
  console.log(`鏈€鏂版彁浜? ${commit.sha}`);

  console.log('\n鎵弿鏈湴cases鐩綍...');
  const allFiles = getAllCaseFiles(CASES_DIR);
  console.log(`鏈湴鍏辨湁 ${allFiles.length} 涓浠舵枃浠禶);

  // 鍒嗘壒澶勭悊锛屾瘡鎵规渶澶?0涓枃浠讹紙閬垮厤璇锋眰杩囧ぇ锛?  const BATCH_SIZE = 20;
  let currentTreeSha = commit.tree.sha;
  let totalPushed = 0;
  let failedFiles = [];

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    console.log(`\n澶勭悊绗?${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allFiles.length / BATCH_SIZE)} 鎵?(${batch.length} 涓枃浠?...`);
    
    const treeEntries = [];
    for (const file of batch) {
      try {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        const blob = await apiRequest('POST', '/git/blobs', {
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64',
        });
        treeEntries.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
        process.stdout.write('.');
      } catch (e) {
        console.log(`\n  澶辫触: ${file.path} - ${e.message}`);
        failedFiles.push(file.path);
      }
    }
    console.log(`\n  鎴愬姛鍑嗗 ${treeEntries.length} 涓枃浠禶);
    
    if (treeEntries.length === 0) {
      console.log('  鏈壒鏃犳湁鏁堟枃浠讹紝璺宠繃');
      continue;
    }
    
    console.log('  鍒涘缓Tree...');
    const newTree = await apiRequest('POST', '/git/trees', {
      base_tree: currentTreeSha,
      tree: treeEntries,
    });
    currentTreeSha = newTree.sha;
    totalPushed += treeEntries.length;
    console.log(`  Tree鍒涘缓鎴愬姛 (绱 ${totalPushed}/${allFiles.length})`);
  }
  
  if (totalPushed === 0) {
    console.log('\n娌℃湁鏈夋晥鏂囦欢闇€瑕佹帹閫?);
    return;
  }

  console.log(`\n鍒涘缓Commit (鍏?${totalPushed} 涓枃浠?...`);
  const newCommit = await apiRequest('POST', '/git/commits', {
    message: `feat: 鍚屾鍏ㄩ儴${totalPushed}涓浠舵暟鎹紙鍚彂琛ㄥ勾浠姐€佹牸寮忕粺涓€锛塡n\n` +
      `- 鎵€鏈夋浠剁粺涓€涓哄祵濂楁牸寮忥紙鍩烘湰淇℃伅/鏁呬簨瑙嗗浘/璁捐瑙嗗浘/娓告垙璁捐/鍏冩暟鎹級\n` +
      `- 琛ュ厖鍙戣〃骞翠唤瀛楁\n` +
      `- 鏂板29涓湡瀹炴帹鐞嗕綔鍝乗n` +
      (failedFiles.length > 0 ? `- ${failedFiles.length}涓枃浠舵帹閫佸け璐n` : ''),
    tree: currentTreeSha,
    parents: [commit.sha],
  });
  
  console.log(`Commit鍒涘缓鎴愬姛: ${newCommit.sha}`);
  
  console.log('鏇存柊鍒嗘敮寮曠敤...');
  await apiRequest('PATCH', `/git/refs/heads/${BRANCH}`, {
    sha: newCommit.sha,
  });
  
  console.log(`\n鉁?鍏ㄩ儴妗堜欢鏁版嵁鍚屾瀹屾垚锛乣);
  console.log(`鏂版彁浜? ${newCommit.sha}`);
  console.log(`鍏辨帹閫?${totalPushed} 涓枃浠禶);
  if (failedFiles.length > 0) {
    console.log(`澶辫触 ${failedFiles.length} 涓枃浠?`);
    failedFiles.forEach(f => console.log(`  - ${f}`));
  }
  console.log(`鏌ョ湅: https://github.com/${OWNER}/${REPO}/commit/${newCommit.sha}`);
}

main().catch(err => {
  console.error('\n鉂?鎺ㄩ€佸け璐?', err.message);
  process.exit(1);
});
