/**
 * 閫氳繃GitHub API鎺ㄩ€佹柊澧炴浠跺拰鐩稿叧鏂囦欢
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'WatersLin-Ann';
const REPO = 'fun_detective';
const BRANCH = 'main';

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
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
            reject(new Error(`HTTP ${res.statusCode}: ${json.message || data}`));
          }
        } catch (e) {
          resolve(data);
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

async function createTree(baseTree, files) {
  const tree = [];
  for (const file of files) {
    const blob = await createBlob(file.content);
    tree.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
    console.log(`  宸插噯澶? ${file.path}`);
  }
  return apiRequest('POST', '/git/trees', {
    base_tree: baseTree,
    tree: tree,
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

async function main() {
  console.log('鑾峰彇鏈€鏂版彁浜?..');
  const { commit, treeSha } = await getLatestCommit();
  console.log(`鏈€鏂版彁浜? ${commit.sha}`);

  // 鏀堕泦闇€瑕佹帹閫佺殑鏂囦欢
  const filesToPush = [];
  const casesDir = path.join(__dirname, '..', 'cases');
  
  // 鏂板妗堜欢鍒楄〃
  const newCases = [
    '鎺ㄧ悊灏忚/鏃ユ湰/濡傞鏃犱綔绁熶箣鐗?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鑴戦珦鍦扮嫳.json',
    '鎺ㄧ悊灏忚/鏃ユ湰/榛戞棣嗘潃浜轰簨浠?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鐚粰铏氭棤鐨勪緵鐗?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鍖ｄ腑澶变箰.json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鏈夌考涔嬫殫.json',
    '鎺ㄧ悊灏忚/鏃ユ湰/澶忎笌鍐殑濂忛福鏇?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鐙溂灏戝コ.json',
    '鎺ㄧ悊灏忚/鏃ユ湰/缁滄柊濡囦箣鐞?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/閾侀紶涔嬫.json',
    '鎺ㄧ悊灏忚/鏃ユ湰/闃存懇缃楅涔嬬憰.json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鍖楁柟澶曢工2-3鏉€浜?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鍑轰簯浼犺7-8鏉€浜?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/杩峰棣嗕簨浠?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/浜哄伓棣嗕簨浠?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/榛戠尗棣嗕簨浠?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鏆楅粦棣嗕簨浠?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/鏂板弬鑰?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/绾㈡墜鎸?json',
    '鎺ㄧ悊灏忚/鏃ユ湰/绁堢シ钀藉箷鏃?json',
    '褰辫/缇庡浗/鐩楁ⅵ绌洪棿.json',
    '褰辫/缇庡浗/娌夐粯鐨勭緮缇?json',
    '褰辫/闊╁浗/鏉€浜哄洖蹇?json',
    '褰辫/缇庡浗/涓囪兘閽ュ寵.json',
    '褰辫/鏃ユ湰/鏈夯鐨勯儴灞?json',
    '褰辫/缇庡浗/鑰佹棤鎵€渚?json',
    '褰辫/缇庡浗/灏忓矝鎯婇瓊.json',
    '褰辫/缇庡浗/鍐拌鏆?json',
    '鐪熷疄妗堜欢/缇庡浗/榛勯亾鍗佷簩瀹潃鎵?json',
  ];

  console.log(`\n鏀堕泦 ${newCases.length} 涓柊澧炴浠舵枃浠?..`);
  for (const relativePath of newCases) {
    const filePath = path.join(casesDir, relativePath);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      filesToPush.push({
        path: `cases/${relativePath}`,
        content: content,
      });
    } else {
      console.log(`  璺宠繃锛堜笉瀛樺湪锛? ${relativePath}`);
    }
  }

  // 娣诲姞鑴氭湰鏂囦欢
  const scripts = [
    'scripts/gen-real-cases-batch1.cjs',
    'scripts/gen-real-cases-batch2.cjs',
    'scripts/gen-real-cases-batch3.cjs',
    'scripts/gen-real-cases-batch4.cjs',
    'scripts/gen-real-cases-batch5.cjs',
    'scripts/gen-real-cases-batch6.cjs',
    'scripts/convert-flat-to-nested-v2.cjs',
  ];

  console.log(`\n鏀堕泦鑴氭湰鏂囦欢...`);
  for (const script of scripts) {
    const filePath = path.join(__dirname, '..', script);
    if (fs.existsSync(filePath)) {
      filesToPush.push({
        path: script,
        content: fs.readFileSync(filePath, 'utf8'),
      });
    }
  }

  console.log(`\n鍏?${filesToPush.length} 涓枃浠跺緟鎺ㄩ€乣);
  console.log('鍒涘缓Git Tree...');
  const newTree = await createTree(treeSha, filesToPush);
  
  console.log('鍒涘缓Commit...');
  const newCommit = await createCommit(newTree.sha, commit.sha, 
    'feat: 鏂板29涓湡瀹炴帹鐞嗕綔鍝侊紙缃戠粶鎼滅储鏍稿疄锛? 鏍煎紡杞崲鑴氭湰\n\n' +
    '- 鎺ㄧ悊灏忚锛氬棣栨棤浣滅涔嬬墿銆佽剳楂撳湴鐙便€侀粦姝婚鏉€浜轰簨浠剁瓑20閮╘n' +
    '- 褰辫锛氱洍姊︾┖闂淬€佹矇榛樼殑缇旂緤銆佹潃浜哄洖蹇嗙瓑8閮╘n' +
    '- 鐪熷疄妗堜欢锛氶粍閬撳崄浜屽鏉€鎵嬬瓑1涓猏n' +
    '- 鎵€鏈夋柊澧炴浠跺潎閫氳繃缃戠粶鎼滅储鏍稿疄鐪熷疄瀛樺湪\n' +
    '- 娣诲姞妗堜欢鏍煎紡杞崲鑴氭湰'
  );
  
  console.log('鏇存柊鍒嗘敮寮曠敤...');
  await updateRef(newCommit.sha);
  
  console.log(`\n鉁?鎺ㄩ€佹垚鍔燂紒鏂版彁浜? ${newCommit.sha}`);
}

main().catch(err => {
  console.error('鉂?鎺ㄩ€佸け璐?', err.message);
  process.exit(1);
});
