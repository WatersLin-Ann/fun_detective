/**
 * 鎺ㄩ€佹柊澧炴浠跺埌GitHub
 * 鐢ㄦ硶: node scripts/push-new-cases.cjs
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'WatersLin-Ann';
const REPO = 'fun_detective';
const BRANCH = 'main';

function api(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'fun-detective-bot',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function walkDir(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(f => {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) results.push(...walkDir(fp));
    else if (f.endsWith('.json')) results.push(fp);
  });
  return results;
}

async function main() {
  console.log('鑾峰彇杩滅▼鏈€鏂癱ommit...');
  const ref = await api('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const latestCommitSha = ref.data.object.sha;
  console.log(`鏈€鏂癱ommit: ${latestCommitSha}`);
  
  const commit = await api('GET', `/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`);
  const baseTreeSha = commit.data.tree.sha;
  console.log(`鍩虹tree: ${baseTreeSha}`);
  
  // 鏀堕泦鎵€鏈夋浠舵枃浠?  const caseFiles = walkDir(path.join(ROOT, 'cases'));
  console.log(`鏈湴妗堜欢鏂囦欢鏁? ${caseFiles.length}`);
  
  // 鍒嗘壒鍒涘缓blob鍜宼ree
  const batchSize = 30;
  let currentTreeSha = baseTreeSha;
  let totalPushed = 0;
  
  for (let i = 0; i < caseFiles.length; i += batchSize) {
    const batch = caseFiles.slice(i, i + batchSize);
    const treeItems = [];
    
    for (const fp of batch) {
      const content = fs.readFileSync(fp, 'utf-8');
      const relativePath = path.relative(ROOT, fp).replace(/\\/g, '/');
      
      // 鍒涘缓blob
      const blob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
        content: content,
        encoding: 'utf-8'
      });
      
      if (blob.status === 201) {
        treeItems.push({
          path: relativePath,
          mode: '100644',
          type: 'blob',
          sha: blob.data.sha
        });
      } else {
        console.log(`鍒涘缓blob澶辫触: ${relativePath}, status: ${blob.status}`);
      }
    }
    
    // 鍒涘缓tree
    const tree = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
      base_tree: currentTreeSha,
      tree: treeItems
    });
    
    if (tree.status === 201) {
      currentTreeSha = tree.data.sha;
      totalPushed += treeItems.length;
      console.log(`鎵规 ${Math.floor(i/batchSize)+1}: 鍒涘缓tree鎴愬姛锛岀疮璁?${totalPushed} 涓枃浠禶);
    } else {
      console.log(`鍒涘缓tree澶辫触: ${tree.status}`);
      console.log(JSON.stringify(tree.data).substring(0, 500));
      return;
    }
    
    // 閬垮厤閫熺巼闄愬埗
    await new Promise(r => setTimeout(r, 500));
  }
  
  // 涔熸帹閫佽剼鏈枃浠?  const scriptFiles = [
    'scripts/gen-100-cases.cjs',
    'scripts/gen-remaining-cases.cjs',
    'scripts/gen-extra-cases.cjs',
    'scripts/gen-final-cases.cjs',
    'scripts/gen-last-cases.cjs',
    'scripts/gen-final-batch.cjs',
    'scripts/gen-last-10.cjs',
    'scripts/gen-more-cases.cjs',
    'scripts/fix-new-cases.cjs',
    'scripts/fix-english.cjs',
    'scripts/fix-all-english.cjs',
    'scripts/final-fix.cjs',
    'scripts/ultimate-fix.cjs',
  ];
  
  const scriptTreeItems = [];
  for (const sp of scriptFiles) {
    const fp = path.join(ROOT, sp);
    if (fs.existsSync(fp)) {
      const content = fs.readFileSync(fp, 'utf-8');
      const blob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
        content: content,
        encoding: 'utf-8'
      });
      if (blob.status === 201) {
        scriptTreeItems.push({
          path: sp,
          mode: '100644',
          type: 'blob',
          sha: blob.data.sha
        });
      }
    }
  }
  
  // 鎺ㄩ€佹姤鍛?  const reportPath = 'docs/妗堜欢璧勬枡搴撴墿灞曟墽琛屾姤鍛奯20260912.md';
  const reportContent = fs.readFileSync(path.join(ROOT, reportPath), 'utf-8');
  const reportBlob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
    content: reportContent,
    encoding: 'utf-8'
  });
  if (reportBlob.status === 201) {
    scriptTreeItems.push({
      path: reportPath,
      mode: '100644',
      type: 'blob',
      sha: reportBlob.data.sha
    });
  }
  
  if (scriptTreeItems.length > 0) {
    const scriptTree = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
      base_tree: currentTreeSha,
      tree: scriptTreeItems
    });
    if (scriptTree.status === 201) {
      currentTreeSha = scriptTree.data.sha;
      console.log(`鑴氭湰鍜屾姤鍛妕ree鍒涘缓鎴愬姛锛?{scriptTreeItems.length} 涓枃浠禶);
    }
  }
  
  // 鍒涘缓commit
  console.log('鍒涘缓commit...');
  const newCommit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message: `feat: 妗堜欢璧勬枡搴撴墿灞?- 鏂板${totalPushed}涓浠?+ 鍙戣〃骞翠唤鍔熻兘`,
    tree: currentTreeSha,
    parents: [latestCommitSha]
  });
  
  if (newCommit.status === 201) {
    const newCommitSha = newCommit.data.sha;
    console.log(`鏂癱ommit: ${newCommitSha}`);
    
    // 鏇存柊鍒嗘敮
    console.log('鏇存柊鍒嗘敮...');
    const updateRef = await api('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: newCommitSha,
      force: false
    });
    
    if (updateRef.status === 200) {
      console.log('鉁?鎺ㄩ€佹垚鍔燂紒');
      console.log(`鍏辨帹閫?${totalPushed + scriptTreeItems.length} 涓枃浠禶);
    } else {
      console.log(`鏇存柊鍒嗘敮澶辫触: ${updateRef.status}`);
      console.log(JSON.stringify(updateRef.data).substring(0, 500));
    }
  } else {
    console.log(`鍒涘缓commit澶辫触: ${newCommit.status}`);
    console.log(JSON.stringify(newCommit.data).substring(0, 500));
  }
}

main().catch(console.error);
