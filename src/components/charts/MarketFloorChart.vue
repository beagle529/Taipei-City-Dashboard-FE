<!-- 北農第一果菜市場 攤位燈號圖 -->
<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";

const props = defineProps(["chart_config", "activeChart", "series"]);

const ZONES = [
	{ name: "蔬菜區", short: "蔬菜", colors: { 甲: "#86efac", 乙: "#22c55e", 丙: "#16a34a" } },
	{ name: "水果區", short: "水果", colors: { 甲: "#fda4af", 乙: "#f472b6", 丙: "#db2777" } },
];
const GRADES = ["甲", "乙", "丙"];

// 百家姓（隨機承銷人姓氏）
const SURNAMES = [
	"趙","錢","孫","李","周","吳","鄭","王","馮","陳","楮","衛","蔣","沈","韓","楊",
	"朱","秦","尤","許","何","呂","施","張","孔","曹","嚴","華","金","魏","陶","姜",
	"戚","謝","鄒","喻","柏","水","竇","章","雲","蘇","潘","葛","奚","范","彭","郎",
	"魯","韋","昌","馬","苗","鳳","花","方","俞","任","袁","柳","酆","鮑","史","唐",
	"費","廉","岑","薛","雷","賀","倪","湯","滕","殷","羅","畢","郝","鄔","安","常",
	"樂","于","時","傅","皮","卞","齊","康","伍","余","元","卜","顧","孟","平","黃",
	"和","穆","蕭","尹","姚","邵","湛","汪","祁","毛","禹","狄","米","貝","明","臧",
];

function randomName() {
	const s = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
	return s + "OO";
}

// ── State ─────────────────────────────────────────────────────────
const activeKey    = ref(null);          // e.g. "水果|甲"
const isLoading    = ref(true);
const svgHtml      = ref("");
const mapEl        = ref(null);
const mapContainer = ref(null);
const overlayCanvas = ref(null);
const textCache    = new Map();          // "水果|甲" → [textEl, ...]
const stallItems   = [];                 // { el, num, zone, grade }
const stallRects   = [];                 // { num, zone, grade, left, top, right, bottom } — screen coords

// ── Hover tooltip ─────────────────────────────────────────────────
const hoverStall = ref(null);            // { num, zone, grade } | null
const hoverPos   = ref({ x: 0, y: 0 }); // mouse position relative to .mfc-map

// Zoom + Pan
const zoom     = ref(1);
const panX     = ref(0);
const panY     = ref(0);
const MIN_ZOOM = 0.5, MAX_ZOOM = 4, STEP = 0.25;
function zoomIn()    { zoom.value = +(Math.min(MAX_ZOOM, zoom.value + STEP).toFixed(2)); }
function zoomOut()   { zoom.value = +(Math.max(MIN_ZOOM, zoom.value - STEP).toFixed(2)); }
function zoomReset() { zoom.value = 1; panX.value = 0; panY.value = 0; }

// Redraw canvas + refresh stall rects whenever zoom or pan changes (after DOM update)
watch([zoom, panX, panY], () => nextTick(() => { drawOverlay(); refreshStallRects(); }));

// ── Pan (drag) ────────────────────────────────────────────────────
const isDragging = ref(false);
let _drag = null;

function onPointerDown(e) {
	if (e.button !== 0) return;
	isDragging.value = true;
	hoverStall.value = null;           // 拖曳時不顯示 tooltip
	_drag = { x: e.clientX, y: e.clientY, px: panX.value, py: panY.value };
	e.currentTarget.setPointerCapture(e.pointerId);
}
function onPointerMove(e) {
	if (isDragging.value && _drag) {
		panX.value = _drag.px + (e.clientX - _drag.x);
		panY.value = _drag.py + (e.clientY - _drag.y);
		return;
	}
	checkHover(e);
}
function onPointerUp() {
	isDragging.value = false;
	_drag = null;
}

