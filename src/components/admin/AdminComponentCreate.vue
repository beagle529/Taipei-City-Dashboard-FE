<script setup>
import { ref } from "vue";
import { CHART_TYPE_DATA } from "./chartTypeData.js";

const props = defineProps(["token"]);
const emit = defineEmits(["back", "created"]);

// ── Chart type preview popup ──
const preview = ref({ visible: false, type: "", x: 0, y: 0 });

function showPreview(e, type) {
    const rect = e.currentTarget.getBoundingClientRect();
    preview.value = {
        visible: true,
        type,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
    };
}
function hidePreview() {
    preview.value.visible = false;
}

const CHART_TYPES = [
    "BarChart", "BarPercentChart", "ColumnChart", "SimpleColChart",
    "DonutChart", "PolarChart", "RadarChart", "HeatmapChart",
    "PyramidChart", "TreemapChart", "GuageChart",
    "TimelineSeparateChart", "TimelineStackedChart",
    "MapLegend", "DistrictChart", "DistrictPointChart", "MetroChart",
    "RealNameTable", "StackedColumnChart", "DataTable",
    "ScatterChart", "LineColumnChart", "CandlestickChart",
];

const SOURCES = ["業務部", "管理部", "營業部", "財務部", "企劃部", "資訊部", "勞工安全衛生室", "第一市場改建辦公室", "稽核室", "秘書室"];

const form = ref({
    name: "",
    source: "",
    chart_types: [],
    history_data: false,
    short_desc: "",
    long_desc: "",
    use_case: "",
});

const saving = ref(false);
const error = ref("");
const success = ref("");

function toggleChartType(t) {
    const idx = form.value.chart_types.indexOf(t);
    if (idx === -1) form.value.chart_types.push(t);
    else form.value.chart_types.splice(idx, 1);
}

