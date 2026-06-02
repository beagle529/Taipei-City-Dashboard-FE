/**
 * 臺北農產 51 週年背板 ── 前台監聽器
 * backdrop.js  |  版本 3.0
 *
 * 通訊三重保險：
 *   1. BroadcastChannel（同瀏覽器最快）
 *   2. localStorage storage 事件（跨分頁）
 *   3. 輪詢（每 800ms 比對版本號，兜底）
 */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════
     IndexedDB 媒體儲存（影片 Blob）
     ════════════════════════════════════════════════ */
  const MediaDB = (function () {
    let _db = null;
    function open() {
      if (_db) return Promise.resolve(_db);
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('tapmc_media', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('blobs');
        req.onsuccess  = e => { _db = e.target.result; resolve(_db); };
        req.onerror    = reject;
      });
    }
    return {
      get(key) {
        return open().then(db => new Promise((resolve, reject) => {
          const req = db.transaction('blobs', 'readonly').objectStore('blobs').get(key);
          req.onsuccess = e => resolve(e.target.result);
          req.onerror   = reject;
        }));
      },
      del(key) {
        return open().then(db => new Promise((resolve, reject) => {
          const tx = db.transaction('blobs', 'readwrite');
          tx.objectStore('blobs').delete(key);
          tx.oncomplete = resolve;
          tx.onerror    = reject;
        })).catch(() => {});
      },
    };
  })();

  const dynLayer = document.getElementById('dynamic-layer');

  const POSITION_STYLE = {
    'center':      { top: '50%',  left: '50%',  transform: 'translate(-50%,-50%)' },
    'upper':       { top: '18%',  left: '50%',  transform: 'translateX(-50%)' },
    'lower':       { bottom: 'calc(var(--ticker-h) + 60px)', left: '50%', transform: 'translateX(-50%)' },
    'lower-left':  { bottom: 'calc(var(--ticker-h) + 24px)', left:  '40px' },
    'lower-right': { bottom: 'calc(var(--ticker-h) + 24px)', right: '40px' },
    'upper-left':  { top: '80px', left:  '40px' },
    'upper-right': { top: '80px', right: '40px' },
  };

  const DEFAULTS = {
    title:    '臺北農產',
    year:     '115 年度',
    event:    '股東常會',
    eyebrow:  '2026 · BEINONG',
    footnote: 'Annual General Meeting of Shareholders',
  };

  const DEFAULT_TICKER = [
    '臺北農產運銷股份有限公司',
    '創立於民國 63 年',
    '經營理念：誠信・服務・創新・效率',
    '服務農民・穩定供需・守護餐桌',
    'Taipei Agricultural Products Marketing Corporation',
  ];

  /* ════════════════════════════════════════════════
     跑馬燈
     ════════════════════════════════════════════════ */
  function applyTicker(items) {
    const track = document.querySelector('.ticker-track');
    if (!track) return;
    const list = (items && items.length) ? items : DEFAULT_TICKER;
    track.innerHTML = '';
    [0, 1].forEach(() => {
      list.forEach(text => {
        const item = document.createElement('span');
        item.className = 'ticker-item';
        item.textContent = text;
        track.appendChild(item);
        const sep = document.createElement('span');
        sep.className = 'ticker-sep';
        sep.textContent = '◆';
        track.appendChild(sep);
      });
    });
    track.style.animation = 'none';
    track.offsetHeight;
    track.style.animation = '';
  }

  /* ════════════════════════════════════════════════
     縮小版標題：同步文字 + 淡入/淡出控制
     ════════════════════════════════════════════════ */
  function syncMiniTitle(d) {
    const g = id => document.getElementById(id);
    const me = g('mini-eyebrow'); if (me) me.textContent = d.eyebrow || DEFAULTS.eyebrow;
    const mm = g('mini-main');    if (mm) mm.textContent = d.title   || DEFAULTS.title;
    const ms = g('mini-sub');
    if (ms) ms.textContent = (d.year || DEFAULTS.year) + '　' + (d.event || DEFAULTS.event);
  }

  function setOverlayActive(active) {
    const hero = document.querySelector('.hero-text');
    const mini = document.getElementById('mini-title');
    if (active) {
      hero && hero.classList.add('hero-text--hide');
      mini && mini.classList.add('mini-title--show');
      mini && mini.removeAttribute('aria-hidden');
    } else {
      hero && hero.classList.remove('hero-text--hide');
      mini && mini.classList.remove('mini-title--show');
      mini && mini.setAttribute('aria-hidden', 'true');
    }
  }

  /* 掃描 dynamic-layer，判斷是否有需要縮移主標題的元素
     ・.vip-overlay     — 全螢幕 VIP 歡迎
     ・.dyn-el--announce — 公告框（backward-compat）
     ・[data-covers-hero] — 任何 position=center 的元素  */
  function refreshOverlayState() {
    const hasOverlay = !!dynLayer.querySelector('.vip-overlay, .dyn-el--announce, [data-covers-hero]');
    setOverlayActive(hasOverlay);
  }

  /* ════════════════════════════════════════════════
     文字設定
     ════════════════════════════════════════════════ */
  function applyText(d) {
    const q = s => document.querySelector(s);
    const g = id => document.getElementById(id);
    const t = q('.title-line--main'); if (t) t.textContent = d.title    || DEFAULTS.title;
    const y = q('.subtitle-year');    if (y) y.textContent = d.year     || DEFAULTS.year;
    const e = q('.subtitle-event');   if (e) e.textContent = d.event    || DEFAULTS.event;
    const b = g('hero-eyebrow');      if (b) b.textContent = d.eyebrow  || DEFAULTS.eyebrow;
    const f = g('hero-footnote');     if (f) f.textContent = d.footnote || DEFAULTS.footnote;
    syncMiniTitle(d);
  }

  /* ── 角標（51th）── */
  function applyBadge(data) {
    const badge = document.querySelector('.logo-corner__badge');
    if (!badge) return;
    const num = (data && data.num) ? data.num : '51';
    const sup = (data && data.sup) ? data.sup : 'th';
    badge.innerHTML = num + '<sup class="badge-sup">' + sup + '</sup>';
  }

  /* ── Logo 圖片（非同步讀取：localStorage → IndexedDB → 預設） ── */
  async function applyLogo() {
    const imgEl = document.querySelector('.logo-corner__img');
    if (!imgEl) return;

    /* ① 伺服器（跨電腦） */
    const svrOk = await ServerStore.isAvailable().catch(() => false);
    if (svrOk) {
      const exists = await ServerStore.imageExists('logo_custom').catch(() => false);
      if (exists) { imgEl.src = ServerStore.getImageUrl('logo_custom'); return; }
    }

    /* ② localStorage dataUrl */
    const ls = localStorage.getItem('tapmc_logo_src');
    if (ls) { imgEl.src = ls; return; }

    /* ③ IndexedDB Blob */
    const blob = await MediaDB.get('tapmc_logo').catch(() => null);
    if (blob) { imgEl.src = URL.createObjectURL(blob); return; }

    /* ④ 預設圖片（不做任何事，保留原 src） */
  }

  /* ── 背景主題 ── */
  function applyTheme(name) {
    const t = name || 'dark';
    document.documentElement.dataset.theme = t;
    if (typeof window.tapmc_setParticleTheme === 'function') {
      window.tapmc_setParticleTheme(t);
    }
  }

  /* ════════════════════════════════════════════════
     品牌圖形背景疊層
     Pantone：Orange 021C #f85101 / 2725C #6a4cff / 225C #ee0287
     ════════════════════════════════════════════════ */
  const _C = { o:'#f85101', v:'#6a4cff', p:'#ee0287', d:'#4408ff' };

  /* SVG 形體產生器 */
  function _msvg(shape, color) {
    const c = color;
    switch (shape) {
      case 'circle':
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="${c}"/></svg>`;
      case 'drop':
        return `<svg viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg"><path d="M50,0 C28,26 0,54 0,76 C0,99 23,118 50,118 C77,118 100,99 100,76 C100,54 72,26 50,0 Z" fill="${c}"/></svg>`;
      case 'roundsq':
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="92" height="92" rx="26" fill="${c}"/></svg>`;
      case 'petal':
        return `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg"><path d="M40,0 Q80,60 40,120 Q0,60 40,0 Z" fill="${c}"/></svg>`;
      case 'cluster':
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="42" height="42" rx="13" fill="${c}"/><rect x="55" y="3" width="42" height="42" rx="13" fill="${c}"/><rect x="3" y="55" width="42" height="42" rx="13" fill="${c}"/><rect x="55" y="55" width="42" height="42" rx="13" fill="${c}"/></svg>`;
      default:
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="${c}"/></svg>`;
    }
  }

  /* 各主題的形體定義 */
  const _MOTIF_DEFS = {
    orange: [
      { shape:'circle',  color:_C.o, count:2, minVw:22, maxVw:36, alpha:0.12, ccw:false },
      { shape:'roundsq', color:_C.o, count:1, minVw:18, maxVw:28, alpha:0.10, ccw:true  },
      { shape:'circle',  color:_C.o, count:3, minVw: 5, maxVw:11, alpha:0.09, ccw:false },
      { shape:'roundsq', color:_C.p, count:2, minVw: 3, maxVw: 7, alpha:0.08, ccw:true  },
    ],
    drop: [
      { shape:'drop',    color:_C.v, count:2, minVw:22, maxVw:36, alpha:0.12, ccw:false },
      { shape:'drop',    color:_C.d, count:1, minVw:16, maxVw:26, alpha:0.10, ccw:true  },
      { shape:'drop',    color:_C.v, count:2, minVw: 6, maxVw:12, alpha:0.09, ccw:false },
      { shape:'drop',    color:_C.d, count:2, minVw: 3, maxVw: 7, alpha:0.08, ccw:true  },
    ],
    vivid: [
      { shape:'circle',  color:_C.o, count:1, minVw:24, maxVw:36, alpha:0.11, ccw:false },
      { shape:'drop',    color:_C.v, count:1, minVw:22, maxVw:34, alpha:0.10, ccw:false },
      { shape:'petal',   color:_C.p, count:1, minVw:20, maxVw:32, alpha:0.11, ccw:true  },
      { shape:'roundsq', color:_C.o, count:2, minVw: 8, maxVw:14, alpha:0.09, ccw:false },
      { shape:'drop',    color:_C.v, count:2, minVw: 7, maxVw:13, alpha:0.09, ccw:true  },
      { shape:'circle',  color:_C.p, count:2, minVw: 5, maxVw:10, alpha:0.09, ccw:false },
      { shape:'circle',  color:_C.o, count:2, minVw: 3, maxVw: 6, alpha:0.08, ccw:true  },
      { shape:'drop',    color:_C.d, count:2, minVw: 3, maxVw: 6, alpha:0.08, ccw:false },
    ],
    geo: [
      { shape:'cluster', color:_C.o, count:2, minVw:18, maxVw:28, alpha:0.12, ccw:false },
      { shape:'drop',    color:_C.v, count:1, minVw:22, maxVw:34, alpha:0.11, ccw:false },
      { shape:'petal',   color:_C.p, count:1, minVw:18, maxVw:28, alpha:0.11, ccw:true  },
      { shape:'cluster', color:_C.o, count:2, minVw: 8, maxVw:15, alpha:0.09, ccw:true  },
      { shape:'drop',    color:_C.d, count:2, minVw: 5, maxVw:10, alpha:0.09, ccw:false },
      { shape:'petal',   color:_C.p, count:2, minVw: 4, maxVw: 8, alpha:0.08, ccw:false },
    ],
    /* ── 品牌特顯：種子・水滴・果實 高存在感版 ── */
    brand: [
      /* 大主角 × 3：分散於畫面三區 */
      { shape:'circle',  color:_C.o, count:1, minVw:30, maxVw:42, alpha:0.52, ccw:false },  /* 種子 */
      { shape:'drop',    color:_C.v, count:1, minVw:28, maxVw:40, alpha:0.48, ccw:false },  /* 水滴 */
      { shape:'circle',  color:_C.p, count:1, minVw:26, maxVw:38, alpha:0.50, ccw:true  },  /* 果實 */
      /* 中型陪襯 × 6 */
      { shape:'circle',  color:_C.o, count:2, minVw:10, maxVw:18, alpha:0.28, ccw:false },
      { shape:'drop',    color:_C.v, count:2, minVw: 9, maxVw:16, alpha:0.26, ccw:true  },
      { shape:'circle',  color:_C.p, count:2, minVw: 8, maxVw:14, alpha:0.26, ccw:false },
      /* 小碎片點綴 × 6 */
      { shape:'circle',  color:_C.o, count:2, minVw: 3, maxVw: 7, alpha:0.20, ccw:true  },
      { shape:'drop',    color:_C.d, count:2, minVw: 3, maxVw: 6, alpha:0.18, ccw:false },
      { shape:'circle',  color:_C.p, count:2, minVw: 3, maxVw: 6, alpha:0.18, ccw:true  },
    ],
  };

  let _motifEl = null;

  function applyMotif(name) {
    if (_motifEl) { _motifEl.remove(); _motifEl = null; }
    if (!name || name === '0') return;
    const defs = _MOTIF_DEFS[name];
    if (!defs) return;

    _motifEl = document.createElement('div');
    _motifEl.id = 'tapmc-motif-layer';
    _motifEl.setAttribute('aria-hidden', 'true');

    const rng = (a, b) => a + Math.random() * (b - a);
    const sign = () => Math.random() < 0.5 ? 1 : -1;

    defs.forEach(grp => {
      for (let i = 0; i < grp.count; i++) {
        const sizeVw  = rng(grp.minVw, grp.maxVw);
        const x       = rng(5, 90);
        const y       = rng(5, 90);
        /* 四段漂移向量，確保軌跡自然 */
        const dx  = sign() * rng(8, 18);
        const dy  = sign() * rng(6, 15);
        const dx1 = sign() * rng(5, 13);
        const dy1 = sign() * rng(5, 13);
        const dx2 = sign() * rng(6, 14);
        const dy2 = sign() * rng(5, 13);
        const floatDur = rng(25, 55);
        const spinDur  = rng(45, 120);
        const delay    = -rng(0, 40);   /* 負延遲讓各圖形起始相位分散 */
        const spinKf   = grp.ccw ? 'bshape-spin-ccw' : 'bshape-spin-cw';

        const wrap = document.createElement('div');
        wrap.className = 'bshape-wrap';
        wrap.style.cssText = [
          `width:${sizeVw}vw`, `height:${sizeVw}vw`,
          `left:${x}%`, `top:${y}%`,
          `opacity:${grp.alpha}`,
          `--dx:${dx}vw`,  `--dy:${dy}vw`,
          `--dx1:${dx1}vw`,`--dy1:${dy1}vw`,
          `--dx2:${dx2}vw`,`--dy2:${dy2}vw`,
          `animation:bshape-drift ${floatDur.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s infinite`,
        ].join(';');

        const inner = document.createElement('div');
        inner.className = 'bshape-inner';
        inner.style.animation = `${spinKf} ${spinDur.toFixed(1)}s linear ${delay.toFixed(1)}s infinite`;
        inner.innerHTML = _msvg(grp.shape, grp.color);

        wrap.appendChild(inner);
        _motifEl.appendChild(wrap);
      }
    });

    const canvas = document.getElementById('particle-canvas');
    if (canvas && canvas.parentNode) {
      canvas.insertAdjacentElement('afterend', _motifEl);
    } else {
      document.body.appendChild(_motifEl);
    }
  }

  /* ── 主標題色彩動畫（多款樣式） ── */
  const _ANIM_CLASSES = ['title--color-anim','title--anim-2','title--anim-3','title--anim-4'];
  function applyTitleAnim(val) {
    const el = document.querySelector('.title-line--main');
    if (!el) return;
    /* 移除所有動畫 class */
    _ANIM_CLASSES.forEach(c => el.classList.remove(c));
    const v = String(val);
    if      (v === '1') el.classList.add('title--color-anim');
    else if (v === '2') el.classList.add('title--anim-2');
    else if (v === '3') el.classList.add('title--anim-3');
    else if (v === '4') el.classList.add('title--anim-4');
    /* v === '0' 或其他：不加 class，維持靜態白字 */
  }

  /* ════════════════════════════════════════════════
     計時器管理
     ════════════════════════════════════════════════ */
  const timers = {};

  function clearTimer(id) {
    const t = timers[id];
    if (!t) return;
    if (t.interval) clearInterval(t.interval);
    if (t.timeout)  clearTimeout(t.timeout);
    delete timers[id];
  }

  /* ════════════════════════════════════════════════
     全部元素重繪
     ════════════════════════════════════════════════ */
  /* 防抖：BroadcastChannel 與 storage 事件可能在 50ms 內同時觸發，
     合併成一次 render 防止元素瞬間消失再出現（閃爍） */
  let _renderAllTimer = null;
  function renderAll() {
    clearTimeout(_renderAllTimer);
    _renderAllTimer = setTimeout(_doRenderAll, 50);
  }
  function _doRenderAll() {
    _renderAllTimer = null;
    Object.keys(timers).forEach(clearTimer);
    /* 保留序列元素，只清除一般元素 */
    dynLayer.querySelectorAll('.dyn-el:not(.dyn-el--seq)').forEach(n => n.remove());
    loadElements().forEach(renderElement);
    refreshOverlayState();
  }

  /* ════════════════════════════════════════════════
     媒體 src 解析（非同步）
     圖片優先順序：① 伺服器 → ② FileStore → ③ IndexedDB → ④ localStorage
     影片優先順序：① 伺服器 → ② FileStore → ③ IndexedDB
     ════════════════════════════════════════════════ */

  async function resolveImageSrc(content) {
    if (!content) return '';
    if (content.startsWith('__img__')) {
      const id = content.slice(7);

      /* ① 伺服器（跨電腦，最優先）—— 帶快取的 HEAD 檢查 */
      const svrOk = await ServerStore.isAvailable().catch(() => false);
      if (svrOk) {
        const exists = await ServerStore.imageExists(id);
        if (exists) return ServerStore.getImageUrl(id);
      }

      /* ② FileStore 磁碟（Chrome/Edge，需已選取目錄） */
      if (FileStore.hasDirectory()) {
        const src = await FileStore.loadImage(id).catch(() => '');
        if (src) return src;
      }

      /* ③ IndexedDB（本機備援，無空間限制） */
      const idbData = await MediaDB.get('img_' + id).catch(() => null);
      if (idbData) {
        if (idbData instanceof Blob) return URL.createObjectURL(idbData);
        return idbData;
      }

      /* ④ localStorage（舊版備份） */
      const ls = localStorage.getItem('tapmc_img_' + id);
      if (ls) return ls;

      console.warn('[resolveImageSrc] 找不到圖片資料：', content);
      return '';
    }
    return content;
  }

  async function resolveVideoSrc(content) {
    if (!content) return '';
    if (content.startsWith('__vid__')) {
      const id = content.slice(7);

      /* ① 伺服器（跨電腦，最優先） */
      const svrOk = await ServerStore.isAvailable().catch(() => false);
      if (svrOk) {
        const url = await ServerStore.findVideoUrl(id);
        if (url) return url;
      }

      /* ② FileStore 磁碟（Chrome/Edge） */
      if (FileStore.hasDirectory()) {
        const src = await FileStore.loadVideo(id).catch(() => '');
        if (src) return src;
      }

      /* ③ IndexedDB（本機備援） */
      return MediaDB.get('vid_' + id).then(blob => {
        if (!blob) {
          console.warn('[resolveVideoSrc] 找不到影片 blob：', content);
          return '';
        }
        return URL.createObjectURL(blob);
      }).catch(err => {
        console.warn('[resolveVideoSrc] IndexedDB 讀取失敗：', err);
        return '';
      });
    }
    return content;
  }

  /* ════════════════════════════════════════════════
     VIP 歡迎覆蓋層（全螢幕）
     ════════════════════════════════════════════════ */
  function renderVip(el) {
    const wrap = document.createElement('div');
    wrap.id = 'dyn-' + el.id;
    wrap.classList.add('dyn-el', 'vip-overlay');

    const scan = document.createElement('div');
    scan.className = 'vip-scan';

    const corners = document.createElement('div');
    corners.className = 'vip-corners';
    ['tl','tr','bl','br'].forEach(pos => {
      const c = document.createElement('span');
      c.className = 'vip-corner vip-corner--' + pos;
      corners.appendChild(c);
    });

    const textWrap = document.createElement('div');
    textWrap.className = 'vip-text-wrap';

    const prefix   = document.createElement('span');
    prefix.className = 'vip-prefix';
    prefix.textContent = '歡　迎';

    const divider1 = document.createElement('div');
    divider1.className = 'vip-divider-line';

    const name = document.createElement('span');
    name.className = 'vip-name';
    name.textContent = el.content;

    const divider2 = document.createElement('div');
    divider2.className = 'vip-divider-line';

    const suffix = document.createElement('span');
    suffix.className = 'vip-suffix';
    suffix.textContent = '蒞　臨';

    textWrap.appendChild(prefix);
    textWrap.appendChild(divider1);
    textWrap.appendChild(name);
    textWrap.appendChild(divider2);
    textWrap.appendChild(suffix);

    wrap.appendChild(scan);
    wrap.appendChild(corners);
    wrap.appendChild(textWrap);
    dynLayer.appendChild(wrap);

    refreshOverlayState();

    if (el.autoDismiss && el.autoDismiss > 0) {
      timers[el.id] = timers[el.id] || {};
      timers[el.id].timeout = setTimeout(() => {
        wrap.classList.add('dyn-el--fading');
        setTimeout(() => {
          wrap.remove();
          clearTimer(el.id);
          refreshOverlayState();
          const remaining = loadElements().filter(e => e.id !== el.id);
          localStorage.setItem('tapmc_elements', JSON.stringify(remaining));
          notify('elements');
        }, 900);
      }, el.autoDismiss * 1000);
    }
  }

  /* ════════════════════════════════════════════════
     下方橫條跑馬燈 DOM 建構器
     ════════════════════════════════════════════════ */
  function _createLowerThirdTicker(text, fontSize) {
    const track = document.createElement('div');
    track.className = 'lt-ticker-track';
    /* 每份複本佔滿 100vw → 確保初始只有第一份可見；
       捲動結束時第二份恰好對齊第一份起點（無縫循環）
       速度：畫面寬度 ÷ 每秒像素數（約 160px/s），最少 8 秒 */
    const dur = Math.max(8, Math.round(window.innerWidth / 160)) + 's';
    track.style.setProperty('--lt-dur', dur);
    /* 複製兩份達成無縫循環，每份用 .lt-ticker-cell 撐滿一個 viewport */
    [0, 1].forEach(() => {
      const cell = document.createElement('div');
      cell.className = 'lt-ticker-cell';
      const span = document.createElement('span');
      span.textContent = text || '';
      cell.appendChild(span);
      const sep = document.createElement('span');
      sep.className = 'lt-ticker-sep';
      sep.textContent = '◆';
      cell.appendChild(sep);
      track.appendChild(cell);
    });
    return track;
  }

  /* ════════════════════════════════════════════════
     一般元素渲染
     ════════════════════════════════════════════════ */
  function renderElement(el) {
    if (!el.visible) return;
    if (el.type === 'vip')   { renderVip(el);   return; }
    if (el.type === 'video') { renderVideoElement(el); return; }
    if (el.type === 'image') { renderImageElement(el); return; }

    const div = document.createElement('div');
    div.id = 'dyn-' + el.id;
    div.classList.add('dyn-el');

    if      (el.type === 'lower-third') div.classList.add('dyn-el--lower-third');
    else if (el.type === 'announce')    div.classList.add('dyn-el--announce');
    else if (el.type === 'countdown')   div.classList.add('dyn-el--countdown');

    if (el.color === 'gradient') div.classList.add('dyn-el--gradient');
    else                         div.classList.add('dyn-el--' + el.color);

    div.style.fontSize = el.size + 'px';

    if (el.type !== 'lower-third') {
      Object.assign(div.style, POSITION_STYLE[el.position] || POSITION_STYLE['center']);
    }

    /* 正中間元素 → 標記為需縮移主標題 */
    if ((el.position === 'center' || !el.position) && el.type !== 'lower-third') {
      div.dataset.coversHero = '1';
    }

    if (el.type === 'countdown') {
      div.textContent = formatTime(el.countdownSecs);
      startCountdown(div, el);
    } else if (el.type === 'lower-third') {
      div.appendChild(_createLowerThirdTicker(el.content, el.size));
    } else {
      div.style.whiteSpace = 'pre-line';
      div.textContent = el.content;
    }

    dynLayer.appendChild(div);

    if (el.type === 'announce') refreshOverlayState();

    if (el.autoDismiss && el.autoDismiss > 0) {
      timers[el.id] = timers[el.id] || {};
      timers[el.id].timeout = setTimeout(() => {
        div.classList.add('dyn-el--fading');
        setTimeout(() => {
          div.remove();
          clearTimer(el.id);
          refreshOverlayState();
          const remaining = loadElements().filter(e => e.id !== el.id);
          localStorage.setItem('tapmc_elements', JSON.stringify(remaining));
          notify('elements');
        }, 900);
      }, el.autoDismiss * 1000);
    }
  }

  /* ── 圖片元素（支援多張輪播 + 全螢幕） ── */
  function renderImageElement(el) {
    /* slides 陣列：新版多張；content：舊版相容 */
    const slideIds = (el.slides && el.slides.length) ? el.slides : (el.content ? [el.content] : []);
    if (!slideIds.length) return;

    const isSplit     = el.layout === 'split';
    const isFullscreen = el.fullscreen;

    const div = document.createElement('div');
    div.id = 'dyn-' + el.id;
    div.classList.add('dyn-el', 'dyn-el--image');

    if (isFullscreen || isSplit) {
      /* 全螢幕 / 並列：固定鋪滿整個 viewport */
      Object.assign(div.style, {
        position: 'fixed', inset: '0',
        width: '100vw', height: '100vh',
        display: 'flex',
        alignItems: isSplit ? 'stretch' : 'center',
        justifyContent: isSplit ? 'flex-start' : 'center',
        background: '#000',
      });
      div.dataset.coversHero = '1';
    } else {
      div.style.width = (el.size || 40) + 'vw';
      Object.assign(div.style, POSITION_STYLE[el.position] || POSITION_STYLE['center']);
      if (el.position === 'center' || !el.position) div.dataset.coversHero = '1';
    }

    /* ── 建立圖片元素 ── */
    const imgCount = isSplit ? 2 : 1;
    const imgs = [];
    for (let i = 0; i < imgCount; i++) {
      const img = document.createElement('img');
      img.alt = ''; img.draggable = false;
      img.style.transition = 'opacity 0.35s';

      if (isSplit) {
        /* 並列：用 wrapper 讓圖片貼緊中線，無間隙 */
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
          width: '50%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        });
        Object.assign(img.style, {
          maxWidth: '100%', maxHeight: '100%',
          objectFit: 'contain', display: 'block',
        });
        wrapper.appendChild(img);
        div.appendChild(wrapper);
      } else {
        if (isFullscreen) {
          Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'contain' });
        }
        div.appendChild(img);
      }
      imgs.push(img);
    }
    dynLayer.appendChild(div);

    /* ── 載入圖片（並列一次顯示2張，單張顯示1張） ── */
    let curIdx = 0;
    function showSlide(startIdx) {
      imgs.forEach((img, i) => {
        const sid = slideIds[(startIdx + i) % slideIds.length];
        resolveImageSrc(sid).then(src => { img.src = src || ''; });
      });
    }
    showSlide(0);

    /* ── 輪播 timer ── */
    const step   = isSplit ? 2 : 1;           /* 並列每次跳 2 張 */
    const total  = isSplit ? Math.ceil(slideIds.length / 2) * 2 : slideIds.length;
    if (slideIds.length > step) {
      const ms = (el.interval || 5) * 1000;
      timers[el.id] = timers[el.id] || {};
      timers[el.id].interval = setInterval(() => {
        imgs.forEach(img => { img.style.opacity = '0'; });
        setTimeout(() => {
          curIdx = (curIdx + step) % total;
          showSlide(curIdx);
          imgs.forEach(img => { img.style.opacity = '1'; });
        }, 350);
      }, ms);
    }

    refreshOverlayState();

    /* ── 自動消失 ── */
    if (el.autoDismiss && el.autoDismiss > 0) {
      timers[el.id] = timers[el.id] || {};
      timers[el.id].timeout = setTimeout(() => {
        div.classList.add('dyn-el--fading');
        setTimeout(() => {
          div.remove();
          clearTimer(el.id);
          refreshOverlayState();
          const remaining = loadElements().filter(e => e.id !== el.id);
          localStorage.setItem('tapmc_elements', JSON.stringify(remaining));
          notify('elements');
        }, 900);
      }, el.autoDismiss * 1000);
    }
  }

  /* ── 影片元素（非同步） ── */
  function renderVideoElement(el) {
    resolveVideoSrc(el.content).then(src => {
      const div = document.createElement('div');
      div.id = 'dyn-' + el.id;
      div.classList.add('dyn-el', 'dyn-el--video');
      div.style.width = (el.size || 60) + 'vw';

      Object.assign(div.style, POSITION_STYLE[el.position] || POSITION_STYLE['center']);
      if (el.position === 'center' || !el.position) div.dataset.coversHero = '1';

      const video = document.createElement('video');
      video.src         = src;
      video.controls    = false;
      video.playsInline = true;
      video.preload     = 'auto';

      function dismiss() {
        div.classList.add('dyn-el--fading');
        setTimeout(() => {
          div.remove();
          clearTimer(el.id);
          if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
          if (el.content && el.content.startsWith('__vid__'))
            MediaDB.del('vid_' + el.content.slice(7));
          refreshOverlayState();
          const remaining = loadElements().filter(e => e.id !== el.id);
          localStorage.setItem('tapmc_elements', JSON.stringify(remaining));
          notify('elements');
        }, 900);
      }

      /* autoDismiss=0 → 播完自動結束；>0 → 計時結束 */
      if (el.autoDismiss === 0) {
        video.addEventListener('ended', dismiss);
      } else {
        timers[el.id] = { timeout: setTimeout(dismiss, el.autoDismiss * 1000) };
      }

      div.appendChild(video);
      dynLayer.appendChild(div);
      refreshOverlayState();

      /* 顯式播放（避免 autoplay 屬性被瀏覽器忽略） */
      safeVideoPlay(video, dismiss);
    });
  }

  /* ════════════════════════════════════════════════
     影片安全播放
     策略：有聲 → 若被瀏覽器封鎖 → 靜音重試 → 若還失敗 → onFail()
     ════════════════════════════════════════════════ */
  function safeVideoPlay(video, onFail) {
    video.muted = false;
    const p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        /* 嘗試靜音播放（符合大多數瀏覽器 autoplay 政策） */
        video.muted = true;
        video.play().catch(() => {
          /* 完全無法播放（極少見），呼叫失敗回調 */
          if (onFail) onFail();
        });
      });
    }
  }

  /* ── 倒數計時 ── */
  function startCountdown(div, el) {
    let remaining = el.countdownSecs;
    timers[el.id] = timers[el.id] || {};
    timers[el.id].interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timers[el.id].interval);
        div.textContent = '00:00';
        div.style.color = '#E6005C';
        return;
      }
      div.textContent = formatTime(remaining);
      if (remaining <= 10) div.style.color = '#E6005C';
    }, 1000);
  }

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return m + ':' + s;
  }

  /* ── localStorage 工具 ── */
  function loadElements() {
    try { return JSON.parse(localStorage.getItem('tapmc_elements') || '[]'); }
    catch { return []; }
  }

  /* ════════════════════════════════════════════════
     序列播放器
     ════════════════════════════════════════════════ */
  function handleSeqState(state) {
    if (!state) return;
    /* ★ 立即同步輪詢基準，防止 800ms 後再度重複觸發 */
    lastSeqStateJson = JSON.stringify(state);

    if (!state.running) {
      /* 停止：清除序列元素 */
      const old = dynLayer.querySelector('.dyn-el--seq');
      if (old) {
        old.classList.add('dyn-el--fading');
        setTimeout(() => { old.remove(); refreshOverlayState(); }, 900);
      }
      return;
    }
    if (state.running && state.currentStep >= 0) {
      startSeqStep(state);
    }
  }

  function startSeqStep(state) {
    const seqData = JSON.parse(localStorage.getItem('tapmc_seq') || 'null');
    if (!seqData || !Array.isArray(seqData.steps)) return;

    const idx  = state.currentStep;
    const step = seqData.steps[idx];

    if (!step) {
      /* 序列播完 */
      state.running     = false;
      state.currentStep = -1;
      const _doneJson = JSON.stringify(state);
      localStorage.setItem('tapmc_seq_state', _doneJson);
      lastSeqStateJson = _doneJson;   /* ★ 同步輪詢基準 */
      notify('seq');
      return;
    }

    /* 清除上一個序列元素（data-seq-fading 中的讓它自行淡出，不強制移除） */
    dynLayer.querySelectorAll('.dyn-el--seq:not([data-seq-fading])').forEach(n => n.remove());

    const elId = 'seq-' + Date.now();

    if (step.type === 'video') {
      resolveVideoSrc(step.content).then(src =>
        _renderSeqEl(step, elId, state, src)
      );
    } else {
      _renderSeqEl(step, elId, state, null);
    }
  }

  function _renderSeqEl(step, elId, state, resolvedSrc) {
    const div = document.createElement('div');
    div.id = elId;
    div.classList.add('dyn-el', 'dyn-el--seq');

    if      (step.type === 'lower-third') div.classList.add('dyn-el--lower-third');
    else if (step.type === 'announce')    div.classList.add('dyn-el--announce');
    else if (step.type === 'countdown')   div.classList.add('dyn-el--countdown');
    else if (step.type === 'image')       div.classList.add('dyn-el--image');
    else if (step.type === 'video')       div.classList.add('dyn-el--video');

    const isMedia = step.type === 'image' || step.type === 'video';
    if (!isMedia) {
      if (step.color === 'gradient') div.classList.add('dyn-el--gradient');
      else div.classList.add('dyn-el--' + (step.color || 'white'));
    }

    if (isMedia) {
      div.style.width = (step.size || 60) + 'vw';
    } else {
      div.style.fontSize = (step.size || 36) + 'px';
    }

    if (step.type !== 'lower-third') {
      Object.assign(div.style, POSITION_STYLE[step.position] || POSITION_STYLE['center']);
    }
    if ((step.position === 'center' || !step.position) && step.type !== 'lower-third') {
      div.dataset.coversHero = '1';
    }

    /* 完成 → 推進到下一步（交叉淡入：先渲染下一步，再淡出自己）*/
    let _stepDone = false;
    function onStepComplete() {
      if (_stepDone) return;
      _stepDone = true;

      /* 標記自己為「淡出中」，讓 startSeqStep 的 cleanup 跳過此元素 */
      div.dataset.seqFading = '1';
      div.classList.add('dyn-el--fading');

      /* ① 立即推進並渲染下一步（與淡出同時進行，避免主標題閃回） */
      state.currentStep++;
      const _newStateJson = JSON.stringify(state);
      localStorage.setItem('tapmc_seq_state', _newStateJson);
      lastSeqStateJson = _newStateJson;   /* ★ 同步輪詢基準，防止重複觸發 */
      notify('seq');
      startSeqStep(state);

      /* ② 淡出動畫結束後才移除舊元素 */
      setTimeout(() => {
        div.remove();
        if (resolvedSrc && resolvedSrc.startsWith('blob:')) URL.revokeObjectURL(resolvedSrc);
        refreshOverlayState();
      }, 900);
    }

    /* 內容渲染 */
    if (step.type === 'video') {
      const video = document.createElement('video');
      video.src         = resolvedSrc || '';
      video.controls    = false;
      video.playsInline = true;
      video.preload     = 'auto';
      video.addEventListener('ended', onStepComplete);
      if (step.autoDismiss > 0) setTimeout(onStepComplete, step.autoDismiss * 1000);
      div.appendChild(video);
      /* 顯式播放 + muted 重試保險 */
      safeVideoPlay(video, onStepComplete);

    } else if (step.type === 'image') {
      /* autoDismiss 計時立即開始，圖片非同步載入後才插入 DOM */
      if (step.autoDismiss > 0) setTimeout(onStepComplete, step.autoDismiss * 1000);
      resolveImageSrc(step.content).then(src => {
        const img = document.createElement('img');
        img.src       = src || '';
        img.alt       = '';
        img.draggable = false;
        div.appendChild(img);
      });

    } else if (step.type === 'countdown') {
      let remaining = step.countdownSecs || parseInt(step.content) || 60;
      div.textContent = formatTime(remaining);
      const iv = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(iv);
          div.textContent = '00:00';
          div.style.color = '#E6005C';
          setTimeout(onStepComplete, 800);
          return;
        }
        div.textContent = formatTime(remaining);
        if (remaining <= 10) div.style.color = '#E6005C';
      }, 1000);

    } else if (step.type === 'lower-third') {
      div.appendChild(_createLowerThirdTicker(step.content, step.size));
      if (step.autoDismiss > 0) setTimeout(onStepComplete, step.autoDismiss * 1000);
    } else {
      div.style.whiteSpace = 'pre-line';
      div.textContent = step.content || '';
      if (step.autoDismiss > 0) setTimeout(onStepComplete, step.autoDismiss * 1000);
    }

    dynLayer.appendChild(div);
    refreshOverlayState();
  }

  /* ════════════════════════════════════════════════
     通訊：三重保險

     1. BroadcastChannel（同瀏覽器最即時）
     2. storage 事件（跨分頁備援）
     3. 輪詢（兜底，每 800ms 比對版本號）
     ════════════════════════════════════════════════ */

  let _bc = null;
  function notify(type) { if (_bc) _bc.postMessage(type); }

  /* 1. BroadcastChannel */
  try {
    _bc = new BroadcastChannel('tapmc_backdrop');
    const bc = _bc;
    bc.onmessage = e => {
      if (e.data === 'elements') renderAll();
      if (e.data === 'text') {
        const d = JSON.parse(localStorage.getItem('tapmc_text') || 'null');
        if (d) applyText(d);
      }
      if (e.data === 'ticker') {
        applyTicker(JSON.parse(localStorage.getItem('tapmc_ticker') || 'null'));
      }
      if (e.data === 'title_anim') {
        applyTitleAnim(localStorage.getItem('tapmc_title_anim') || '0');
      }
      if (e.data === 'badge') {
        applyBadge(JSON.parse(localStorage.getItem('tapmc_badge') || 'null'));
      }
      if (e.data === 'logo') {
        applyLogo();
      }
      if (e.data === 'theme') {
        applyTheme(localStorage.getItem('tapmc_theme') || 'dark');
      }
      if (e.data === 'motif') {
        applyMotif(localStorage.getItem('tapmc_motif') || '0');
      }
      if (e.data === 'seq') {
        const state = JSON.parse(localStorage.getItem('tapmc_seq_state') || 'null');
        handleSeqState(state);
      }
      /* 物件格式：夾帶步驟資料（admin 開始/停止時送出） */
      if (e.data && typeof e.data === 'object' && e.data.type === 'seq') {
        /* ★ 把步驟資料寫入本機 localStorage，確保序列能正確讀取 */
        if (e.data.steps) {
          localStorage.setItem('tapmc_seq', JSON.stringify({ steps: e.data.steps }));
        }
        if (e.data.state) {
          const js = JSON.stringify(e.data.state);
          localStorage.setItem('tapmc_seq_state', js);
          lastSeqStateJson = js;
          handleSeqState(e.data.state);
        }
      }
      /* Admin 送來工作目錄 handle → 接收並儲存，之後可直接讀取媒體檔案 */
      if (e.data && typeof e.data === 'object' && e.data.type === 'fstore_handle' && e.data.handle) {
        FileStore.setHandle(e.data.handle).then(ok => {
          if (ok) renderAll();   /* 重新渲染：現在可從磁碟讀取圖片/影片 */
        });
      }
    };
  } catch (_) { /* 環境不支援時忽略 */ }

  /* 2. storage 事件 */
  window.addEventListener('storage', e => {
    if (e.key === 'tapmc_text')       applyText(JSON.parse(e.newValue || 'null') || DEFAULTS);
    if (e.key === 'tapmc_elements')   renderAll();
    if (e.key === 'tapmc_ticker')     applyTicker(JSON.parse(e.newValue || 'null'));
    if (e.key === 'tapmc_seq_state')  handleSeqState(JSON.parse(e.newValue || 'null'));
    if (e.key === 'tapmc_title_anim') applyTitleAnim(e.newValue || '0');
    if (e.key === 'tapmc_badge')      applyBadge(JSON.parse(e.newValue || 'null'));
    if (e.key === 'tapmc_logo_src')   applyLogo();
    if (e.key === 'tapmc_theme')      applyTheme(e.newValue || 'dark');
    if (e.key === 'tapmc_motif')      applyMotif(e.newValue || '0');
  });

  /* 3. 輪詢兜底（每 800ms） */
  let lastElJson        = localStorage.getItem('tapmc_elements')   || '[]';
  let lastTxtJson       = localStorage.getItem('tapmc_text')       || 'null';
  let lastTickerJson    = localStorage.getItem('tapmc_ticker')     || 'null';
  let lastSeqStateJson  = localStorage.getItem('tapmc_seq_state')  || 'null';
  let lastTitleAnimJson = localStorage.getItem('tapmc_title_anim') || '1';
  let lastBadgeJson     = localStorage.getItem('tapmc_badge')      || 'null';
  let lastLogoSrc       = localStorage.getItem('tapmc_logo_src')   || '';

  setInterval(() => {
    const elJson        = localStorage.getItem('tapmc_elements')   || '[]';
    const txtJson       = localStorage.getItem('tapmc_text')       || 'null';
    const tickerJson    = localStorage.getItem('tapmc_ticker')     || 'null';
    const seqStateJson  = localStorage.getItem('tapmc_seq_state')  || 'null';
    const titleAnimJson = localStorage.getItem('tapmc_title_anim') || '1';
    const badgeJson     = localStorage.getItem('tapmc_badge')      || 'null';
    const logoSrc       = localStorage.getItem('tapmc_logo_src')   || '';

    if (elJson        !== lastElJson)        { lastElJson        = elJson;        renderAll(); }
    if (txtJson       !== lastTxtJson)       { lastTxtJson       = txtJson;       applyText(JSON.parse(txtJson) || DEFAULTS); }
    if (tickerJson    !== lastTickerJson)    { lastTickerJson    = tickerJson;    applyTicker(JSON.parse(tickerJson)); }
    if (seqStateJson  !== lastSeqStateJson)  { lastSeqStateJson  = seqStateJson;  handleSeqState(JSON.parse(seqStateJson)); }
    if (titleAnimJson !== lastTitleAnimJson) { lastTitleAnimJson = titleAnimJson; applyTitleAnim(titleAnimJson); }
    if (badgeJson     !== lastBadgeJson)     { lastBadgeJson     = badgeJson;     applyBadge(JSON.parse(badgeJson)); }
    if (logoSrc       !== lastLogoSrc)       { lastLogoSrc       = logoSrc;       applyLogo(); }
    const themeJson = localStorage.getItem('tapmc_theme') || 'dark';
    if (themeJson !== lastThemeJson) { lastThemeJson = themeJson; applyTheme(themeJson); }
    const motifJson = localStorage.getItem('tapmc_motif') || '0';
    if (motifJson !== lastMotifJson) { lastMotifJson = motifJson; applyMotif(motifJson); }
  }, 800);

  /* ── 心跳 ── */
  function heartbeat() {
    const ts = Date.now();
    localStorage.setItem('tapmc_backdrop_alive', String(ts));
    /* 跨裝置心跳：同時寫到伺服器，讓 iPad admin 知道背板在線 */
    ServerStore.isAvailable().then(ok => {
      if (ok) ServerStore.saveData('tapmc_alive.json', { ts }).catch(() => {});
    }).catch(() => {});
  }
  heartbeat();
  setInterval(heartbeat, 10000);

  /* ════════════════════════════════════════════════
     跨電腦通訊：伺服器版本號輪詢
     每 1.5 秒向伺服器查詢 tapmc_version.json，
     版本號有變動時依 type 取回對應資料並套用。
     同台電腦：BroadcastChannel 仍為主通道（即時）。
     不同電腦：此輪詢為唯一通道（約 1.5 秒延遲）。
     ════════════════════════════════════════════════ */
  let _svrV       = 0;
  let _svrBusy    = false;
  let lastThemeJson  = localStorage.getItem('tapmc_theme') || 'dark';
  let lastMotifJson  = localStorage.getItem('tapmc_motif') || '0';

  async function _serverPoll() {
    if (_svrBusy) return;
    const ok = await ServerStore.isAvailable().catch(() => false);
    if (!ok) return;

    _svrBusy = true;
    try {
      const meta = await ServerStore.loadData('tapmc_version.json').catch(() => null);
      if (!meta || !meta.v || meta.v <= _svrV) return;
      _svrV = meta.v;

      const t = meta.type;   /* 變動類型（可為 undefined，表示全量更新） */

      if (!t || t === 'elements') {
        const d = await ServerStore.loadData('tapmc_elements.json').catch(() => null);
        if (Array.isArray(d)) {
          localStorage.setItem('tapmc_elements', JSON.stringify(d));
          renderAll();
        }
      }
      if (!t || t === 'text') {
        const d = await ServerStore.loadData('tapmc_text.json').catch(() => null);
        if (d) { localStorage.setItem('tapmc_text', JSON.stringify(d)); applyText(d); }
      }
      if (!t || t === 'ticker') {
        const d = await ServerStore.loadData('tapmc_ticker.json').catch(() => null);
        if (Array.isArray(d)) { localStorage.setItem('tapmc_ticker', JSON.stringify(d)); applyTicker(d); }
      }
      if (!t || t === 'badge') {
        const d = await ServerStore.loadData('tapmc_badge.json').catch(() => null);
        if (d) { localStorage.setItem('tapmc_badge', JSON.stringify(d)); applyBadge(d); }
      }
      if (!t || t === 'title_anim') {
        const d = await ServerStore.loadData('tapmc_title_anim.json').catch(() => null);
        if (d) { localStorage.setItem('tapmc_title_anim', d.v); applyTitleAnim(d.v); }
      }
      if (!t || t === 'seq') {
        const [steps, state] = await Promise.all([
          ServerStore.loadData('tapmc_seq.json').catch(() => null),
          ServerStore.loadData('tapmc_seq_state.json').catch(() => null),
        ]);
        if (steps) localStorage.setItem('tapmc_seq', JSON.stringify(steps));
        if (state) {
          localStorage.setItem('tapmc_seq_state', JSON.stringify(state));
          handleSeqState(state);
        }
      }
      if (!t || t === 'logo') {
        applyLogo();
      }
      if (!t || t === 'theme') {
        const d = await ServerStore.loadData('tapmc_theme.json').catch(() => null);
        if (d && d.theme) {
          localStorage.setItem('tapmc_theme', d.theme);
          applyTheme(d.theme);
        }
      }
      if (!t || t === 'motif') {
        const d = await ServerStore.loadData('tapmc_motif.json').catch(() => null);
        if (d && d.v !== undefined) {
          localStorage.setItem('tapmc_motif', d.v);
          applyMotif(d.v);
        }
      }
    } finally {
      _svrBusy = false;
    }
  }

  /* 伺服器可用時：先一次全量載入最新資料，再啟動增量輪詢
     ─ 修正：換裝置或換瀏覽器開啟時，localStorage 是空的，
       若不先拉伺服器資料，畫面會停在預設值直到有下一次版本變動 ─ */
  ServerStore.isAvailable().then(async ok => {
    if (!ok) return;

    try {
      /* 並行拉取全部設定，節省等待時間 */
      const [meta, sText, sTicker, sBadge, sTitleAnim, sTheme, sMotif, sElems] = await Promise.all([
        ServerStore.loadData('tapmc_version.json').catch(() => null),
        ServerStore.loadData('tapmc_text.json').catch(() => null),
        ServerStore.loadData('tapmc_ticker.json').catch(() => null),
        ServerStore.loadData('tapmc_badge.json').catch(() => null),
        ServerStore.loadData('tapmc_title_anim.json').catch(() => null),
        ServerStore.loadData('tapmc_theme.json').catch(() => null),
        ServerStore.loadData('tapmc_motif.json').catch(() => null),
        ServerStore.loadData('tapmc_elements.json').catch(() => null),
      ]);

      if (sText)   { localStorage.setItem('tapmc_text', JSON.stringify(sText)); applyText(sText); }
      if (Array.isArray(sTicker))  { localStorage.setItem('tapmc_ticker', JSON.stringify(sTicker)); applyTicker(sTicker); }
      if (sBadge)  { localStorage.setItem('tapmc_badge', JSON.stringify(sBadge)); applyBadge(sBadge); }
      if (sTitleAnim && sTitleAnim.v !== undefined) { localStorage.setItem('tapmc_title_anim', sTitleAnim.v); applyTitleAnim(sTitleAnim.v); }
      if (sTheme && sTheme.theme)  { localStorage.setItem('tapmc_theme', sTheme.theme); applyTheme(sTheme.theme); }
      if (sMotif && sMotif.v !== undefined) { localStorage.setItem('tapmc_motif', sMotif.v); applyMotif(sMotif.v); }
      if (Array.isArray(sElems))   { localStorage.setItem('tapmc_elements', JSON.stringify(sElems)); renderAll(); }

      /* 以現有版本為基準，之後只監聽增量變化（不重播歷史） */
      if (meta && meta.v) _svrV = meta.v;
    } catch (e) {
      console.warn('[backdrop] 初始全量載入失敗，改以 localStorage 顯示', e);
    }

    /* 區網直連用 3 秒輪詢 */
    setInterval(_serverPoll, 3000);
  }).catch(() => {});

  /* ── 初始化 ── */
  applyTheme(localStorage.getItem('tapmc_theme') || 'dark');   /* 最先套用主題 */
  const savedText   = JSON.parse(localStorage.getItem('tapmc_text')   || 'null');
  const savedTicker = JSON.parse(localStorage.getItem('tapmc_ticker') || 'null');
  if (savedText) applyText(savedText);
  else syncMiniTitle(DEFAULTS);
  applyTicker(savedTicker);
  applyTitleAnim(localStorage.getItem('tapmc_title_anim') || '0');
  applyMotif(localStorage.getItem('tapmc_motif') || '0');
  applyBadge(JSON.parse(localStorage.getItem('tapmc_badge') || 'null'));
  applyLogo();

  /* 嘗試還原 FileStore handle（同一 session 內可自動成功）
     無論成功或失敗都執行首次渲染，之後 admin 送來 handle 時會再次 renderAll */
  FileStore.restoreHandle()
    .catch(() => false)
    .finally(() => {
      renderAll();
      /* 通知 admin：背板已就緒，請傳送 FileStore handle */
      if (_bc) _bc.postMessage({ type: 'ready' });
    });

})();
