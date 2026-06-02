<script setup>
import { ref, computed, onMounted } from "vue";
import { CHART_TYPE_DATA } from "./chartTypeData.js";

function chartTypeIcon(name) { return CHART_TYPE_DATA[name]?.icon || ""; }
function chartTypeDesc(name) { return CHART_TYPE_DATA[name]?.desc || name; }

// Teleported tooltip state
const tooltip = ref({ visible: false, name: "", x: 0, y: 0 });

function showTooltip(e, name) {
    const r = e.currentTarget.getBoundingClientRect();
    tooltip.value = {
        visible: true,
        name,
        x: r.left + r.width / 2,
        y: r.top - 8,
    };
}
function hideTooltip() { tooltip.value.visible = false; }

const tooltipStyle = computed(() => ({
    left: `${tooltip.value.x}px`,
    top: `${tooltip.value.y}px`,
    transform: "translate(-50%, -100%)",
}));

const props = defineProps(["token", "component"]);
const emit = defineEmits(["uploaded", "back"]);

// ── 現有資料預覽 ──
const currentData = ref(null);   // { series: [{name, data:[{x,y}]}], rows: number }
const currentDataLoading = ref(false);

// 將 series 還原成 CSV 文字（最多顯示 preview_rows 列）
function seriesToCsvPreview(series, maxRows = 4) {
    if (!series?.length) return "";
    const isTimeSeries = series[0]?.data?.[0]?.x?.includes?.("T");
    const headers = [isTimeSeries ? "日期" : "類別", ...series.map(s => s.name || "值")];
    const rows = [];
    const len = Math.min(series[0].data.length, maxRows);
    for (let i = 0; i < len; i++) {
        const x = isTimeSeries
            ? series[0].data[i].x.slice(0, 10)   // 只取日期部分
            : series[0].data[i].x;
        rows.push([x, ...series.map(s => s.data[i]?.y ?? "")].join(","));
    }
    if (series[0].data.length > maxRows) rows.push("…（共 " + series[0].data.length + " 筆）");
    return [headers.join(","), ...rows].join("\n");
}

onMounted(async () => {
    currentDataLoading.value = true;
    try {
        const res = await fetch(`/api/data/${props.component.id}?data_type=chartData`, {
            headers: { Authorization: `Bearer ${props.token}` },
        });
        if (res.ok) {
            const json = await res.json();
            const series = json.data || [];
            currentData.value = {
                series,
                rows: series[0]?.data?.length ?? 0,
                csv: seriesToCsvPreview(series),
                isTimeSeries: !!(series[0]?.data?.[0]?.x?.includes?.("T")),
            };
        }
    } catch {}
    currentDataLoading.value = false;
});

const file = ref(null);
const preview = ref(null);
const dataType = ref("");
const target = ref("auto"); // "auto" | "chartData" | "historyData"
const uploading = ref(false);
const status = ref(null); // { type: 'success'|'error', message }
const dragover = ref(false);

function onFileChange(e) {
    const f = e.target.files[0];
    if (f) loadFile(f);
}

function onDrop(e) {
    dragover.value = false;
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
}

async function loadFile(f) {
    if (!f.name.endsWith(".csv")) {
        status.value = { type: "error", message: "請上傳 .csv 格式的檔案" };
        return;
    }
    file.value = f;
    status.value = null;
    preview.value = null;

    // Auto-preview
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(`/api/data/${props.component.id}/preview?target=${target.value}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
        body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
        status.value = { type: "error", message: data.detail };
        return;
    }
    preview.value = data.preview;
    dataType.value = data.data_type;
    initSelectedChart(data.data_type, data.suggested_chart);
}

async function confirmUpload() {
    if (!file.value) return;
    uploading.value = true;
    status.value = null;

    const fd = new FormData();
    fd.append("file", file.value);
    const res = await fetch(`/api/data/${props.component.id}/upload?target=${target.value}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
        body: fd,
    });
    uploading.value = false;

    if (!res.ok) {
        const text = await res.text();
        let msg = `伺服器錯誤 (${res.status})`;
        try { msg = JSON.parse(text).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        const data = await res.json();
        status.value = { type: "success", message: data.message };
        file.value = null;
        preview.value = null;
        emit("uploaded");
    }
}

function reset() {
    file.value = null;
    preview.value = null;
    status.value = null;
    dataType.value = "";
    selectedChartType.value = "";
    chartTypeStatus.value = null;
}

