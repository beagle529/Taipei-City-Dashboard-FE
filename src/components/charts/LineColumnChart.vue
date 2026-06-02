<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref, computed } from "vue";
import { fmtAxisVal } from "../../assets/configs/apexcharts/chartUtils.js";

const props = defineProps(["chart_config", "activeChart", "series"]);

const DEFAULT_COLORS = ["#5b8cfa", "#4ade80", "#f59e0b", "#f87171", "#a78bfa"];
const resolvedColors = props.chart_config.color?.length
	? props.chart_config.color
	: DEFAULT_COLORS;

// Series whose name appears in chart_config.lineTypes (or the last series) become lines
const lineTypes = computed(() => props.chart_config.lineTypes ?? []);

const apexSeries = computed(() =>
	(props.series ?? []).map((s, i) => {
		const isLine =
			lineTypes.value.includes(s.name) ||
			(!lineTypes.value.length && i === props.series.length - 1);
		return { ...s, type: isLine ? "line" : "column" };
	})
);

const chartOptions = ref({
	chart: {
		toolbar: { show: false },
		zoom: { enabled: false },
		stacked: false,
	},
	colors: resolvedColors,
	dataLabels: { enabled: false },
	grid: {
		borderColor: "#2a2c2e",
		strokeDashArray: 3,
	},
	legend: {
		show: true,
		labels: { colors: "#888" },
	},
	stroke: {
		width: apexSeries.value.map((s) => (s.type === "line" ? 2.5 : 0)),
		curve: "smooth",
	},
	markers: {
		size: apexSeries.value.map((s) => (s.type === "line" ? 3 : 0)),
	},
	tooltip: {
		shared: true,
		intersect: false,
		theme: "dark",
		y: {
			formatter: (val) =>
				val !== null && val !== undefined
					? val + " " + (props.chart_config.unit ?? "")
					: "—",
		},
	},
	xaxis: {
		axisBorder: { show: false },
		axisTicks: { show: false },
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			formatter: (val) => {
				// YYYY-MM-DD → MM/YY（簡短顯示）
				const m = String(val).match(/^(\d{4})[T\-](\d{2})/);
				return m ? `${m[2]}/${m[1].slice(2)}` : val;
			},
			rotate: -30,
			hideOverlappingLabels: true,
		},
		type: "category",
	},
	yaxis: {
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			formatter: (val) => fmtAxisVal(val, props.chart_config.unit ?? ""),
		},
	},
	plotOptions: {
		bar: { columnWidth: "55%", borderRadius: 2 },
	},
});
</script>

<template>
	<div v-if="activeChart === 'LineColumnChart'">
		<apexchart
			width="100%"
			height="270px"
			type="line"
			:options="chartOptions"
			:series="apexSeries"
		></apexchart>
	</div>
</template>
