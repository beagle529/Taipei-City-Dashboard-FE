<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref, computed } from "vue";

const props = defineProps(["chart_config", "activeChart", "series"]);

// ── 資料轉換 ──
// series 格式：[{ name: "欄位名", data: [{ x: "列識別", y: 值 }, ...] }, ...]
// 轉換為 table rows：{ key, [colName]: value, ... }

const columns = computed(() => props.series.map((s) => s.name));

const rows = computed(() => {
	if (!props.series.length) return [];
	// 以第一個 series 的 data 順序作為列順序
	return props.series[0].data.map((point, rowIdx) => {
		const row = { _key: point.x };
		for (const s of props.series) {
			row[s.name] = s.data[rowIdx]?.y ?? "";
		}
		return row;
	});
});

// ── 排序 ──
const sortCol = ref(null);
const sortDir = ref(1); // 1=asc, -1=desc

function toggleSort(col) {
	if (sortCol.value === col) {
		sortDir.value *= -1;
	} else {
		sortCol.value = col;
		sortDir.value = 1;
	}
}

const sortedRows = computed(() => {
	if (!sortCol.value) return rows.value;
	return [...rows.value].sort((a, b) => {
		const va = a[sortCol.value];
		const vb = b[sortCol.value];
		if (typeof va === "number" && typeof vb === "number") {
			return (va - vb) * sortDir.value;
		}
		return String(va).localeCompare(String(vb), "zh-TW") * sortDir.value;
	});
});

// 第一欄（列識別）標題：取第一個 series 的 data.x 標題
// 若 chart_config.categories 有提供則用之
const rowKeyLabel = computed(
	() => props.chart_config?.categories?.[0] ?? "項目"
);
</script>

<template>
	<div v-if="activeChart === 'DataTable'" class="dt-wrap">
		<div v-if="!rows.length" class="dt-empty">尚無資料</div>
		<template v-else>
			<div class="dt-meta">共 {{ rows.length }} 筆</div>
			<div class="dt-scroll">
				<table class="dt-table">
					<thead>
						<tr>
							<th
								class="dt-th dt-th-key"
								@click="toggleSort('_key')"
							>
								{{ rowKeyLabel }}
								<span class="sort-icon">{{
									sortCol === "_key"
										? sortDir === 1
											? "↑"
											: "↓"
										: "↕"
								}}</span>
							</th>
							<th
								v-for="col in columns"
								:key="col"
								class="dt-th"
								@click="toggleSort(col)"
							>
								{{ col }}
								<span class="sort-icon">{{
									sortCol === col
										? sortDir === 1
											? "↑"
											: "↓"
										: "↕"
								}}</span>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, i) in sortedRows" :key="i" class="dt-row">
							<td class="dt-td dt-td-key">{{ row._key }}</td>
							<td v-for="col in columns" :key="col" class="dt-td">
								{{ row[col] }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</template>
	</div>
</template>

<style scoped>
.dt-wrap {
	display: flex;
	flex-direction: column;
	height: 100%;
	gap: 0.35rem;
}

.dt-empty {
	color: #555;
	font-size: 0.82rem;
	padding: 1rem 0;
}

.dt-meta {
	font-size: 0.65rem;
	color: #555;
	flex-shrink: 0;
}

.dt-scroll {
	flex: 1;
	min-height: 0;
	overflow: auto;
	border: 1px solid #2a2c2e;
	border-radius: 6px;
}

.dt-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.75rem;
}

thead tr {
	position: sticky;
	top: 0;
	z-index: 1;
}

.dt-th {
	background: #282a2c;
	color: #666;
	font-weight: 500;
	padding: 0.45rem 0.65rem;
	text-align: left;
	white-space: nowrap;
	cursor: pointer;
	user-select: none;
	border-bottom: 1px solid #333;
	transition: color 0.12s;

	&:hover { color: #aaa; }
}

.dt-th-key {
	color: #5b8cfa;
	&:hover { color: #7ab3ff; }
}

.sort-icon {
	margin-left: 0.3rem;
	font-size: 0.6rem;
	opacity: 0.6;
}

.dt-td {
	padding: 0.38rem 0.65rem;
	border-bottom: 1px solid #1f2123;
	color: #aaa;
	white-space: nowrap;
}

.dt-td-key {
	color: #7ab3ff;
	font-weight: 500;
}

.dt-row:hover .dt-td {
	background: #222426;
}
</style>
