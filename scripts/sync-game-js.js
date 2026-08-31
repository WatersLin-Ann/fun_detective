/**
 * 构建脚本：同步src/game下的JS文件到public/game
 * 用法：node scripts/sync-game-js.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src', 'game');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'game');

function syncDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += syncDirectory(srcPath, destPath);
    } else if (entry.name.endsWith('.js')) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${entry.name}`);
      count++;
    }
  }

  return count;
}

console.log('同步游戏JS文件到public/game...');
const count = syncDirectory(SRC_DIR, PUBLIC_DIR);
console.log(`完成！共同步 ${count} 个文件`);
