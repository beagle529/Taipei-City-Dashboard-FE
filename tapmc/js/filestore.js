/**
 * FileStore — 工作目錄檔案儲存模組
 * 使用 File System Access API 將媒體與序列清單持久化至磁碟
 *
 * 支援環境：Chrome / Edge 86+（file:// 或 http://）
 * 對外 API：
 *   pickDirectory()          使用者選取目錄（需 user gesture）
 *   setHandle(h)             以外部傳入的 handle 設定目錄（BC 接收用）
 *   restoreHandle()          啟動時從 IndexedDB 自動還原已授權目錄
 *   requestStoredPermission() 向使用者索取已存 handle 的讀寫權限（需 user gesture）
 *   hasDirectory()           是否已設定目錄
 *   getHandle()              取得原始 handle
 *   getDirectoryName()       目錄名稱（用於顯示）
 *   saveImage(id, dataUrl)   圖片存檔
 *   loadImage(id)            讀取圖片 → ObjectURL（需呼叫端 revokeObjectURL）
 *   deleteImage(id)          刪除圖片檔
 *   saveVideo(id, blob, name) 影片存檔
 *   loadVideo(id)             讀取影片 → ObjectURL
 *   deleteVideo(id)           刪除影片檔
 *   saveJSON(filename, data)  寫入 JSON 文字檔至工作目錄根層
 *   loadJSON(filename)        讀取並解析 JSON 文字檔（失敗回傳 null）
 */
