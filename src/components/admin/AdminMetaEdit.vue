<script setup>
import { ref, watch } from "vue";
import { CHART_TYPE_DATA } from "./chartTypeData.js";

const props = defineProps(["token", "component"]);
const emit = defineEmits(["updated", "back"]);

const CHART_TYPES = [
    "BarChart", "BarPercentChart", "ColumnChart", "SimpleColChart",
    "DonutChart", "PolarChart", "RadarChart", "HeatmapChart",
    "PyramidChart", "TreemapChart", "GuageChart",
    "TimelineSeparateChart", "TimelineStackedChart",
    "MapLegend", "DistrictChart", "DistrictPointChart", "MetroChart",
    "RealNameTable", "StackedColumnChart", "DataTable",
    "ScatterChart", "LineColumnChart", "CandlestickChart",
    "MarketFloorChart",
];

const form = ref({});
const saving = ref(false);
const loading = ref(false);
const status = ref(null);

// ── Chart type preview popup ──
const preview = ref({ visible: false, type: "", x: 0, y: 0 });
function showPreview(e, type) {
    const rect = e.currentTarget.getBoundingClientRect();
    preview.value = { visible: true, type, x: rect.left + rect.width / 2, y: rect.top - 8 };
}
function hidePreview() { preview.value.visible = false; }
function toggleChartType(t) {
    const idx = form.value.chart_types.indexOf(t);
    if (idx === -1) form.value.chart_types.push(t);
    else form.value.chart_types.splice(idx, 1);
}

watch(
    () => props.component,
    async (c) => {
        status.value = null;
        loading.value = true;
        const res = await fetch(`/api/components/${c.id}`, {
            headers: { Authorization: `Bearer ${props.token}` },
        });
        loading.value = false;
        const full = res.ok ? await res.json() : {};
        form.value = {
            name: full.name ?? c.name ?? "",
            source: full.source ?? c.source ?? "",
            short_desc: full.short_desc ?? c.short_desc ?? "",
            long_desc: full.long_desc ?? "",
            use_case: full.use_case ?? "",
            update_freq: full.update_freq ?? null,
            update_freq_unit: full.update_freq_unit ?? "",
            chart_types: full.chart_config?.types ?? c.chart_types ?? [],
            unit: full.chart_config?.unit ?? "",
            categories: (full.chart_config?.categories ?? []).join(", "),
        };
    },
    { immediate: true }
);