async function submit() {
    error.value = "";
    if (!form.value.name.trim()) { error.value = "請填寫組件名稱"; return; }
    if (!form.value.source) { error.value = "請選擇資料來源部門"; return; }
    if (!form.value.chart_types.length) { error.value = "請至少選擇一種圖表類型"; return; }

    saving.value = true;
    try {
        const res = await fetch("/api/components", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.token}`,
            },
            body: JSON.stringify(form.value),
        });
        const data = await res.json();
        if (!res.ok) { error.value = data.detail || "新增失敗"; return; }
        success.value = `${data.message}（ID: ${data.id}）`;
        setTimeout(() => emit("created", data.id), 1200);
    } catch {
        error.value = "無法連接後端";
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <div class="create-panel">
        <div class="create-head">
            <button class="btn-back" @click="$emit('back')">← 返回列表</button>
            <h2>新增組件</h2>
        </div>

        <div v-if="success" class="msg-success">✓ {{ success }}</div>
        <div v-else class="create-form">

            <!-- 名稱 -->
            <div class="field">
                <label>組件名稱 <span class="req">*</span></label>
                <input v-model="form.name" type="text" placeholder="例：每日交易量統計" />
            </div>

            <!-- 資料來源 -->
            <div class="field">
                <label>資料來源部門 <span class="req">*</span></label>
                <select v-model="form.source">
                    <option value="" disabled>— 請選擇 —</option>
                    <option v-for="s in SOURCES" :key="s" :value="s">{{ s }}</option>
                </select>
            </div>

            <!-- 圖表類型 -->
            <div class="field">
                <label>圖表類型 <span class="req">*</span>（可多選）</label>
                <div class="chart-type-grid">
                    <button
                        v-for="t in CHART_TYPES"
                        :key="t"
                        :class="['type-btn', form.chart_types.includes(t) ? 'selected' : '']"
                        type="button"
                        @click="toggleChartType(t)"
                        @mouseenter="showPreview($event, t)"
                        @mouseleave="hidePreview"
                    >{{ t }}</button>
                </div>

                <!-- Chart preview popup (Teleport to avoid clipping) -->
                <Teleport to="body">
                    <div
                        v-if="preview.visible && CHART_TYPE_DATA[preview.type]"
                        class="chart-preview-popup"
                        :style="{ left: preview.x + 'px', top: preview.y + 'px' }"
                    >
                        <div class="cpp-icon" v-html="CHART_TYPE_DATA[preview.type].icon" />
                        <div class="cpp-name">{{ preview.type }}</div>
                        <div class="cpp-desc">{{ CHART_TYPE_DATA[preview.type].desc }}</div>
                    </div>
                </Teleport>
            </div>

            <!-- 歷史資料 -->
            <div class="field field-row">
                <label>支援歷史趨勢資料</label>
                <label class="toggle">
                    <input type="checkbox" v-model="form.history_data" />
                    <span class="slider"></span>
                </label>
                <span class="toggle-hint">{{ form.history_data ? '是（需上傳 historyData CSV）' : '否' }}</span>
            </div>

            <!-- 簡短說明 -->
            <div class="field">
                <label>簡短說明</label>
                <input v-model="form.short_desc" type="text" placeholder="顯示在組件卡片上的一行描述" maxlength="60" />
                <span class="hint">{{ form.short_desc.length }}/60</span>
            </div>

            <!-- 詳細說明 -->
            <div class="field">
                <label>詳細說明</label>
                <textarea v-model="form.long_desc" rows="3" placeholder="組件資料內容的完整說明" />
            </div>

            <!-- 使用情境 -->
            <div class="field">
                <label>使用情境</label>
                <textarea v-model="form.use_case" rows="2" placeholder="此組件適合用於哪些分析場景" />
            </div>

            <p v-if="error" class="msg-error">{{ error }}</p>

            <div class="form-actions">
                <button class="btn-cancel" type="button" @click="$emit('back')">取消</button>
                <button class="btn-submit" type="button" :disabled="saving" @click="submit">
                    {{ saving ? "新增中..." : "確認新增" }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.create-panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 680px;
}

.create-head {
    display: flex;
    align-items: center;
    gap: 1rem;

    h2 { color: #fff; font-size: 1.1rem; margin: 0; }
}

.btn-back {
    background: none;
    border: 1px solid #444;
    color: #aaa;
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    &:hover { border-color: #aaa; color: #fff; }
}

.create-form {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    label {
        color: #aaa;
        font-size: 0.85rem;
    }

    input, select, textarea {
        background: #1a1c1e;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 0.55rem 0.75rem;
        color: #fff;
        font-size: 0.875rem;
        &:focus { outline: none; border-color: #5b8cfa; }
    }

    textarea { resize: vertical; font-family: inherit; }

    select option { background: #1a1c1e; }
}

.field-row {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;

    label { margin: 0; }
}

.req { color: #f87171; }

.hint {
    color: #555;
    font-size: 0.75rem;
    align-self: flex-end;
    margin-top: -0.3rem;
}

.chart-type-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.type-btn {
    background: #2a2c2e;
    border: 1px solid #444;
    color: #888;
    border-radius: 5px;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    font-family: monospace;
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: #5b8cfa; color: #7ab3ff; }
    &.selected { background: #2d3e5a; border-color: #5b8cfa; color: #7ab3ff; }
}

/* Toggle switch */
.toggle {
    position: relative;
    width: 38px;
    height: 20px;
    flex-shrink: 0;

    input { opacity: 0; width: 0; height: 0; position: absolute; }

    .slider {
        position: absolute;
        inset: 0;
        background: #444;
        border-radius: 20px;
        cursor: pointer;
        transition: background 0.2s;

        &::before {
            content: "";
            position: absolute;
            width: 14px;
            height: 14px;
            left: 3px;
            top: 3px;
            background: #fff;
            border-radius: 50%;
            transition: transform 0.2s;
        }
    }

    input:checked + .slider { background: #5b8cfa; }
    input:checked + .slider::before { transform: translateX(18px); }
}

.toggle-hint { color: #888; font-size: 0.8rem; }

.form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 0.5rem;
    border-top: 1px solid #3a3c3e;
}

.btn-cancel {
    background: none;
    border: 1px solid #444;
    color: #888;
    border-radius: 6px;
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    cursor: pointer;
    &:hover { border-color: #aaa; color: #fff; }
}

.btn-submit {
    background: #5b8cfa;
    border: none;
    color: #fff;
    border-radius: 6px;
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s;
    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.msg-error {
    color: #f87171;
    font-size: 0.85rem;
    margin: 0;
}

.msg-success {
    color: #4ade80;
    font-size: 0.95rem;
    padding: 1.5rem;
    background: #1e3a2a;
    border: 1px solid #2a5a3a;
    border-radius: 8px;
}

/* ── Chart preview popup (global, lives in <body> via Teleport) ── */
:global(.chart-preview-popup) {
    position: fixed;
    transform: translate(-50%, -100%);
    z-index: 9999;
    background: #1a1c20;
    border: 1px solid #5b8cfa;
    border-radius: 10px;
    padding: 0.75rem;
    width: 160px;
    pointer-events: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
}

:global(.chart-preview-popup .cpp-icon) {
    width: 120px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111315;
    border-radius: 6px;
    padding: 0.5rem;
}

:global(.chart-preview-popup .cpp-icon svg) {
    width: 100%;
    height: 100%;
}

:global(.chart-preview-popup .cpp-name) {
    font-family: monospace;
    font-size: 0.7rem;
    color: #7ab3ff;
    font-weight: 600;
}

:global(.chart-preview-popup .cpp-desc) {
    font-size: 0.68rem;
    color: #888;
    text-align: center;
    line-height: 1.4;
}
</style>