const FileStore = (function () {
  'use strict';

  let _root  = null;   // FileSystemDirectoryHandle（根目錄）
  let _media = null;   // FileSystemDirectoryHandle（root/media/）

  /* ════════════════════════════════════════════════
     IndexedDB 輔助：持久化 directory handle
     資料庫名稱與 tapmc_media 隔離，避免衝突
     ════════════════════════════════════════════════ */
  const _IDB = (() => {
    let _db = null;
    const _open = () => _db ? Promise.resolve(_db) : new Promise((res, rej) => {
      const r = indexedDB.open('tapmc_fsapi', 1);
      r.onupgradeneeded = e => e.target.result.createObjectStore('kv');
      r.onsuccess  = e => { _db = e.target.result; res(_db); };
      r.onerror    = rej;
    });
    return {
      put: (k, v) => _open().then(db => new Promise((res, rej) => {
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(v, k);
        tx.oncomplete = res; tx.onerror = rej;
      })),
      get: (k) => _open().then(db => new Promise((res, rej) => {
        const r = db.transaction('kv', 'readonly').objectStore('kv').get(k);
        r.onsuccess = e => res(e.target.result); r.onerror = rej;
      })),
      del: (k) => _open().then(db => new Promise((res, rej) => {
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').delete(k);
        tx.oncomplete = res; tx.onerror = rej;
      })).catch(() => {}),
    };
  })();

  /* ── 取得（或建立）媒體子目錄 ── */
  async function _mediaDir() {
    if (!_root) return null;
    return _media || (_media = await _root.getDirectoryHandle('media', { create: true }));
  }

  /* ════════════════════════════════════════════════
     目錄管理
     ════════════════════════════════════════════════ */

  /** 檢查瀏覽器是否支援 File System Access API */
  function isSupported() {
    return typeof window.showDirectoryPicker === 'function';
  }

  /** 讓使用者以瀏覽器彈窗選取目錄（需 user gesture） */
  async function pickDirectory() {
    if (!isSupported()) {
      const err = new Error('此功能需要 Chrome 或 Edge 86 以上版本');
      err.name = 'NotSupportedError';
      throw err;
    }
    const h = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' });
    _root = h; _media = null;
    await _IDB.put('rootHandle', h);
    return h;
  }

  /** 以 BC 接收到的 handle 設定目錄（backdrop 端使用） */
  async function setHandle(h) {
    if (!h) return false;
    try {
      let perm = await h.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted')
        perm = await h.requestPermission({ mode: 'readwrite' }).catch(() => 'denied');
      if (perm !== 'granted') return false;
      _root = h; _media = null;
      await _IDB.put('rootHandle', h);
      return true;
    } catch { return false; }
  }

  /**
   * 啟動時嘗試從 IDB 還原 handle（不需 user gesture）
   * 若權限仍有效（同一個瀏覽器 session）則直接成功；
   * 否則回傳 false，須讓使用者點按鈕再授權
   */
  async function restoreHandle() {
    try {
      const h = await _IDB.get('rootHandle');
      if (!h) return false;
      const p = await h.queryPermission({ mode: 'readwrite' });
      if (p === 'granted') { _root = h; _media = null; return true; }
    } catch {}
    return false;
  }

  /**
   * 向使用者請求已存 handle 的讀寫權限（需 user gesture）
   * 瀏覽器重新啟動後 queryPermission 為 'prompt'，呼叫此函式後再授權
   */
  async function requestStoredPermission() {
    try {
      const h = await _IDB.get('rootHandle');
      if (!h) return false;
      const p = await h.requestPermission({ mode: 'readwrite' });
      if (p === 'granted') { _root = h; _media = null; return true; }
    } catch {}
    return false;
  }

  function hasDirectory()     { return !!_root; }
  function getHandle()        { return _root; }
  function getDirectoryName() { return _root ? _root.name : ''; }

  /* ════════════════════════════════════════════════
     圖片  media/img_{id}.jpg
     ════════════════════════════════════════════════ */

  async function saveImage(id, dataUrl) {
    const dir = await _mediaDir();
    if (!dir) return false;
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    const fh   = await dir.getFileHandle('img_' + id + '.jpg', { create: true });
    const w    = await fh.createWritable();
    await w.write(blob); await w.close();
    return true;
  }

  async function loadImage(id) {
    try {
      const dir = await _mediaDir();
      if (!dir) return '';
      const fh = await dir.getFileHandle('img_' + id + '.jpg');
      return URL.createObjectURL(await fh.getFile());
    } catch { return ''; }
  }

  async function deleteImage(id) {
    try { (await _mediaDir())?.removeEntry('img_' + id + '.jpg'); } catch {}
  }

  /* ════════════════════════════════════════════════
     影片  media/vid_{id}.{ext}
     副檔名存入 tapmc_fsapi IDB，以便再次查找
     ════════════════════════════════════════════════ */

  async function saveVideo(id, blob, origFilename) {
    const dir  = await _mediaDir();
    if (!dir) return false;
    const ext  = (origFilename && origFilename.includes('.'))
      ? origFilename.split('.').pop().toLowerCase()
      : 'mp4';
    await _IDB.put('vid_ext_' + id, ext);
    const fh = await dir.getFileHandle('vid_' + id + '.' + ext, { create: true });
    const w  = await fh.createWritable();
    await w.write(blob); await w.close();
    return true;
  }

  async function loadVideo(id) {
    try {
      const dir  = await _mediaDir();
      if (!dir) return '';
      const ext  = await _IDB.get('vid_ext_' + id).catch(() => null);
      const exts = [...new Set([ext, 'mp4', 'webm', 'mov', 'avi'].filter(Boolean))];
      for (const e of exts) {
        try {
          const fh = await dir.getFileHandle('vid_' + id + '.' + e);
          return URL.createObjectURL(await fh.getFile());
        } catch {}
      }
    } catch {}
    return '';
  }

  async function deleteVideo(id) {
    try {
      const dir  = await _mediaDir();
      if (!dir) return;
      const ext  = await _IDB.get('vid_ext_' + id).catch(() => null);
      const exts = [...new Set([ext, 'mp4', 'webm', 'mov', 'avi'].filter(Boolean))];
      for (const e of exts) await dir.removeEntry('vid_' + id + '.' + e).catch(() => {});
      await _IDB.del('vid_ext_' + id);
    } catch {}
  }

  /* ════════════════════════════════════════════════
     JSON 文字檔（presets、seq steps 等）
     存在工作目錄根層
     ════════════════════════════════════════════════ */

  async function saveJSON(filename, data) {
    if (!_root) return false;
    const fh = await _root.getFileHandle(filename, { create: true });
    const w  = await fh.createWritable();
    await w.write(JSON.stringify(data, null, 2));
    await w.close();
    return true;
  }

  async function loadJSON(filename) {
    try {
      if (!_root) return null;
      const fh = await _root.getFileHandle(filename);
      return JSON.parse(await (await fh.getFile()).text());
    } catch { return null; }
  }

  /* ════════════════════════════════════════════════
     對外介面
     ════════════════════════════════════════════════ */
  return {
    isSupported,
    pickDirectory, setHandle, restoreHandle, requestStoredPermission,
    hasDirectory, getHandle, getDirectoryName,
    saveImage, loadImage, deleteImage,
    saveVideo, loadVideo, deleteVideo,
    saveJSON, loadJSON,
  };
})();
