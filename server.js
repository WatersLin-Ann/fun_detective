// fun_detective 静态文件服务器
// 零依赖，使用 Node.js 内置 http 模块
// 将 /fun_detective/ 前缀映射到 dist 目录

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'dist');
const BASE_PATH = '/fun_detective/';
const PORT = 4321;
const HOST = '0.0.0.0';
const LOG_FILE = path.join(__dirname, 'server.log');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function log(msg) {
  const line = `[${new Date().toLocaleString('zh-CN', { hour12: false })}] ${msg}\n`;
  process.stdout.write(line);
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf-8');
  } catch (_) { /* ignore log write errors */ }
}

function safeJoin(base, target) {
  const resolved = path.normalize(path.join(base, target));
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

function findFile(urlPath) {
  // 去掉 base 前缀
  let rel = urlPath;
  if (rel.startsWith(BASE_PATH)) {
    rel = rel.slice(BASE_PATH.length);
  } else if (rel === '/fun_detective' || rel === '/fun_detective/') {
    rel = '';
  } else {
    return null; // 不在 base 路径下
  }

  // 解码 URL
  try {
    rel = decodeURIComponent(rel);
  } catch (_) { return null; }

  // 去掉查询参数和 hash
  rel = rel.split('?')[0].split('#')[0];

  if (rel === '' || rel === '/') {
    const idx = safeJoin(ROOT, 'index.html');
    if (idx && fs.existsSync(idx)) return idx;
  }

  // 直接路径
  let filePath = safeJoin(ROOT, rel);
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  // 目录 + index.html
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const idx = path.join(filePath, 'index.html');
    if (fs.existsSync(idx)) return idx;
  }

  // 尝试加 .html 后缀（Astro 静态站点的目录式 URL）
  const withHtml = safeJoin(ROOT, rel + '.html');
  if (withHtml && fs.existsSync(withHtml)) return withHtml;

  // 尝试去掉末尾斜杠后加 /index.html
  if (rel.endsWith('/')) {
    const idx = safeJoin(ROOT, rel + 'index.html');
    if (idx && fs.existsSync(idx)) return idx;
  }

  return null;
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || '/';

  // 根路径重定向到 /fun_detective/
  if (urlPath === '/' || urlPath === '') {
    res.writeHead(301, { Location: BASE_PATH });
    res.end();
    return;
  }

  const filePath = findFile(urlPath);

  if (!filePath) {
    // 尝试 404 页面
    const notFound = path.join(ROOT, '404.html');
    if (fs.existsSync(notFound)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(notFound).pipe(res);
      log(`404 ${urlPath}`);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      log(`404 ${urlPath}`);
    }
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
      log(`500 ${urlPath} - ${err.message}`);
      return;
    }

    // 协商缓存
    const mtime = stat.mtime.toUTCString();
    if (req.headers['if-modified-since'] === mtime) {
      res.writeHead(304);
      res.end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Last-Modified': mtime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    });

    fs.createReadStream(filePath).pipe(res);
    log(`200 ${urlPath}`);
  });
});

server.listen(PORT, HOST, () => {
  log(`fun_detective server started`);
  log(`  Local:   http://127.0.0.1:${PORT}${BASE_PATH}`);
  log(`  Network: http://<your-ip>:${PORT}${BASE_PATH}`);
  log(`  Root:    ${ROOT}`);
});

server.on('error', (err) => {
  log(`Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    log(`Port ${PORT} is already in use. Exiting.`);
    process.exit(1);
  }
});

// 优雅关闭
function shutdown(signal) {
  log(`Received ${signal}, shutting down...`);
  server.close(() => {
    log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