// Summarize series count for preview display
function previewSummary(data) {
    if (!data) return "";
    const series = data.data || [];
    const totalPts = series.reduce((s, d) => s + (d.data?.length || 0), 0);
    return `${series.length} 個系列，共 ${totalPts} 筆資料點`;
}

// ── Live chart preview ──
const selectedChartType = ref("");

// When preview loads, default to first compatible chart type
// suggestedChart comes from the backend parser (e.g. "ScatterChart", "CandlestickChart")
function initSelectedChart(detectedType, suggestedChart = "") {
    const compat = CHART_COMPAT[detectedType];
    if (!compat) return;
    const current = props.component?.chart_types || [];
    // Priority: 1) suggested chart from parser  2) component's existing type  3) first compatible
    if (suggestedChart && compat.charts.includes(suggestedChart)) {
        selectedChartType.value = suggestedChart;
        return;
    }
    const matched = current.find(t => compat.charts.includes(t));
    selectedChartType.value = matched || compat.charts[0] || "";
}

const previewChartConfig = computed(() => ({
    color: ["#5b8cfa", "#7ab3ff", "#4ade80", "#f59e0b", "#f87171", "#a78bfa", "#34d399"],
    unit: "",
    types: selectedChartType.value ? [selectedChartType.value] : [],
}));

const previewSeries = computed(() => preview.value?.data || []);

// Chart types available for live preview (excludes map/metro types)
const PREVIEWABLE = {
    chartData: [
        "BarChart", "BarPercentChart", "ColumnChart", "SimpleColChart",
        "DonutChart", "PolarChart", "TreemapChart", "RadarChart",
        "HeatmapChart", "PyramidChart", "GuageChart", "RealNameTable",
        "StackedColumnChart", "DataTable",
        "ScatterChart", "LineColumnChart", "CandlestickChart",
    ],
    historyData: ["TimelineSeparateChart", "TimelineStackedChart", "LineColumnChart"],
};

const chartTypeUpdating = ref(false);
const chartTypeStatus = ref(null); // { type, message }

