<!-- 實名制統計資料表 — 客製組件 -->
<script setup>
import { computed } from "vue";

const props = defineProps(["series", "chart_config", "activeChart"]);

/* ── 工具函式 ── */
function pct(val, total) {
	if (!total) return "0.00%";
	return (val / total * 100).toFixed(2) + "%";
}
function fmt(n) {
	if (n === null || n === undefined || n === "") return "";
	return Number(n).toLocaleString();
}

/* ── 解析 series → 結構化資料 ── */
const sections = computed(() => {
	if (!props.series?.length) return [];

	// 建立 lookup: { "蔬菜_非實名制": { 筆數: 0, 件數: 0, 重量_公斤: 0 } }
	const lookup = {};
	for (const s of props.series) {
		for (const pt of s.data) {
			if (!lookup[pt.x]) lookup[pt.x] = {};
			lookup[pt.x][s.name] = Number(pt.y) || 0;
		}
	}

	// 取三個欄位名稱（依上傳順序）
	const numCol    = props.series[0]?.name || "筆數";
	const itemCol   = props.series[1]?.name || "件數";
	const weightCol = props.series[2]?.name || "重量_公斤";

	// 取唯一 section 前綴（蔬菜、水果…），排除日期列
	const secSet = [...new Set(
		Object.keys(lookup)
			.filter(k => k !== "日期_交易")
			.map(k => k.split("_")[0])
	)];

	return secSet.map(sec => {
		const nonReal  = lookup[`${sec}_非實名制`]  || {};
		const real     = lookup[`${sec}_實名制`]    || {};
		const supRow   = lookup[`${sec}_供應人數`]  || {};

		const totalNum    = (nonReal[numCol]    || 0) + (real[numCol]    || 0);
		const totalItem   = (nonReal[itemCol]   || 0) + (real[itemCol]   || 0);
		const totalWeight = (nonReal[weightCol] || 0) + (real[weightCol] || 0);
		const supplyCount = supRow[numCol] || 0;
		const ratio = supplyCount > 0
			? (totalItem / supplyCount).toFixed(2)
			: "-";

		return {
			label: sec,
			rows: [
				{
					label: "非實名制",
					num: nonReal[numCol] || 0,
					numPct: pct(nonReal[numCol] || 0, totalNum),
					item: nonReal[itemCol] || 0,
					itemPct: pct(nonReal[itemCol] || 0, totalItem),
					weight: nonReal[weightCol] || 0,
					weightPct: pct(nonReal[weightCol] || 0, totalWeight),
				},
				{
					label: "實名制",
					num: real[numCol] || 0,
					numPct: pct(real[numCol] || 0, totalNum),
					item: real[itemCol] || 0,
					itemPct: pct(real[itemCol] || 0, totalItem),
					weight: real[weightCol] || 0,
					weightPct: pct(real[weightCol] || 0, totalWeight),
				},
			],
			total: { num: totalNum, item: totalItem, weight: totalWeight },
			supply: { count: supplyCount, ratio },
		};
	});
});

