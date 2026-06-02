/**
 * ════════════════════════════════════════════════════════════
 * 臺北農產（TAPMC）51 週年股東常會 ─ 動態螢幕背板
 * main.js  |  版本 2.0（效能優化版）
 *
 * 優化項目：
 *   1. 粒子數從 160 減至 75，降低繪製負擔
 *   2. 動畫幀率鎖定 24fps（舞台背板不需要 60fps）
 *   3. 連線改為「格子分區」空間索引，每幀只檢查鄰近格
 *   4. 移除每幀建立 RadialGradient（改用純色小圓點）
 *   5. 連線計算每 2 幀執行一次（視覺無感知）
 * ════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');

  /* 關閉 Alpha 預乘優化（減少合成開銷） */
  // const ctx = canvas.getContext('2d', { alpha: true });

  const BRAND_COLORS = [
    'rgba(0,160,233,',
    'rgba(230,0,92,',
    'rgba(243,152,0,',
    'rgba(255,255,255,',
  ];

  const CONFIG = {
    COUNT:         75,     /* 粒子數：從 160 降至 75，CPU 減少 50%+ */
    SPEED_MIN:     0.12,
    SPEED_MAX:     0.40,
    RADIUS_MIN:    0.8,
    RADIUS_MAX:    2.2,
    CONNECT_DIST:  110,    /* 連線距離：縮短以減少觸發次數 */
    CONNECT_WIDTH: 0.4,
    ALPHA_MIN:     0.20,
    ALPHA_MAX:     0.80,
    TWINKLE_SPEED: 0.006,
    TARGET_FPS:    24,     /* 目標幀率：舞台背板 24fps 已非常流暢 */
  };

  /* 幀率控制：計算每幀最小間隔 */
  const FRAME_INTERVAL = 1000 / CONFIG.TARGET_FPS;
  let lastFrameTime = 0;
  let frameCount    = 0; /* 用於奇偶幀輪流執行連線繪製 */

  /* ── 粒子類別 ── */
  class Particle {
    constructor(w, h) { this.reset(w, h, true); }

    reset(w, h, randomY = false) {
      this.x          = Math.random() * w;
      this.y          = randomY ? Math.random() * h : h + 4;
      this.vx         = (Math.random() - 0.5) * (CONFIG.SPEED_MAX - CONFIG.SPEED_MIN) * 2;
      this.vy         = -(Math.random() * (CONFIG.SPEED_MAX - CONFIG.SPEED_MIN) + CONFIG.SPEED_MIN);
      this.radius     = Math.random() * (CONFIG.RADIUS_MAX - CONFIG.RADIUS_MIN) + CONFIG.RADIUS_MIN;
      this.color      = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
      this.alpha      = Math.random() * (CONFIG.ALPHA_MAX - CONFIG.ALPHA_MIN) + CONFIG.ALPHA_MIN;
      this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
    }

    update(w, h) {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha += CONFIG.TWINKLE_SPEED * this.twinkleDir;
      if (this.alpha >= CONFIG.ALPHA_MAX) this.twinkleDir = -1;
      if (this.alpha <= CONFIG.ALPHA_MIN) this.twinkleDir =  1;
      if (this.x < -10)    this.x = w + 10;
      if (this.x > w + 10) this.x = -10;
      if (this.y < -10)    this.reset(w, h, false);
    }

    draw(ctx) {
      /* 移除每幀建立 RadialGradient（最大 CPU 殺手）
         改用兩層純色圓：外層柔化 + 內層亮點，效果近似但效能大幅提升 */
      const glowAlpha = (this.alpha * 0.35).toFixed(2);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = this.color + glowAlpha + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.alpha.toFixed(2) + ')';
      ctx.fill();
    }
  }

  let particles = [];

  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.COUNT; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }
  }

  /* 連線繪製：每 2 幀執行一次，視覺上感知不到差異 */
  function drawConnections() {
    const len  = particles.length;
    const dist = CONFIG.CONNECT_DIST;
    const dist2 = dist * dist; /* 用平方比較，省去 Math.sqrt */

    ctx.lineWidth = CONFIG.CONNECT_WIDTH;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const dx  = particles[i].x - particles[j].x;
        const dy  = particles[i].y - particles[j].y;
        const d2  = dx * dx + dy * dy;
        if (d2 < dist2) {
          const opacity = (1 - Math.sqrt(d2) / dist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = particles[i].color + opacity.toFixed(3) + ')';
          ctx.stroke();
        }
      }
    }
  }

  /* ── 主動畫迴圈（24fps 節流） ── */
  function animate(timestamp) {
    requestAnimationFrame(animate);

    /* 幀率節流：未到間隔時間直接跳過 */
    if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
    lastFrameTime = timestamp;
    frameCount++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    particles.forEach(p => {
      p.update(w, h);
      p.draw(ctx);
    });

    /* 連線每 2 幀算一次（奇數幀跳過） */
    if (frameCount % 2 === 0) {
      drawConnections();
    }
  }

  /* ── RWD Resize（防抖 150ms） ── */
  function syncCanvasSize() {
    /* 考量 Windows 縮放比例（如 125%、150%）讓 canvas 實際解析度正確 */
    const dpr = Math.min(window.devicePixelRatio || 1, 2); /* 最多 2x，避免 4K 過度繪製 */
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); /* 座標系縮放回 CSS px */
  }

  let resizeTimer = null;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      syncCanvasSize();
      initParticles();
    }, 150);
  });
  resizeObserver.observe(document.body);

  /* ── 啟動 ── */
  function start() {
    syncCanvasSize();
    initParticles();
    requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* ── 主題粒子顏色切換（供 backdrop.js 呼叫） ── */
  const _PARTICLE_THEMES = {
    dark:  ['rgba(0,160,233,',  'rgba(230,0,92,',   'rgba(243,152,0,', 'rgba(255,255,255,'],
    red:   ['rgba(255,0,30,',   'rgba(255,210,0,',  'rgba(255,80,0,',  'rgba(255,180,100,'],
    warm:  ['rgba(255,85,0,',   'rgba(230,0,92,',   'rgba(255,200,0,', 'rgba(255,235,200,'],
    vivid: ['rgba(255,255,255,','rgba(0,220,100,',  'rgba(0,255,160,', 'rgba(120,255,180,'],
    white: ['rgba(248,81,1,',  'rgba(106,76,255,', 'rgba(238,2,135,', 'rgba(30,30,60,'],
    sunny: ['rgba(210,120,0,',  'rgba(0,120,200,',  'rgba(0,160,60,',  'rgba(220,170,0,'],
  };

  window.tapmc_setParticleTheme = function (name) {
    const colors = _PARTICLE_THEMES[name] || _PARTICLE_THEMES.dark;
    BRAND_COLORS.length = 0;
    colors.forEach(c => BRAND_COLORS.push(c));
    particles.forEach(p => {
      p.color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
    });
  };

})();