async function applyChartType(chartType) {
    chartTypeUpdating.value = true;
    chartTypeStatus.value = null;
    const res = await fetch(`/api/components/${props.component.id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${props.token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ chart_types: [chartType] }),
    });
    chartTypeUpdating.value = false;
    if (!res.ok) {
        const text = await res.text();
        let msg = `錯誤 (${res.status})`;
        try { msg = JSON.parse(text).detail || msg; } catch {}
        chartTypeStatus.value = { type: "error", message: msg };
    } else {
        chartTypeStatus.value = { type: "success", message: `已將圖表類型設為 ${chartType}` };
    }
}

const CHART_COMPAT = {
    historyData: {
        charts: ["TimelineSeparateChart", "TimelineStackedChart", "LineColumnChart"],
        hint: "時間序列資料（有日期欄）",
    },
    chartData: {
        charts: [
            "BarChart", "BarPercentChart", "ColumnChart", "SimpleColChart",
            "DonutChart", "PolarChart", "TreemapChart", "RadarChart",
            "HeatmapChart", "PyramidChart", "GuageChart", "RealNameTable",
            "StackedColumnChart", "DataTable",
            "ScatterChart", "LineColumnChart", "CandlestickChart",
        ],
        hint: "類別資料（無日期欄）",
    },
};

function compatibility(detectedType) {
    const info = CHART_COMPAT[detectedType];
    if (!info) return null;
    const current = props.component?.chart_types || [];
    const matched = current.filter(t => info.charts.includes(t));
    const mismatched = current.filter(t => !info.charts.includes(t));
    return { ...info, matched, mismatched };
}
</script>

<template>
    <div class="uploader">
        <div class="uploader-header">
            <button class="btn-back" @click="$emit('back')">← 返回列表</button>
            <div>
                <h3>{{ component.name }}</h3>
                <span class="comp-id">ID: {{ component.id }}</span>
            </div>
        </div>

        <!-- Target selector -->
        <div class="target-row">
            <span class="target-label">存入位置：</span>
            <label :class="['target-opt', target === 'chartData' ? 'active' : '']">
                <input type="radio" v-model="target" value="chartData" /> 圖表資料（chartData）
            </label>
            <label :class="['target-opt', target === 'historyData' ? 'active' : '']">
                <input type="radio" v-model="target" value="historyData" /> 歷史資料（historyData）
            </label>
            <label :class="['target-opt', target === 'auto' ? 'active' : '']">
                <input type="radio" v-model="target" value="auto" /> 自動偵測
            </label>
        </div>

        <!-- Drop Zone -->
        <div
            class="drop-zone"
            :class="{ dragover }"
            @dragover.prevent="dragover = true"
            @dragleave="dragover = false"
            @drop.prevent="onDrop"
            @click="$refs.fileInput.click()"
        >
            <input ref="fileInput" type="file" accept=".csv" style="display:none" @change="onFileChange" />
            <div v-if="!file">
                <span class="drop-icon">📂</span>
                <p>拖放 CSV 檔案至此，或點擊選擇</p>
                <p class="drop-hint">支援時間序列（historyData）與類別資料（chartData）</p>
            </div>
            <div v-else class="file-selected">
                <span class="drop-icon">📄</span>
                <p>{{ file.name }}</p>
                <button class="btn-clear" @click.stop="reset">✕ 清除</button>
            </div>
        </div>

        <!-- CSV Format Guide — 顯示現有資料格式 -->
        <div class="format-guide">
            <!-- 有現有資料：顯示實際格式 -->
            <template v-if="currentData && currentData.rows > 0">
                <div class="fg-title">
                    <span>目前資料格式</span>
                    <span class="fg-badge" :class="currentData.isTimeSeries ? 'badge-time' : 'badge-cat'">
                        {{ currentData.isTimeSeries ? '時間序列' : '類別資料' }}
                    </span>
                    <span class="fg-rows">共 {{ currentData.rows }} 筆 × {{ currentData.series.length }} 系列</span>
                </div>
                <div class="fg-cols">
                    <span v-for="s in currentData.series" :key="s.name" class="fg-col-tag">{{ s.name || '（無名稱）' }}</span>
                </div>
                <pre class="fg-pre">{{ currentData.csv }}</pre>
                <p class="fg-hint">上傳新 CSV 時請維持相同的欄位名稱與格式，資料列數不限</p>
            </template>

            <!-- 尚無資料：顯示通用說明 -->
            <template v-else-if="!currentDataLoading">
                <div class="fg-title"><span>CSV 格式說明</span><span class="fg-badge badge-none">尚無資料</span></div>
                <div class="format-grid">
                    <div>
                        <strong>時間序列</strong>
                        <pre class="fg-pre">日期,系列A,系列B
2026-01-01,1250,830
2026-01-02,1180,920</pre>
                        <p class="fg-hint">首欄為日期，其餘欄為各系列名稱</p>
                    </div>
                    <div>
                        <strong>類別資料</strong>
                        <pre class="fg-pre">類別,數值
蔬菜,1250
水果,830</pre>
                        <p class="fg-hint">或多系列：首欄為類別，其餘欄為各系列數值</p>
                    </div>
                </div>
            </template>

            <template v-else>
                <span class="fg-loading">載入現有資料格式中…</span>
            </template>
        </div>

        <!-- Preview -->
        <div v-if="preview" class="preview-box">
            <div class="preview-header">
                <span>預覽結果</span>
                <span class="data-type-badge">{{ dataType }}</span>
                <span class="preview-summary">{{ previewSummary(preview) }}</span>
            </div>

            <!-- Compatibility hint -->
            <div v-if="compatibility(dataType)" class="compat-block">
                <div class="compat-row">
                    <span class="compat-label">此格式適合：</span>
                    <button
                        v-for="c in compatibility(dataType).charts"
                        :key="c"
                        class="chart-tag neutral clickable"
                        :disabled="chartTypeUpdating"
                        @click="applyChartType(c)"
                        @mouseenter="showTooltip($event, c)"
                        @mouseleave="hideTooltip"
                    >{{ c }}</button>
                </div>
                <div class="compat-row" v-if="compatibility(dataType).matched.length">
                    <span class="compat-label">✓ 本組件相符：</span>
                    <span v-for="c in compatibility(dataType).matched" :key="c" class="chart-tag ok">{{ c }}</span>
                </div>
                <div class="compat-row warn-row" v-if="compatibility(dataType).mismatched.length">
                    <span class="compat-label">⚠ 本組件不符：</span>
                    <span v-for="c in compatibility(dataType).mismatched" :key="c" class="chart-tag warn">{{ c }}</span>
                    <span class="compat-note">上傳後該圖表類型可能無法正確顯示</span>
                </div>
                <div v-if="chartTypeStatus" :class="['chart-type-status', chartTypeStatus.type]">
                    {{ chartTypeStatus.message }}
                </div>
            </div>
            <div class="series-list">
                <div v-for="(series, i) in preview.data" :key="i" class="series-item">
                    <div class="series-name">{{ series.name || `系列 ${i + 1}` }}</div>
                    <div class="data-points">
                        <span v-for="(pt, j) in series.data.slice(0, 6)" :key="j" class="point">
                            <em>{{ pt.x }}</em> → {{ pt.y }}
                        </span>
                        <span v-if="series.data.length > 6" class="more">…還有 {{ series.data.length - 6 }} 筆</span>
                    </div>
                </div>
            </div>

            <!-- Live chart preview -->
            <div v-if="PREVIEWABLE[dataType]" class="chart-live-block">
                <div class="chart-live-header">
                    <span class="chart-live-title">圖表預覽</span>
                    <div class="chart-type-tabs">
                        <button
                            v-for="t in PREVIEWABLE[dataType]"
                            :key="t"
                            :class="['chart-tab', selectedChartType === t ? 'active' : '']"
                            type="button"
                            @click="selectedChartType = t"
                            @mouseenter="showTooltip($event, t)"
                            @mouseleave="hideTooltip"
                        >{{ t }}</button>
                    </div>
                </div>
                <div v-if="selectedChartType && previewSeries.length" class="chart-live-canvas">
                    <component
                        :is="selectedChartType"
                        :activeChart="selectedChartType"
                        :chart_config="previewChartConfig"
                        :series="previewSeries"
                        :map_config="null"
                    />
                </div>
                <div v-else class="chart-live-empty">請選擇圖表類型以預覽</div>
            </div>
        </div>

        <!-- Confirm bar — always visible after preview -->
        <div v-if="preview" class="confirm-bar">
            <p class="confirm-warn">確認後將覆蓋 <strong>chartData/{{ component.id }}.json</strong>（原檔自動備份）</p>
            <button class="btn-confirm" :disabled="uploading" @click="confirmUpload">
                {{ uploading ? "上傳中..." : "確認上傳" }}
            </button>
        </div>

        <!-- Status message -->
        <div v-if="status" :class="['status-msg', status.type]">
            {{ status.message }}
        </div>
    </div>

    <!-- Chart type tooltip — teleported to body to escape overflow clipping -->
    <Teleport to="body">
        <div v-if="tooltip.visible" class="chart-tooltip-portal" :style="tooltipStyle">
            <div class="ctp-icon" v-html="chartTypeIcon(tooltip.name)"></div>
            <div class="ctp-desc">{{ chartTypeDesc(tooltip.name) }}</div>
            <div class="ctp-hint">點擊套用</div>
        </div>
    </Teleport>
</template>

<style scoped lang="scss">
.uploader {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-right: 0.25rem;
    padding-bottom: 1rem;
}

.uploader-header {
    display: flex;
    align-items: center;
    gap: 1rem;

    h3 { color: #fff; margin: 0; font-size: 1.1rem; }
}

.comp-id { color: #5b8cfa; font-size: 0.8rem; font-family: monospace; }

.btn-back {
    background: none;
    border: 1px solid #444;
    color: #aaa;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap;

    &:hover { border-color: #aaa; color: #fff; }
}

.target-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.target-label { color: #888; font-size: 0.875rem; }

.target-opt {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border: 1px solid #3a3c3e;
    border-radius: 6px;
    color: #888;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;

    input[type="radio"] { accent-color: #5b8cfa; }

    &.active { border-color: #5b8cfa; color: #7ab3ff; background: #1e2a40; }
    &:hover { border-color: #666; color: #ccc; }
}

.drop-zone {
    border: 2px dashed #444;
    border-radius: 10px;
    padding: 2.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    color: #888;

    &:hover, &.dragover {
        border-color: #5b8cfa;
        background: rgba(91, 140, 250, 0.05);
    }

    p { margin: 0.25rem 0; }
}

.drop-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
.drop-hint { font-size: 0.8rem; color: #555; }

.file-selected {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #ddd;
}

.btn-clear {
    background: #3a1e1e;
    color: #f87171;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.6rem;
    cursor: pointer;
    font-size: 0.8rem;
}

.format-guide {
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #aaa;
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.fg-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
    color: #ddd;
    font-weight: 500;
}

.fg-badge {
    font-size: 0.7rem;
    border-radius: 4px;
    padding: 0.1rem 0.45rem;
    font-weight: 500;
}
.badge-time { background: #1e2a40; color: #7ab3ff; }
.badge-cat  { background: #2a3020; color: #4ade80; }
.badge-none { background: #2e2a1e; color: #f59e0b; }

.fg-rows { color: #666; font-size: 0.75rem; }

.fg-cols {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
}

.fg-col-tag {
    background: #2a2c2e;
    color: #ccc;
    border-radius: 4px;
    padding: 0.1rem 0.45rem;
    font-size: 0.72rem;
    font-family: monospace;
}

.fg-pre {
    background: #1a1c1e;
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    font-size: 0.78rem;
    color: #aad4ff;
    margin: 0;
    overflow-x: auto;
    white-space: pre;
}

.fg-hint { font-size: 0.78rem; color: #666; margin: 0; }
.fg-loading { color: #666; font-size: 0.8rem; }

.format-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-top: 0.25rem;

    p { font-size: 0.8rem; color: #666; margin: 0; }
    strong { color: #ddd; display: block; margin-bottom: 0.4rem; font-size: 0.82rem; }
}

.preview-box {
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    background: #1f2123;
}

.preview-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    color: #ddd;
    font-size: 0.9rem;
}

.data-type-badge {
    background: #2d3e5a;
    color: #7ab3ff;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    font-size: 0.75rem;
}

.preview-summary { color: #666; font-size: 0.8rem; }

.series-list { display: flex; flex-direction: column; gap: 0.5rem; }

.series-item {
    background: #282a2c;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
}

.series-name { color: #7ab3ff; font-size: 0.8rem; margin-bottom: 0.3rem; }

.data-points { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.point {
    background: #1a1c1e;
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    color: #ccc;

    em { color: #888; font-style: normal; }
}

.more { color: #555; font-size: 0.75rem; align-self: center; }

.confirm-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #1f2123;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    flex-shrink: 0;
}

.confirm-warn {
    color: #888;
    font-size: 0.8rem;
    margin: 0;

    strong { color: #f59e0b; }
}

.btn-confirm {
    background: #5b8cfa;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.status-msg {
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;

    &.success { background: #1e3a2a; color: #4ade80; }
    &.error   { background: #3a1e1e; color: #f87171; }
}

.compat-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: #1a1c1e;
    border-radius: 6px;
}

.compat-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.warn-row { margin-top: 0.1rem; }

.compat-label { color: #666; font-size: 0.75rem; white-space: nowrap; min-width: 90px; }

.chart-tag {
    font-size: 0.7rem;
    border-radius: 4px;
    padding: 0.1rem 0.45rem;
    font-family: monospace;

    &.neutral { background: #2a2c2e; color: #888; }
    &.ok      { background: #1e3a2a; color: #4ade80; }
    &.warn    { background: #3a2a1e; color: #f59e0b; }
}

.compat-note { color: #f59e0b; font-size: 0.72rem; margin-left: 0.25rem; }


.chart-tag.clickable {
    cursor: pointer;
    border: none;
    transition: background 0.15s, color 0.15s;

    &:hover:not(:disabled) { background: #3a4a6a; color: #aad4ff; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

/* ── Live chart preview ── */
.chart-live-block {
    margin-top: 1rem;
    border-top: 1px solid #3a3c3e;
    padding-top: 0.75rem;
}

.chart-live-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
}

.chart-live-title {
    color: #aaa;
    font-size: 0.8rem;
    white-space: nowrap;
}

.chart-type-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
}

.chart-tab {
    background: #2a2c2e;
    border: 1px solid #444;
    color: #888;
    border-radius: 4px;
    padding: 0.2rem 0.55rem;
    font-size: 0.7rem;
    font-family: monospace;
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: #5b8cfa; color: #7ab3ff; }
    &.active { background: #2d3e5a; border-color: #5b8cfa; color: #7ab3ff; }
}

.chart-live-canvas {
    height: 280px;
    background: #111315;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
}

.chart-live-empty {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-size: 0.8rem;
    background: #111315;
    border-radius: 8px;
}

.chart-type-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin-top: 0.2rem;

    &.success { background: #1e3a2a; color: #4ade80; }
    &.error   { background: #3a1e1e; color: #f87171; }
}
</style>

<style lang="scss">
/* Non-scoped: teleported to body, can't use scoped */
.chart-tooltip-portal {
    position: fixed;
    z-index: 9999;
    background: #2a2c30;
    border: 1px solid #4a4c50;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 160px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    pointer-events: none;

    svg { width: 80px; height: 54px; }

    .ctp-desc {
        color: #ccc;
        font-size: 0.72rem;
        line-height: 1.4;
        text-align: center;
    }

    .ctp-hint {
        color: #5b8cfa;
        font-size: 0.68rem;
    }
}
</style>