// ── Load SVG ─────────────────────────────────────────────────────
const VB     = { x: 175, y: 530, w: 520, h: 355 };
const SVG_ID = "mfc-fp";

onMounted(async () => {
	try {
		const resp = await fetch("/dashboard-demo/mapData/market1F.svg");
		const raw  = await resp.text();

		// Dim everything — scoped to this SVG only
		const ghost = `<style>
#${SVG_ID} path,#${SVG_ID} rect,#${SVG_ID} line,#${SVG_ID} polyline,
#${SVG_ID} polygon,#${SVG_ID} circle,#${SVG_ID} ellipse{
  opacity:.08;fill:#999!important;stroke:#666!important;}
#${SVG_ID} text{opacity:.12;fill:#bbb!important;}
</style>`;

		svgHtml.value = raw
			.replace(/viewBox="[^"]*"/, `viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}"`)
			.replace(/<svg([^>]*)>/, (_, a) => {
				const id = a.includes("id=") ? a : a + ` id="${SVG_ID}"`;
				const vb = id.includes("viewBox") ? id : id + ` viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}"`;
				return `<svg${vb}>${ghost}`;
			})
			.replace(/width="[^"]*"/,  'width="100%"')
			.replace(/height="[^"]*"/, 'height="100%"');

		isLoading.value = false;
		await nextTick();
		buildCache();
		refreshStallRects();
	} catch (e) {
		console.error("[MarketFloorChart]", e);
		isLoading.value = false;
	}

	// Resize observer — redraw canvas when card resizes
	if (overlayCanvas.value) {
		ro = new ResizeObserver(() => nextTick(drawOverlay));
		ro.observe(overlayCanvas.value.parentElement);
	}
});

let ro = null;
onUnmounted(() => ro?.disconnect());