async function save() {
    saving.value = true;
    status.value = null;
    // 將 categories 字串轉回陣列（逗號分隔）
    const payload = {
        ...form.value,
        categories: form.value.categories
            ? form.value.categories.split(",").map(s => s.trim()).filter(Boolean)
            : [],
    };
    const res = await fetch(`/api/components/${props.component.id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${props.token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    saving.value = false;
    if (!res.ok) {
        const text = await res.text();
        let msg = `伺服器錯誤 (${res.status})`;
        try { msg = JSON.parse(text).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        status.value = { type: "success", message: "已儲存" };
        emit("updated");
    }
}
</script>

<template>
    <div class="meta-edit">
        <div class="meta-header">
            <button class="btn-back" @click="$emit('back')">← 返回列表</button>
            <div>
                <h3>編輯組件資料 — {{ component.name }}</h3>
                <span class="comp-id">ID: {{ component.id }}</span>
            </div>
        </div>

        <div v-if="loading" class="loading-hint">載入中...</div>

        <div v-else class="form">
            <div class="form-group">
                <label>名稱</label>
                <input v-model="form.name" type="text" />
            </div>
            <div class="form-group">
                <label>資料來源</label>
                <input v-model="form.source" type="text" />
            </div>
            <div class="form-group">
                <label>簡短說明（short_desc）</label>
                <input v-model="form.short_desc" type="text" />
            </div>
            <div class="form-group">
                <label>組件說明（long_desc）</label>
                <textarea v-model="form.long_desc" rows="4" />
            </div>
            <div class="form-group">
                <label>使用情境（use_case）</label>
                <textarea v-model="form.use_case" rows="3" />
            </div>
            <!-- 數值單位 -->
            <div class="form-group">
                <label>數值單位（unit）</label>
                <input v-model="form.unit" type="text" placeholder="例：公噸、元/公斤、人次、件（顯示在 Y 軸與 tooltip）" />
            </div>
            <!-- 座標軸標題 -->
            <div class="form-group">
                <label>座標軸標題（categories，逗號分隔）</label>
                <input v-model="form.categories" type="text" placeholder="例：平均日交易量(公噸), 平均價格(元/公斤)（散佈圖 X/Y 軸標題）" />
                <span class="hint-note">散佈圖上傳 CSV 後會自動填入，其他圖表可手動填 X 軸類別名稱</span>
            </div>
            <!-- 圖表類型 -->
            <div class="form-group">
                <label>圖表類型（可多選，hover 可預覽）</label>
                <div class="chart-type-grid">
                    <button
                        v-for="t in CHART_TYPES"
                        :key="t"
                        :class="['type-btn', form.chart_types?.includes(t) ? 'selected' : '']"
                        type="button"
                        @click="toggleChartType(t)"
                        @mouseenter="showPreview($event, t)"
                        @mouseleave="hidePreview"
                    >{{ t }}</button>
                </div>
                <span v-if="!form.chart_types?.length" class="hint-warn">⚠ 至少選擇一種圖表類型</span>

                <!-- Preview popup -->
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

            <div class="form-group">
                <label>資料更新頻率</label>
                <div class="freq-row">
                    <span class="freq-prefix">每</span>
                    <input
                        v-model.number="form.update_freq"
                        type="number"
                        min="1"
                        placeholder="數字"
                        class="freq-num"
                    />
                    <select v-model="form.update_freq_unit" class="freq-unit">
                        <option value="">— 選擇單位 —</option>
                        <option value="minute">分鐘</option>
                        <option value="hour">小時</option>
                        <option value="day">天</option>
                        <option value="week">週</option>
                        <option value="month">月</option>
                        <option value="year">年</option>
                    </select>
                    <span class="freq-hint">更新一次（留空表示不定期更新）</span>
                </div>
                <div v-if="form.update_freq && form.update_freq_unit" class="freq-preview">
                    預覽：每{{ form.update_freq }}{{ { minute:'分鐘', hour:'小時', day:'天', week:'週', month:'月', year:'年' }[form.update_freq_unit] }}更新
                </div>
            </div>
            <div v-if="status" :class="['status-msg', status.type]">{{ status.message }}</div>
            <button class="btn-save" :disabled="saving" @click="save">
                {{ saving ? "儲存中..." : "儲存" }}
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.meta-edit { display: flex; flex-direction: column; gap: 1.25rem; padding-right: 0.25rem; padding-bottom: 1rem; }

.meta-header {
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

.form {
    background: #1f2123;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 560px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    label { color: #aaa; font-size: 0.875rem; }

    input, textarea {
        background: #1a1c1e;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 0.55rem 0.75rem;
        color: #fff;
        font-size: 0.9rem;
        font-family: inherit;
        resize: vertical;

        &:focus { outline: none; border-color: #5b8cfa; }
    }
}

.freq-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.freq-prefix { color: #aaa; font-size: 0.875rem; }

.freq-num {
    width: 72px;
    background: #1a1c1e;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.5rem 0.6rem;
    color: #fff;
    font-size: 0.9rem;
    &:focus { outline: none; border-color: #5b8cfa; }
}

.freq-unit {
    background: #1a1c1e;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.5rem 0.6rem;
    color: #fff;
    font-size: 0.875rem;
    cursor: pointer;
    &:focus { outline: none; border-color: #5b8cfa; }
    option { background: #1a1c1e; }
}

.freq-hint { color: #555; font-size: 0.78rem; }

.freq-preview {
    margin-top: 0.35rem;
    font-size: 0.8rem;
    color: #7ab3ff;
    background: #1e2a3a;
    border-radius: 4px;
    padding: 0.25rem 0.6rem;
    display: inline-block;
}

.loading-hint { color: #666; font-size: 0.875rem; padding: 1rem 0; }

.status-msg {
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    font-size: 0.875rem;

    &.success { background: #1e3a2a; color: #4ade80; }
    &.error   { background: #3a1e1e; color: #f87171; }
}

.btn-save {
    align-self: flex-start;
    background: #5b8cfa;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1.5rem;
    cursor: pointer;
    font-size: 0.875rem;

    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
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

    &:hover  { border-color: #5b8cfa; color: #7ab3ff; }
    &.selected { background: #2d3e5a; border-color: #5b8cfa; color: #7ab3ff; }
}

.hint-warn { color: #f59e0b; font-size: 0.75rem; }
.hint-note { color: #555; font-size: 0.73rem; margin-top: 0.1rem; }

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
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
}
:global(.chart-preview-popup .cpp-icon) {
    width: 120px; height: 80px;
    display: flex; align-items: center; justify-content: center;
    background: #111315; border-radius: 6px; padding: 0.5rem;
    svg { width: 100%; height: 100%; }
}
:global(.chart-preview-popup .cpp-name) { font-family: monospace; font-size: 0.7rem; color: #7ab3ff; font-weight: 600; }
:global(.chart-preview-popup .cpp-desc) { font-size: 0.68rem; color: #888; text-align: center; line-height: 1.4; }
</style>
