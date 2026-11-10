#!/usr/bin/env node
'use strict';
/**
 * 七曜智囊团 · 本地伴生服务（零依赖，仅用 Node 内置模块）
 *
 * 作用：把 index.html 和 Ollama 放在同一个源下，彻底绕开浏览器跨域。
 *   浏览器 → http://127.0.0.1:8788/            （同源，页面）
 *          → http://127.0.0.1:8788/__ollama/*  （同源，由本服务转发到 Ollama）
 *          → Node 服务端 → http://127.0.0.1:11434/api/*（服务端请求，无 CORS 概念）
 *
 * 用法：node server.js          然后浏览器打开 http://127.0.0.1:8788/
 * 可选环境变量：PORT（默认 8788）、HOST（默认 127.0.0.1）、OLLAMA_BASE（默认 http://127.0.0.1:11434）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8788);
const HOST = process.env.HOST || '127.0.0.1';
const OLLAMA_BASE = String(process.env.OLLAMA_BASE || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const ROOT = __dirname;
const PREFIX = '/__ollama';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function sendJson(res, code, obj) {
  if (res.writableEnded) return;
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function serveFile(res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return sendJson(res, 404, { error: '资源不存在', file: path.basename(file) });
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(file).pipe(res);
  });
}

function proxyToOllama(req, res, url) {
  const targetPath = url.pathname.slice(PREFIX.length) + (url.search || '');
  const target = OLLAMA_BASE + targetPath;
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = chunks.length ? Buffer.concat(chunks) : null;
    const headers = { 'Content-Type': req.headers['content-type'] || 'application/json' };
    if (body) headers['Content-Length'] = body.length;

    const upstream = http.request(target, { method: req.method, headers, timeout: 0 }, (up) => {
      const type = up.headers['content-type'] || 'application/json; charset=utf-8';
      res.writeHead(up.statusCode || 502, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      up.pipe(res);
    });

    upstream.on('error', (err) => {
      const known = /ECONNREFUSED|EHOSTUNREACH|ENOTFOUND|EACCES/.test(String(err && err.code));
      const hint = known
        ? '伴生服务无法连接 Ollama（' + OLLAMA_BASE + '），请确认 ollama serve 正在运行'
        : '伴生服务转发失败：' + (err && err.message ? err.message : String(err));
      sendJson(res, 502, { error: hint });
    });

    // 浏览器端已中断（用户切页/取消）时及时释放上游连接
    res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });

    if (body) upstream.write(body);
    upstream.end();
  });
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://' + (req.headers.host || HOST + ':' + PORT));
  } catch (e) {
    return sendJson(res, 400, { error: '请求地址不合法' });
  }

  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === PREFIX || url.pathname.startsWith(PREFIX + '/')) {
    if (req.method !== 'GET' && req.method !== 'POST') return sendJson(res, 405, { error: '仅支持 GET / POST' });
    if (url.pathname === PREFIX) return sendJson(res, 200, { ok: true, target: OLLAMA_BASE });
    return proxyToOllama(req, res, url);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: '静态资源仅支持 GET' });
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return sendJson(res, 403, { error: '禁止访问' });
  if (!path.extname(file)) return serveFile(res, path.join(ROOT, 'index.html'));
  return serveFile(res, file);
});

// 7B 冷加载可能长达一分钟，禁用默认请求超时
server.timeout = 0;
server.requestTimeout = 0;
server.headersTimeout = 0;

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  七曜智囊团 · 本地伴生服务');
  console.log('  → 页面：http://' + (HOST === '0.0.0.0' ? '127.0.0.1' : HOST) + ':' + PORT + '/');
  console.log('  → 转发：' + PREFIX + '/*  →  ' + OLLAMA_BASE + '/*');
  console.log('  → 说明：Ollama 未启动时页面会自动回退内置推演，不会卡住');
  console.log('  → 停止：Ctrl + C');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n[server] 已停止。');
  server.close(() => process.exit(0));
});
