/**
 * ServerStore — 伺服器端資料儲存模組
 * 透過 HTTP API 讀寫伺服器上的 data/ 與 media/ 目錄
 *
 * 特性：
 *   - 優先於 FileStore（磁碟）與 IndexedDB，讓資料跨電腦共用
 *   - 自動偵測伺服器是否可用（/api/ping），不可用時靜默略過
 *   - isAvailable() 結果快取，只做一次網路探測
 *   - 所有方法都是非同步（Promise），失敗時返回 false / '' / null
 *
 * 對外 API：
 *   isAvailable()                → Promise<boolean>
 *   saveData(filename, data)     → Promise<boolean>
 *   loadData(filename)           → Promise<any|null>
 *   saveImage(id, dataUrl)       → Promise<boolean>
 *   getImageUrl(id)              → string（直接返回伺服器 URL）
 *   imageExists(id)              → Promise<boolean>
 *   deleteImage(id)              → Promise<void>
 *   saveVideo(id, blob, name)    → Promise<boolean>
 *   findVideoUrl(id)             → Promise<string>（找到返回 URL，否則 ''）
 *   deleteVideo(id)              → Promise<void>
 */
const ServerStore = (function () {
  'use strict';

  /* 伺服器根位址（由 tapmc-server-config.js 設定，預設為相對路徑） */
  const BASE = (typeof window !== 'undefined' && window.TAPMC_API_BASE) ? window.TAPMC_API_BASE : '';

  /* 探測快取：null=未探測, true=可用, false=不可用 */
  let _available    = null;
  let _availableAt  = 0;          /* 最後探測成功的時間戳 */
  const CACHE_TTL   = 30000;      /* 30 秒後重新探測（防止快取永遠失效） */

  /* 媒體 URL 存在快取（避免每次都 HEAD 一次） */
  const _mediaCache = new Map();   /* key → url */

  /* ── 伺服器可用性探測 ── */
  async function isAvailable() {
    /* 快取有效：true 且在 30 秒內 */
    if (_available === true && Date.now() - _availableAt < CACHE_TTL) return true;
    /* 若已確定不可用，直接返回（不重複探測，避免每次操作都等逾時） */
    if (_available === false) return false;
    try {
      /* 2 秒超時 */
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 2000);
      const r    = await fetch(BASE + '/api/tapmc/ping', {
        signal:  ctrl.signal,
        headers: { 'ngrok-skip-browser-warning': 'tapmc' },  /* 繞過 ngrok 警告頁 */
        cache:   'no-store',
      });
      clearTimeout(tid);
      if (r.ok) {
        _available   = true;
        _availableAt = Date.now();
      } else {
        _available = false;
      }
    } catch {
      _available = false;
    }
    return _available;
  }

  /** 重置可用性快取（換網路環境時手動呼叫） */
  function resetAvailable() { _available = null; _availableAt = 0; }

  /* ── JSON 資料（presets / seq steps） ── */

  const _H = { 'ngrok-skip-browser-warning': 'tapmc' };   /* 通用 ngrok 繞過 header */

  async function saveData(filename, data) {
    if (!await isAvailable()) return false;
    try {
      const r = await fetch(BASE + '/api/tapmc/data/' + filename, {
        method:  'POST',
        headers: { ..._H, 'Content-Type': 'application/json' },
        body:    JSON.stringify(data, null, 2),
        cache:   'no-store',
      });
      return r.ok;
    } catch { return false; }
  }

  async function loadData(filename) {
    if (!await isAvailable()) return null;
    try {
      const r = await fetch(BASE + '/api/tapmc/data/' + filename, { headers: _H, cache: 'no-store' });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  /* ── 圖片 ── */

  async function saveImage(id, dataUrl) {
    if (!await isAvailable()) return false;
    try {
      const r = await fetch(BASE + '/api/tapmc/media/img/' + id, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dataUrl }),
      });
      if (r.ok) _mediaCache.set('img_' + id, getImageUrl(id));
      return r.ok;
    } catch { return false; }
  }

  /** 直接返回伺服器圖片 URL，不做非同步請求 */
  function getImageUrl(id) {
    return BASE + '/api/tapmc/media/img_' + id + '.jpg';
  }

  /** 檢查伺服器上是否已有此圖片（帶快取） */
  async function imageExists(id) {
    const key = 'img_' + id;
    if (_mediaCache.has(key)) return true;
    if (!await isAvailable()) return false;
    try {
      const r = await fetch(getImageUrl(id), { method: 'HEAD', headers: _H });
      if (r.ok) { _mediaCache.set(key, getImageUrl(id)); return true; }
    } catch {}
    return false;
  }

  async function deleteImage(id) {
    if (!await isAvailable()) return;
    _mediaCache.delete('img_' + id);
    await fetch(BASE + '/api/tapmc/media/img_' + id + '.jpg', { method: 'DELETE' }).catch(() => {});
  }

  /* ── 影片 ── */

  /**
   * 上傳影片 Blob 至伺服器
   * 以 X-Extension Header 傳遞副檔名，body 為原始 binary
   */
  async function saveVideo(id, blob, origFilename) {
    if (!await isAvailable()) return false;
    const ext = (origFilename && origFilename.includes('.'))
      ? origFilename.split('.').pop().toLowerCase()
      : 'mp4';
    try {
      const r = await fetch(BASE + '/api/tapmc/media/vid/' + id, {
        method:  'POST',
        headers: {
          'Content-Type': blob.type || 'video/mp4',
          'X-Extension':  ext,
        },
        body: blob,
      });
      if (r.ok) _mediaCache.set('vid_' + id, BASE + '/api/tapmc/media/vid_' + id + '.' + ext);
      return r.ok;
    } catch { return false; }
  }

  /**
   * 找出伺服器上影片的實際 URL
   * 先查快取 → 再嘗試常見副檔名
   */
  async function findVideoUrl(id) {
    const key = 'vid_' + id;
    if (_mediaCache.has(key)) return _mediaCache.get(key);
    if (!await isAvailable()) return '';
    const exts = ['mp4', 'webm', 'mov', 'avi'];
    for (const ext of exts) {
      const url = BASE + '/api/tapmc/media/vid_' + id + '.' + ext;
      try {
        const r = await fetch(url, { method: 'HEAD', headers: _H });
        if (r.ok) { _mediaCache.set(key, url); return url; }
      } catch {}
    }
    return '';
  }

  async function deleteVideo(id) {
    if (!await isAvailable()) return;
    _mediaCache.delete('vid_' + id);
    const exts = ['mp4', 'webm', 'mov', 'avi'];
    await Promise.all(
      exts.map(ext => fetch(BASE + '/api/tapmc/media/vid_' + id + '.' + ext, { method: 'DELETE', headers: _H }).catch(() => {}))
    );
  }

  /* ── 對外介面 ── */
  return {
    isAvailable, resetAvailable,
    saveData, loadData,
    saveImage, getImageUrl, imageExists, deleteImage,
    saveVideo, findVideoUrl, deleteVideo,
  };
})();
