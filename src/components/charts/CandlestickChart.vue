<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref } from "vue";
import { fmtAxisVal } from "../../assets/configs/apexcharts/chartUtils.js";

const props = defineProps(["chart_config", "activeChart", "series"]);

// series data format expected: [{name: "...", data: [{x: date, y: [open, high, low, close]}]}]

const chartOptions = ref({
	chart: {
		toolbar: { show: false },
		zoom: { enabled: false },
	},
	candlestick: {
		colors: {
			upward: "#4ade80",
			downward: "#f87171",
		},
		wick: { useFillColor: true },
	},
	dataLabels: { enabled: false },
	grid: {
		borderColor: "#2a2c2e",
		strokeDashArray: 3,
	},
	plotOptions: {
		candlestick: {
			colors: {
				upward: "#4ade80",
				downward: "#f87171",
			},
			wick: { useFillColor: true },
		},
	},
	tooltip: {
		theme: "dark",
		custom: function ({ seriesIndex, dataPointIndex, w }) {
			const o = w.config.series[seriesIndex];
			const point = o?.data?.[dataPointIndex];
			if (!point) return "";
			const [open, high, low, close] = point.y ?? [];
			const unit = props.chart_config.unit ?? "";
			const upDown = close >= open ? "▲" : "▼";
			const color = close >= open ? "#4ade80" : "#f87171";
			return (
				'<div class="chart-tooltip">' +
				"<h6>" + point.x + "</h6>" +
				`<span style="color:${color}">${upDown} 收 ${close} ${unit}</span><br/>` +
				`<span>開 ${open} &nbsp;|&nbsp; 高 ${high} &nbsp;|&nbsp; 低 ${low}</span>` +
				"</div>"
			);
		},
	},
	xaxis: {
		type: "category",
		axisBorder: { show: false },
		axisTicks: { show: false },
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			rotate: -30,
			rotateAlways: false,
			hideOverlappingLabels: true,
		},
	},
	yaxis: {
		tooltip: { enabled: true },
		labels: {
			style: { colors: "#777", fontSize: "11px" },
			formatter: (val) => fmtAxisVal(val, props.chart_config.unit ?? ""),
		},
	},
});
</script>

<template>
	<div v-if="activeChart === 'CandlestickChart'">
		<apexchart
			width="100%"
			height="270px"
			type="candlestick"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
