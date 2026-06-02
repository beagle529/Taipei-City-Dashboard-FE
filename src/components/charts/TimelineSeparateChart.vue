<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref } from "vue";
import { fmtAxisVal } from "../../assets/configs/apexcharts/chartUtils.js";

const props = defineProps(["chart_config", "activeChart", "series"]);

// 預設色票（color 陣列為空時使用）
const DEFAULT_COLORS = ["#5b8cfa","#4ade80","#f59e0b","#f87171","#a78bfa","#34d399","#fb923c"];
const resolvedColors = props.chart_config.color?.length
	? props.chart_config.color
	: DEFAULT_COLORS;

const chartOptions = ref({
	chart: {
		toolbar: {
			show: false,
			tools: {
				zoom: false,
			},
		},
	},
	colors: resolvedColors,
	dataLabels: {
		enabled: false,
	},
	grid: {
		show: false,
	},
	legend: {
		show: props.series.length > 1 ? true : false,
	},
	markers: {
		hover: {
			size: props.chart_config?.markers?.hover?.size ?? 5,
		},
		size: props.chart_config?.markers?.size ?? 3,
		strokeWidth: props.chart_config?.markers?.strokeWidth ?? 0,
	},
	stroke: {
		colors: resolvedColors,
		curve: "smooth",
		show: true,
		width: 2,
	},
	tooltip: {
		custom: function ({ series, seriesIndex, dataPointIndex, w }) {
			// The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css
			return (
				'<div class="chart-tooltip">' +
				"<h6>" +
				`${parseTime(
					w.config.series[seriesIndex].data[dataPointIndex].x
				)}` +
				` - ${w.globals.seriesNames[seriesIndex]}` +
				"</h6>" +
				"<span>" +
				series[seriesIndex][dataPointIndex] +
				` ${props.chart_config.unit}` +
				"</span>" +
				"</div>"
			);
		},
	},
	xaxis: {
		axisBorder: {
			color: "#555",
			height: "0.8",
		},
		axisTicks: {
			show: false,
		},
		crosshairs: {
			show: false,
		},
		tooltip: {
			enabled: false,
		},
		type: "datetime",
	},
	yaxis: {
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			formatter: (val) => fmtAxisVal(val, props.chart_config.unit ?? ""),
		},
	},
});

function parseTime(time) {
	return time.replace("T", " ").replace("+08:00", " ");
}
</script>

<template>
	<div v-if="activeChart === 'TimelineSeparateChart'">
		<apexchart
			width="100%"
			height="260px"
			type="line"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
