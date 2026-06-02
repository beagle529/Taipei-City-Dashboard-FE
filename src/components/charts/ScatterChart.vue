<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref } from "vue";
import { fmtAxisVal } from "../../assets/configs/apexcharts/chartUtils.js";

const props = defineProps(["chart_config", "activeChart", "series"]);

const DEFAULT_COLORS = ["#5b8cfa", "#4ade80", "#f59e0b", "#f87171", "#a78bfa"];
const resolvedColors = props.chart_config.color?.length
	? props.chart_config.color
	: DEFAULT_COLORS;

const chartOptions = ref({
	chart: {
		toolbar: { show: false },
		zoom: { enabled: false },
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
	markers: {
		size: 5,
		strokeWidth: 0,
		hover: { sizeOffset: 2 },
	},
	tooltip: {
		custom: function ({ seriesIndex, dataPointIndex, w }) {
			const point = w.config.series[seriesIndex].data[dataPointIndex];
			const xLabel = props.chart_config.categories?.[0] ?? "X";
			const yLabel = props.chart_config.categories?.[1] ?? "Y";
			const unit = props.chart_config.unit ?? "";
			// Use item label if available (from scatter CSV parser), else series name
			const title = point.label ?? w.globals.seriesNames[seriesIndex];
			return (
				'<div class="chart-tooltip">' +
				"<h6>" + title + "</h6>" +
				"<span>" + xLabel + ": " + point.x + " " + unit +
				" &nbsp;|&nbsp; " + yLabel + ": " + point.y + " " + unit +
				"</span>" +
				"</div>"
			);
		},
	},
	xaxis: {
		axisBorder: { show: false },
		axisTicks: { show: false },
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			formatter: (val) => fmtAxisVal(val),
		},
		title: {
			text: props.chart_config.categories?.[0] ?? "",
			style: { color: "#888", fontSize: "11px" },
		},
	},
	yaxis: {
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			formatter: (val) => fmtAxisVal(val),
		},
		title: {
			text: props.chart_config.categories?.[1] ?? "",
			style: { color: "#888", fontSize: "11px" },
		},
	},
});
</script>

<template>
	<div v-if="activeChart === 'ScatterChart'">
		<apexchart
			width="100%"
			height="270px"
			type="scatter"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