// ── Build text element cache ──────────────────────────────────────
function buildCache() {
	const svgEl = mapContainer.value?.querySelector("svg");
	if (!svgEl) return;
	textCache.clear();
	stallItems.length = 0;

	const zoneEls = [];   // { el, short, grade, cx, cy }
	const numEls  = [];   // { el, num,   cx, cy }

	svgEl.querySelectorAll("text").forEach(el => {
		const t = (el.textContent || "").replace(/\s+/g, "");
		let short = null, grade = null;
		if      (t.includes("蔬菜")) short = "蔬菜";
		else if (t.includes("水果")) short = "水果";

		if (short) {
			if      (t.includes("甲")) grade = "甲";
			else if (t.includes("乙")) grade = "乙";
			else if (t.includes("丙")) grade = "丙";
		}

		if (short && grade) {
			// textCache 供 canvas 亮燈使用
			const key = `${short}|${grade}`;
			if (!textCache.has(key)) textCache.set(key, []);
			textCache.get(key).push(el);

			const r  = el.getBoundingClientRect();
			const cx = r.left + r.width  / 2;
			const cy = r.top  + r.height / 2;
			zoneEls.push({ el, short, grade, cx, cy });

			// 若同一 text 元素也包含編號（tspan 組合文字），直接存入
			const m = t.match(/\d{3,4}/);
			if (m) stallItems.push({ el, num: m[0], zone: short, grade, vendor: randomName() });
			return;
		}

		// 純數字攤位編號（獨立的 <text> 元素）
		if (/^\d{3,4}$/.test(t)) {
			const r  = el.getBoundingClientRect();
			numEls.push({ el, num: t, cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
		}
	});

	// 將獨立數字 text 配對到最近的 zone+grade text
	if (zoneEls.length && numEls.length) {
		numEls.forEach(({ el, num, cx, cy }) => {
			let best = null, bestDist = Infinity;
			zoneEls.forEach(z => {
				const d = Math.hypot(cx - z.cx, cy - z.cy);
				if (d < bestDist) { bestDist = d; best = z; }
			});
			// 只接受畫面距離 120px 以內的配對（過濾掉完全無關的標籤）
			if (best && bestDist < 120) {
				stallItems.push({ el, num, zone: best.short, grade: best.grade, vendor: randomName() });
			}
		});
	}

	console.debug(
		"[MarketFloorChart] zoneEls:", zoneEls.length,
		"numEls:", numEls.length,
		"stallItems:", stallItems.length
	);
}

// ── Canvas overlay — draws crisp colored boxes at stall positions ─
function drawOverlay() {
	const canvas = overlayCanvas.value;
	if (!canvas) return;

	const mapEl = canvas.parentElement;
	canvas.width  = mapEl.clientWidth;
	canvas.height = mapEl.clientHeight;

	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!activeKey.value) return;

	const els = textCache.get(activeKey.value);
	if (!els?.length) return;

	const [short, grade] = activeKey.value.split("|");
	const zone = ZONES.find(z => z.short === short);
	const col  = zone?.colors[grade] ?? "#fff";

	const mapRect = mapEl.getBoundingClientRect();

	// 預算每格的 rect（往下 +h 涵蓋攤位編號）
	const boxes = els.map(el => {
		const r = el.getBoundingClientRect();
		return {
			x: r.left - mapRect.left,
			y: r.top  - mapRect.top,
			w: Math.max(r.width,  4),
			h: Math.max(r.height, 4),
		};
	}).filter(b =>                              // 過濾在畫布範圍外的
		b.x < canvas.width  && b.x + b.w > 0 &&
		b.y < canvas.height && b.y + b.h > 0
	);

	// Pass 1: glow halo
	ctx.shadowColor = col;
	ctx.shadowBlur  = 12;
	ctx.fillStyle   = col + "44";
	boxes.forEach(({ x, y, w, h }) =>
		ctx.fillRect(x - 2, y - 2, w + 4, h * 2.2 + 4));   // h*2.2 覆蓋編號行

	// Pass 2: solid bright fill
	ctx.shadowBlur = 0;
	ctx.fillStyle  = col + "dd";
	boxes.forEach(({ x, y, w, h }) =>
		ctx.fillRect(x, y, w, h * 2.2));
}

// ── Stall screen-rect cache (rebuilt on zoom/pan/resize) ──────────
function refreshStallRects() {
	stallRects.length = 0;
	const mapEl = overlayCanvas.value?.parentElement;
	if (!mapEl || !stallItems.length) return;
	const mapRect = mapEl.getBoundingClientRect();
	stallItems.forEach(({ el, num, zone, grade, vendor }) => {
		const r = el.getBoundingClientRect();
		stallRects.push({
			num, zone, grade, vendor,
			left:   r.left   - mapRect.left,
			top:    r.top    - mapRect.top,
			right:  r.right  - mapRect.left,
			// 往下延伸 1.2× 高度，涵蓋攤位編號行（與 canvas 行為一致）
			bottom: r.bottom - mapRect.top + r.height * 1.2,
		});
	});
}

// ── Hover hit-test ────────────────────────────────────────────────
function checkHover(e) {
	const mapEl = overlayCanvas.value?.parentElement;
	if (!mapEl) return;
	const mapRect = mapEl.getBoundingClientRect();
	const mx = e.clientX - mapRect.left;
	const my = e.clientY - mapRect.top;
	const found = stallRects.find(s =>
		mx >= s.left && mx <= s.right && my >= s.top && my <= s.bottom
	);
	hoverStall.value = found ?? null;
	if (found) hoverPos.value = { x: mx, y: my };
}

// ── Tooltip position（自動翻轉避免超出邊界）────────────────────────
function tooltipStyle(mapEl) {
	if (!hoverStall.value || !mapEl) return {};
	const { x, y } = hoverPos.value;
	const W = mapEl.clientWidth;
	const H = mapEl.clientHeight;
	const TW = 160, TH = 130;
	return {
		left: (x + 14 + TW > W ? x - TW - 8 : x + 14) + "px",
		top:  (y + 14 + TH > H ? y - TH - 8 : y + 14) + "px",
	};
}

// ── Zone color helper ─────────────────────────────────────────────
function zoneColor(zone, grade) {
	return ZONES.find(z => z.short === zone)?.colors[grade] ?? "#fff";
}

// ── Toggle stall lights ───────────────────────────────────────────
function selectKey(zone, grade) {
	const key = `${zone.short}|${grade}`;
	activeKey.value = activeKey.value === key ? null : key;
	nextTick(drawOverlay);
}
</script>

<template>
	<div v-if="activeChart === 'MarketFloorChart'" class="mfc">

		<!-- Zone + Grade selector -->
		<div class="mfc-selectors">
			<div v-for="zone in ZONES" :key="zone.short" class="mfc-zone-group">
				<span class="mfc-zone-label" :style="{ color: zone.colors['乙'] }">
					{{ zone.name }}
				</span>
				<button
					v-for="grade in GRADES" :key="grade"
					class="mfc-grade-btn"
					:class="{ active: activeKey === `${zone.short}|${grade}` }"
					:style="activeKey === `${zone.short}|${grade}`
						? { background: zone.colors[grade] + '33', borderColor: zone.colors[grade], color: zone.colors[grade] }
						: {}"
					@click="selectKey(zone, grade)"
				>{{ grade }}</button>
			</div>
		</div>

		<!-- Map — drag to pan -->
		<div class="mfc-map"
			ref="mapEl"
			draggable="false"
			:style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
			@pointerdown="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointercancel="onPointerUp"
			@mouseleave="hoverStall = null"
		>
			<div v-if="isLoading" class="mfc-loading">載入平面圖…</div>
			<div
				v-else
				ref="mapContainer"
				class="mfc-svg-wrap"
				:style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
				          transformOrigin: 'center center' }"
				v-html="svgHtml"
			/>

			<!-- Canvas overlay — crisp color boxes -->
			<canvas ref="overlayCanvas" class="mfc-overlay" />

			<!-- Zoom controls (stop propagation so drag doesn't trigger) -->
			<div class="mfc-zoom-ctrl" @pointerdown.stop>
				<button @click="zoomIn"    :disabled="zoom >= MAX_ZOOM">＋</button>
				<span   @click="zoomReset" class="mfc-zoom-pct">{{ Math.round(zoom * 100) }}%</span>
				<button @click="zoomOut"   :disabled="zoom <= MIN_ZOOM">－</button>
			</div>

			<!-- Active badge -->
			<div v-if="activeKey" class="mfc-active-badge">
				{{ activeKey.replace("|", " ") }} 亮燈中
			</div>

			<!-- Hover tooltip -->
			<Transition name="tt-fade">
				<div v-if="hoverStall" class="mfc-tooltip" :style="tooltipStyle(mapEl)">
					<div class="tt-header">
						<span class="tt-zone" :style="{ color: zoneColor(hoverStall.zone, hoverStall.grade) }">
							{{ hoverStall.zone }}區 {{ hoverStall.grade }}
						</span>
						<span class="tt-num">#{{ hoverStall.num }}</span>
					</div>
					<div class="tt-divider"></div>
					<!-- 預留未來資料欄位 -->
					<div class="tt-row">
						<span class="tt-label">承銷人</span>
						<span class="tt-value">{{ hoverStall.vendor }}</span>
					</div>
					<div class="tt-row">
						<span class="tt-label">今日交易金額</span>
						<span class="tt-value tt-empty">—</span>
					</div>
					<div class="tt-row">
						<span class="tt-label">本月交易金額</span>
						<span class="tt-value tt-empty">—</span>
					</div>
				</div>
			</Transition>
		</div>
	</div>
</template>

<style scoped>
.mfc {
	display: flex;
	flex-direction: column;
	height: 100%;
	gap: 6px;
	user-select: none;
	-webkit-user-drag: none;
	overflow: hidden;
}

/* ── Selectors ── */
.mfc-selectors {
	display: flex;
	gap: 10px;
	flex-shrink: 0;
	flex-wrap: wrap;
}
.mfc-zone-group {
	display: flex;
	align-items: center;
	gap: 4px;
	background: #0e1012;
	border: 1px solid #252729;
	border-radius: 6px;
	padding: 4px 8px;
}
.mfc-zone-label {
	font-size: 11px;
	font-weight: 600;
	white-space: nowrap;
	margin-right: 2px;
}
.mfc-grade-btn {
	width: 28px;
	height: 24px;
	border: 1px solid #333;
	background: transparent;
	color: #666;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: 700;
	transition: all .15s;
}
.mfc-grade-btn:hover:not(.active) { border-color: #555; color: #aaa; }
.mfc-grade-btn.active { font-weight: 800; }

/* ── Map ── */
.mfc-map {
	position: relative;
	flex: 1;
	min-height: 0;
	overflow: hidden;
	border-radius: 6px;
	background: #060809;
}
.mfc-loading {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #444;
	font-size: 13px;
}
.mfc-svg-wrap {
	width: 100%;
	height: 100%;
	will-change: transform;
	pointer-events: none;   /* 地圖本身不攔截事件，交給 .mfc-map 處理 */
}
.mfc-svg-wrap :deep(svg) { width: 100%; height: 100%; display: block; }

/* Canvas sits above SVG, below UI controls */
.mfc-overlay {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 5;
}

/* ── Zoom ── */
.mfc-zoom-ctrl {
	position: absolute;
	right: 8px;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	z-index: 20;
	background: rgba(8,10,12,.88);
	border: 1px solid #333;
	border-radius: 7px;
	padding: 4px;
}
.mfc-zoom-ctrl button {
	width: 26px;
	height: 26px;
	background: none;
	border: 1px solid #3a3c3e;
	border-radius: 5px;
	color: #bbb;
	font-size: 17px;
	line-height: 1;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	transition: background .12s, color .12s;
}
.mfc-zoom-ctrl button:hover:not(:disabled) { background: #2a2c2e; color: #fff; }
.mfc-zoom-ctrl button:disabled { opacity: 0.25; cursor: default; }
.mfc-zoom-pct {
	font-size: 9px;
	color: #555;
	cursor: pointer;
	padding: 2px 0;
	user-select: none;
	transition: color .12s;
}
.mfc-zoom-pct:hover { color: #aaa; }

/* ── Hover tooltip ── */
.mfc-tooltip {
	position: absolute;
	z-index: 30;
	background: rgba(10, 13, 16, 0.95);
	border: 1px solid #2e3133;
	border-radius: 7px;
	padding: 8px 11px;
	pointer-events: none;
	min-width: 148px;
	box-shadow: 0 4px 18px rgba(0,0,0,.55);
}
.tt-header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 6px;
	margin-bottom: 5px;
}
.tt-zone {
	font-size: 12px;
	font-weight: 700;
}
.tt-num {
	font-size: 13px;
	font-weight: 700;
	color: #e0e0e0;
	letter-spacing: 0.5px;
}
.tt-divider {
	height: 1px;
	background: #252729;
	margin-bottom: 6px;
}
.tt-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 11px;
	line-height: 1.8;
	gap: 8px;
}
.tt-label {
	color: #666;
}
.tt-value {
	color: #ccc;
	font-weight: 500;
}
.tt-empty {
	color: #3a3c3e;
}

/* Fade transition */
.tt-fade-enter-active,
.tt-fade-leave-active { transition: opacity .1s, transform .1s; }
.tt-fade-enter-from,
.tt-fade-leave-to   { opacity: 0; transform: scale(.95); }

/* ── Active badge ── */
.mfc-active-badge {
	position: absolute;
	bottom: 8px;
	left: 8px;
	background: rgba(8,10,12,.85);
	border: 1px solid #333;
	border-radius: 5px;
	padding: 3px 10px;
	font-size: 11px;
	color: #aaa;
	pointer-events: none;
	z-index: 10;
}
</style>
