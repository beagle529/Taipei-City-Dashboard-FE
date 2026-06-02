<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref, computed } from "vue";
import { fmtAxisVal } from "../../assets/configs/apexcharts/chartUtils.js";

const props = defineProps(["chart_config", "activeChart", "series"]);

const DEFAULT_COLORS = [
	"#5b8cfa", "#4ade80", "#f59e0b", "#f87171",
	"#a78bfa", "#34d399", "#fb923c", "#60a5fa",
];
const resolvedColors = props.chart_config.color?.length
	? props.chart_config.color
	: DEFAULT_COLORS;

// ── 分組偵測 ──
// 若 series 名稱含 "_"，將第一段作為群組（例如「蔬菜_特級」→ 群組「蔬菜」）
const groups = computed(() => {
	const hasGroups = props.series.some((s) => s.name.includes("_"));
	if (!hasGroups) return [];
	return [...new Set(props.series.map((s) => s.name.split("_")[0]))];
});

const activeGroup = ref(groups.value[0] ?? null);

// 依選取群組過濾，並將前綴從顯示名稱中移除
const filteredSeries = computed(() => {
	if (!groups.value.length || !activeGroup.value) return props.series;
	return props.series
		.filter((s) => s.name.startsWith(activeGroup.value + "_"))
		.map((s) => ({
			...s,
			name: s.name.slice(activeGroup.value.length + 1),
		}));
});

const chartOptions = ref({
	chart: {
		stacked: true,
		toolbar: { show: false },
	},
	colors: resolvedColors,
	dataLabels: { enabled: false },
	grid: { show: false },
	legend: {
		show: true,
		position: "top",
		fontSize: "11px",
		labels: { colors: "#888" },
	},
	plotOptions: {
		bar: {
			columnWidth: "65%",
			borderRadius: 2,
		},
	},
	stroke: {
		colors: ["#1f2226"],
		show: true,
		width: 1,
	},
	tooltip: {
		custom: function ({ series, seriesIndex, dataPointIndex, w }) {
			return (
				'<div class="chart-tooltip">' +
				"<h6>" +
				w.globals.labels[dataPointIndex] +
				" — " +
				w.globals.seriesNames[seriesIndex] +
				"</h6>" +
				"<span>" +
				series[seriesIndex][dataPointIndex] +
				` ${props.chart_config.unit ?? ""}` +
				"</span>" +
				"</div>"
			);
		},
	},
	xaxis: {
		axisBorder: { show: false },
		axisTicks: { show: false },
		type: "category",
		labels: {
			rotate: -40,
			style: { fontSize: "10px", colors: "#777" },
		},
	},
	yaxis: {
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			formatter: (val) => fmtAxisVal(val, props.chart_config.unit ?? ""),
		},
	},
});
</script>

<template>
	<div v-if="activeChart === 'StackedColumnChart'">
		<!-- 群組切換標籤 -->
		<div v-if="groups.length > 1" class="group-tabs">
			<button
				v-for="g in groups"
				:key="g"
				:class="['group-tab', activeGroup === g ? 'active' : '']"
				@click="activeGroup = g"
			>
				{{ g }}
			</button>
		</div>
		<apexchart
			width="100%"
			height="255px"
			type="bar"
			:options="chartOptions"
			:series="filteredSeries"
		></apexchart>
	</div>
</template>

<style scoped>
.group-tabs {
	display: flex;
	gap: 0.35rem;
	margin-bottom: 0.4rem;
	flex-wrap: wrap;
}

.group-tab {
	background: #242628;
	border: 1px solid #3a3c3e;
	color: #777;
	border-radius: 4px;
	padding: 0.18rem 0.65rem;
	font-size: 0.72rem;
	cursor: pointer;
	transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.group-tab:hover:not(.active) {
	background: #2e3032;
	color: #bbb;
}

.group-tab.active {
	background: #172040;
	border-color: #3b5bdb;
	color: #7ab3ff;
	font-weight: 600;
}
</style>
