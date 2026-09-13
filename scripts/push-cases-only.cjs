/**
 * 鎺ㄩ€佹墍鏈塩ases鐩綍涓嬬殑鏂囦欢鍒癎itHub
 * 鐩存帴閬嶅巻鏂囦欢绯荤粺锛岄伩鍏峠it涓枃鏂囦欢鍚嶈浆涔夐棶棰? */
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

async function getRemoteTreeRecursive(treeSha) {
  const tree = await apiRequest('GET', `/git/trees/${treeSha}?recursive=1`);
  return new Set(tree.tree.filter(t => t.type === 'blob').map(t => t.path));
}

async function main() {
  console.log('鑾峰彇鏈€鏂版彁浜?..');
  const ref = await apiRequest('GET', `/git/refs/heads/${BRANCH}`);
  const commit = await apiRequest('GET', `/git/commits/${ref.object.sha}`);
  console.log(`鏈€鏂版彁浜? ${commit.sha}`);
  console.log(`鏈€鏂癟ree: ${commit.tree.sha}`);

  console.log('\n鑾峰彇杩滅▼鏂囦欢鍒楄〃...');
  const remoteFiles = await getRemoteTreeRecursive(commit.tree.sha);
  console.log(`杩滅▼鍏辨湁 ${remoteFiles.size} 涓枃浠禶);

  console.log('\n鎵弿鏈湴cases鐩綍...');
  const localFiles = getAllCaseFiles(CASES_DIR);
  console.log(`鏈湴鍏辨湁 ${localFiles.length} 涓浠舵枃浠禶);

  // 鎵惧嚭闇€瑕佹帹閫佺殑鏂囦欢锛堟柊澧炴垨淇敼锛?  const filesToPush = [];
  for (const file of localFiles) {
    if (!remoteFiles.has(file.path)) {
      filesToPush.push(file);
    }
  }
  console.log(`闇€瑕佹柊澧炴帹閫?${filesToPush.length} 涓枃浠禶);

  if (filesToPush.length === 0) {
    console.log('娌℃湁闇€瑕佹帹閫佺殑鏂囦欢');
    return;
  }

  // 鍒嗘壒澶勭悊锛屾瘡鎵规渶澶?0涓枃浠?  const BATCH_SIZE = 30;
  let currentTreeSha = commit.tree.sha;
  let totalPushed = 0;
  let failedFiles = [];

  for (let i = 0; i < filesToPush.length; i += BATCH_SIZE) {
    const batch = filesToPush.slice(i, i + BATCH_SIZE);
    console.log(`\n澶勭悊绗?${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(filesToPush.length / BATCH_SIZE)} 鎵?(${batch.length} 涓枃浠?...`);
    
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
    console.log(`  Tree鍒涘缓鎴愬姛: ${newTree.sha}`);
  }
  
  if (totalPushed === 0) {
    console.log('\n娌℃湁鏈夋晥鏂囦欢闇€瑕佹帹閫?);
    return;
  }

  console.log(`\n鍒涘缓Commit (鍏?${totalPushed} 涓枃浠?...`);
  const newCommit = await apiRequest('POST', '/git/commits', {
    message: `feat: 鏂板${totalPushed}涓帹鐞嗕綔鍝佹浠舵暟鎹甛n\n` +
      `- 鍖呭惈鎺ㄧ悊灏忚銆佸奖瑙嗐€佹父鎴忋€佺湡瀹炴浠剁瓑绫诲瀷\n` +
      `- 鎵€鏈夋浠跺潎鍖呭惈瀹屾暣鐨勬晠浜嬭鍥俱€佽璁¤鍥惧拰鍏冩暟鎹甛n` +
      (failedFiles.length > 0 ? `- ${failedFiles.length}涓枃浠舵帹閫佸け璐n` : ''),
    tree: currentTreeSha,
    parents: [commit.sha],
  });
  
  console.log(`Commit鍒涘缓鎴愬姛: ${newCommit.sha}`);
  
  console.log('鏇存柊鍒嗘敮寮曠敤...');
  await apiRequest('PATCH', `/git/refs/heads/${BRANCH}`, {
    sha: newCommit.sha,
  });
  
  console.log(`\n鉁?鎺ㄩ€佹垚鍔燂紒`);
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