/* ── 民國日期：優先從資料中的 日期_交易 列讀取，否則用今天 ── */
const rocDate = computed(() => {
	// 嘗試從第一個 series 找 x = "日期_交易" 的 y 值
	const dateSeries = props.series?.[0]?.data?.find(pt => pt.x === "日期_交易");
	const raw = dateSeries ? String(dateSeries.y) : "";

	// raw 可能是 "2026/05/10"、"2026-05-10" 或空字串
	const d = raw ? new Date(raw.replace(/\//g, "-")) : new Date();
	if (isNaN(d)) return raw; // 無法解析就原樣顯示

	const y  = d.getFullYear() - 1911;
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${y}/${mm}/${dd}`;
});

/* 市場名稱來自 chart_config.unit，例如「一市場」*/
const marketLabel = computed(() => props.chart_config?.unit || "");
</script>

<template>
	<div
		v-show="activeChart === 'RealNameTable'"
		class="rnt"
	>
		<!-- 標題列 -->
		<div class="rnt-header">
			<span class="rnt-date">{{ rocDate }}</span>
			<span class="rnt-title">{{ marketLabel }}實名制統計資料</span>
		</div>

		<div v-if="sections.length">
			<div
				v-for="sec in sections"
				:key="sec.label"
				class="rnt-section"
			>
				<table class="rnt-table">
					<!-- 表頭 -->
					<thead>
						<tr :class="['rnt-thead', sec.label === '蔬菜' ? 'rnt-veg' : 'rnt-fruit']">
							<th class="rnt-th-label">{{ sec.label }}</th>
							<th>筆數</th>
							<th>百分比</th>
							<th>件數</th>
							<th>百分比</th>
							<th>重量</th>
							<th>百分比</th>
						</tr>
					</thead>
					<tbody>
						<!-- 非實名制 / 實名制 -->
						<tr v-for="row in sec.rows" :key="row.label" class="rnt-row">
							<td class="rnt-td-label">{{ row.label }}</td>
							<td>{{ fmt(row.num) }}</td>
							<td>{{ row.numPct }}</td>
							<td>{{ fmt(row.item) }}</td>
							<td>{{ row.itemPct }}</td>
							<td>{{ fmt(row.weight) }}</td>
							<td>{{ row.weightPct }}</td>
						</tr>
						<!-- 總筆數 -->
						<tr class="rnt-total">
							<td class="rnt-td-label">總筆數</td>
							<td>{{ fmt(sec.total.num) }}</td>
							<td></td>
							<td>{{ fmt(sec.total.item) }}</td>
							<td></td>
							<td>{{ fmt(sec.total.weight) }}</td>
							<td></td>
						</tr>
						<!-- 供應人數量 -->
						<tr class="rnt-supply">
							<td class="rnt-sup-lbl">供應人<br>數量</td>
							<td class="rnt-sup-val">{{ fmt(sec.supply.count) }}</td>
							<td colspan="2"></td>
							<td class="rnt-sup-lbl">件數／<br>供應人數</td>
							<td class="rnt-sup-val">{{ sec.supply.ratio }}</td>
							<td></td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div v-else class="rnt-empty">尚無資料，請上傳 CSV</div>
	</div>
</template>

<style scoped>
.rnt {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	padding: 0.3rem 0.5rem 0.4rem;
	box-sizing: border-box;
	font-size: 0.68rem;
	color: #ddd;
	/* 讓捲軸在組件容器內正常作用 */
	min-height: 0;
}

/* 標題列 */
.rnt-header {
	display: flex;
	align-items: baseline;
	justify-content: center;
	gap: 0.6rem;
	padding-bottom: 0.2rem;
	border-bottom: 1px solid #3a3c3e;
	flex-shrink: 0;
}
.rnt-date  { color: #888; font-family: monospace; font-size: 0.65rem; }
.rnt-title { color: #fff; font-size: 0.78rem; font-weight: 600; }

/* 各 section 間距 */
.rnt-section { margin-bottom: 0.25rem; flex-shrink: 0; }

/* 表格 */
.rnt-table {
	width: 100%;
	border-collapse: collapse;
	table-layout: fixed;
}
.rnt-table th,
.rnt-table td {
	border: 1px solid #3a3c3e;
	padding: 0.15rem 0.3rem;
	text-align: center;
	font-size: 0.65rem;
	white-space: nowrap;
}

/* 欄位寬度 */
.rnt-th-label, .rnt-td-label { width: 17%; text-align: left; }

/* 表頭 — 蔬菜 亮綠 / 水果 洋紅（與原始報表一致） */
.rnt-thead { font-weight: 700; }
.rnt-veg   { background: #00b050; }
.rnt-fruit { background: #ff00ff; }
.rnt-veg th,
.rnt-fruit th { color: #000; }

/* 資料列 — 白底黑字（與原始報表一致） */
.rnt-row td { background: #fff; color: #000; }
.rnt-td-label { color: #000; }

/* 總筆數列 — 白底黑字 */
.rnt-total td { background: #fff; color: #000; font-weight: 500; }
.rnt-total .rnt-td-label { color: #000; }

/* 供應人數量列 — 亮黃（與原始報表一致） */
.rnt-supply td { background: #ffff00; border-color: #cccc00; }
.rnt-sup-lbl {
	color: #333;
	font-size: 0.6rem;
	line-height: 1.35;
	text-align: center !important;
	vertical-align: middle;
}
.rnt-sup-val {
	font-size: 0.85rem;
	font-weight: 700;
	color: #000;
	vertical-align: middle;
}

.rnt-empty {
	color: #555;
	font-size: 0.8rem;
	text-align: center;
	padding: 2rem 0;
}
</style>
