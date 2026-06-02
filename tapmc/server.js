/**
 * 臺北農產 51 週年背板系統 ── 本地伺服器
 * server.js  |  版本 1.0
 *
 * 功能：
 *   1. 靜態檔案服務（HTML / JS / CSS / assets）
 *   2. /api/data/:filename  讀寫 data/ 目錄下的 JSON 設定檔
 *   3. /api/media/img/:id   接收 Base64 圖片並儲存為 JPG
 *   4. /api/media/vid/:id   接收原始 Blob 並儲存為影片檔
 *   5. /api/media/:filename 讀取 / 刪除 media/ 目錄下的媒體檔
 *   6. /api/ping            健康檢查
 *
 * 執行方式：node server.js
 * 預設 Port：8080（可用環境變數 PORT 覆寫）
 *
 * 依賴：Node.js 14+（僅使用內建模組，不需 npm install）
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

/* ════════════════════════════════════════════════
   設定
   ════════════════════════════════════════════════ */
const PORT      = parseInt(process.env.PORT  || '8080', 10);
const HOST      = process.env.HOST || '0.0.0.0';
const ROOT_DIR  = __dirname;
const DATA_DIR  = path.join(ROOT_DIR, 'data');
const MEDIA_DIR = path.join(ROOT_DIR, 'media');

/* 確保資料目錄存在 */
[DATA_DIR, MEDIA_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

/* MIME 類型對應表 */
const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.mp4':   'video/mp4',
  '.webm':  'video/webm',
  '.mov':   'video/quicktime',
  '.avi':   'video/x-msvideo',
};

/* ════════════════════════════════════════════════
   工具函式
   ════════════════════════════════════════════════ */

/** 加入 CORS 標頭（同網段存取） */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Extension');
}

/** 回應 JSON */
function jsonRes(res, code, data) {
  setCors(res);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

/** 將請求 body 全部收集為 Buffer（適用中小型請求） */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data',  c   => chunks.push(c));
    req.on('end',   ()  => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  });
}

/**
 * 安全檔名驗證：只允許 字母/數字/底線/連字號，加最多一個點號
 * 防止目錄穿越（../）與任意路徑注入
 */
function safeFilename(name) {
  return typeof name === 'string' &&
    name.length > 0 && name.length <= 128 &&
    /^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]{1,10})?$/.test(name);
}

/* ════════════════════════════════════════════════
   請求路由
   ════════════════════════════════════════════════ */
async function handleRequest(req, res) {
  const rawUrl  = req.url.split('?')[0];          // 去除 query string
  const urlPath = decodeURIComponent(rawUrl);

  /* ── OPTIONS（CORS 預檢） ─────────────────────── */
  if (req.method === 'OPTIONS') {
    setCors(res); res.writeHead(204); res.end();
    return;
  }

  /* ── /api/ping ───────────────────────────────── */
  if (urlPath === '/api/ping') {
    jsonRes(res, 200, { ok: true, version: '1.0' });
    return;
  }

  /* ── /api/data/:filename（JSON 資料檔） ──────── */
  if (urlPath.startsWith('/api/data/')) {
    const filename = path.basename(urlPath);
    if (!safeFilename(filename) || !filename.endsWith('.json')) {
      jsonRes(res, 400, { error: '非法檔名' }); return;
    }
    const filepath = path.join(DATA_DIR, filename);

    if (req.method === 'GET') {
      try {
        const text = fs.readFileSync(filepath, 'utf8');
        setCors(res);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(text);
      } catch {
        jsonRes(res, 404, null);
      }
      return;
    }

    if (req.method === 'POST') {
      const buf = await readBody(req);
      try {
        JSON.parse(buf.toString('utf8'));           // 驗證 JSON 格式
        fs.writeFileSync(filepath, buf);
        jsonRes(res, 200, { ok: true });
      } catch (e) {
        jsonRes(res, 400, { error: '無效 JSON：' + e.message });
      }
      return;
    }

    jsonRes(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  /* ── /api/media/img/:id（接收圖片 dataUrl，儲存為 JPG） ── */
  if (urlPath.startsWith('/api/media/img/') && req.method === 'POST') {
    const id = path.basename(urlPath);
    if (!safeFilename(id)) { jsonRes(res, 400, { error: '非法 id' }); return; }
    try {
      const buf  = await readBody(req);
      const body = JSON.parse(buf.toString('utf8'));
      const b64  = (body.dataUrl || '').replace(/^data:image\/\w+;base64,/, '');
      if (!b64) throw new Error('缺少 dataUrl');
      fs.writeFileSync(path.join(MEDIA_DIR, `img_${id}.jpg`), Buffer.from(b64, 'base64'));
      jsonRes(res, 200, { ok: true });
    } catch (e) {
      jsonRes(res, 400, { error: e.message });
    }
    return;
  }

  /* ── /api/media/vid/:id（接收原始影片 Blob） ──────────────
     Header X-Extension：副檔名（mp4 / webm / mov / avi）
     ──────────────────────────────────────────────────────── */
  if (urlPath.startsWith('/api/media/vid/') && req.method === 'POST') {
    const id  = path.basename(urlPath);
    if (!safeFilename(id)) { jsonRes(res, 400, { error: '非法 id' }); return; }
    /* 驗證並清理副檔名 */
    const rawExt = (req.headers['x-extension'] || 'mp4').toLowerCase();
    const ext    = /^[a-z0-9]{1,6}$/.test(rawExt) ? rawExt : 'mp4';
    try {
      const buf = await readBody(req);
      fs.writeFileSync(path.join(MEDIA_DIR, `vid_${id}.${ext}`), buf);
      /* 同時記錄副檔名對應，供後續查找 */
      fs.writeFileSync(path.join(DATA_DIR, `vid_ext_${id}.txt`), ext);
      jsonRes(res, 200, { ok: true, ext });
    } catch (e) {
      jsonRes(res, 500, { error: e.message });
    }
    return;
  }

  /* ── /api/media/:filename（讀取媒體） ────────── */
  if (urlPath.startsWith('/api/media/') && req.method === 'GET') {
    const filename = path.basename(urlPath);
    if (!safeFilename(filename)) { jsonRes(res, 400, { error: '非法檔名' }); return; }
    const filepath = path.join(MEDIA_DIR, filename);
    try {
      const buf  = fs.readFileSync(filepath);
      const ext  = path.extname(filename).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      setCors(res);
      res.writeHead(200, {
        'Content-Type':  mime,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': buf.length,
      });
      res.end(buf);
    } catch {
      jsonRes(res, 404, { error: '找不到媒體檔' });
    }
    return;
  }

  /* ── /api/media/:filename（刪除媒體） ────────── */
  if (urlPath.startsWith('/api/media/') && req.method === 'DELETE') {
    const filename = path.basename(urlPath);
    if (!safeFilename(filename)) { jsonRes(res, 400, { error: '非法檔名' }); return; }
    try { fs.unlinkSync(path.join(MEDIA_DIR, filename)); } catch { /* 不存在時忽略 */ }
    jsonRes(res, 200, { ok: true });
    return;
  }

  /* ── 靜態檔案服務 ────────────────────────────── */
  let filePath = path.join(ROOT_DIR,
    urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, ''));

  /* 安全性：防止目錄穿越 */
  if (!filePath.startsWith(ROOT_DIR + path.sep) &&
      filePath !== path.join(ROOT_DIR, 'index.html')) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  /* 目錄 → index.html */
  try {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch { /* 檔案不存在，繼續往下 404 */ }

  try {
    const buf  = fs.readFileSync(filePath);
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    setCors(res);
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': buf.length });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('找不到：' + urlPath);
  }
}

/* ════════════════════════════════════════════════
   啟動伺服器
   ════════════════════════════════════════════════ */
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('[server] 未預期錯誤：', err.message);
    try { jsonRes(res, 500, { error: 'Internal Server Error' }); } catch { /* res 已送出 */ }
  });
});

server.listen(PORT, HOST, () => {
  const addr = `http://localhost:${PORT}`;
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   臺北農產 51 週年背板系統  ·  本地伺服器已啟動         ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  投影端：${addr}/index.html            ║`);
  console.log(`║  控制台：${addr}/admin.html             ║`);
  console.log(`║  資料目錄：./data/   媒體目錄：./media/               ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  按 Ctrl+C 停止伺服器                                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} 已被占用，請修改 PORT 環境變數或關閉佔用程式。\n`);
  } else {
    console.error('\n❌  伺服器錯誤：', err.message, '\n');
  }
  process.exit(1);
});
