<script setup>
import { ref, computed, onMounted } from "vue";
import { useContentStore } from "../store/contentStore";

const contentStore = useContentStore();

const historyList = ref([]);       // 原始清單（由 API 回傳）
const SHOW_DAYS = 7;

// 只顯示最近 7 個有交易日
const displayList = computed(() =>
    historyList.value.filter(r => !r.rest_day).slice(0, SHOW_DAYS)
);
const loading = ref(false);
const selectedDate = ref(null);
const historyDetail = ref(null);
const detailLoading = ref(false);

// 目前選取的 meta（筆數、時間）
const selectedMeta = computed(() =>
    historyList.value.find(r => r.date === selectedDate.value) ?? null
);

async function fetchHistoryList() {
    loading.value = true;
    try {
        const res = await fetch("/api/market-price/history");
        historyList.value = await res.json();
        if (historyList.value.length && !selectedDate.value) {
            // 自動選最新一個有交易日
            const first = historyList.value.find(r => !r.rest_day);
            if (first) selectDate(first.date);
        }
    } catch {
        historyList.value = [];
    } finally {
        loading.value = false;
    }
}

async function selectDate(date) {
    if (selectedDate.value === date) return;
    selectedDate.value = date;
    historyDetail.value = null;
    detailLoading.value = true;
    try {
        const res = await fetch(`/api/market-price/history/${date}`);
        historyDetail.value = await res.json();
        // 同步至 contentStore，讓「下載資料」對話框能取得當日行情
        const comp = contentStore.currentDashboard.content.find(c => c.id === 215);
        if (comp) {
            comp.chart_data = historyDetail.value.price_table ?? [];
        }
    } catch {
        historyDetail.value = null;
    } finally {
        detailLoading.value = false;
    }
}

onMounted(fetchHistoryList);
</script>

<template>
    <div class="mphw">

        <!-- ── 日期選擇列（橫向，最上方） ── -->
        <div v-if="loading" class="status-msg">載入中...</div>
        <div v-else-if="displayList.length === 0" class="status-msg muted">尚無歷史紀錄，每日早上 8:00 自動儲存</div>
        <template v-else>
            <div class="date-bar">
                <button
                    v-for="rec in displayList"
                    :key="rec.date"
                    :class="['date-btn', selectedDate === rec.date ? 'active' : '', rec.rest_day ? 'is-rest' : '']"
                    @click="selectDate(rec.date)"
                    :title="rec.fetched_at"
                >
                    <span class="dbtn-date">{{ rec.date.slice(5).replace('-', '/') }}</span>
                    <span class="dbtn-sub">
                        <span v-if="rec.rest_day" class="tag-rest">休市</span>
                        <template v-else>
                            <span class="dbtn-rows">{{ rec.row_count }}筆</span>
                            <span class="dbtn-time">{{ rec.fetched_at ? rec.fetched_at.slice(11, 16) : '' }}</span>
                        </template>
                    </span>
                </button>
            </div>

            <!-- ── 內容區（全寬） ── -->
            <div class="detail-panel">
                <div v-if="!selectedDate" class="status-msg muted">請選擇上方日期查看行情</div>
                <div v-else-if="detailLoading" class="status-msg">載入中...</div>
                <template v-else-if="historyDetail">

                    <!-- 概況統計 -->
                    <div
                        v-if="historyDetail.summary && Object.keys(historyDetail.summary).length"
                        class="summary-grid"
                    >
                        <div v-for="(val, key) in historyDetail.summary" :key="key" class="summary-item">
                            <span class="s-label">{{ key }}</span>
                            <span class="s-value">{{ val }}</span>
                        </div>
                    </div>

                    <!-- 休市 -->
                    <div v-if="historyDetail.rest_day" class="status-msg muted">
                        🔒 休市日，無行情資料
                    </div>

                    <!-- 價格表 -->
                    <template v-else>
                        <div class="table-meta">
                            <span class="row-count">共 {{ historyDetail.price_table.length }} 筆</span>
                            <span class="fetch-time">{{ historyDetail.fetched_at }}</span>
                        </div>
                        <div class="table-wrap">
                            <table class="price-table">
                                <thead>
                                    <tr>
                                        <th>品名</th>
                                        <th>品種</th>
                                        <th>上價</th>
                                        <th>中價</th>
                                        <th>下價</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, i) in historyDetail.price_table" :key="i">
                                        <td class="name-cell">{{ row.name }}</td>
                                        <td class="variety-cell">{{ row.variety }}</td>
                                        <td class="price-cell high">{{ row.high }}</td>
                                        <td class="price-cell mid">{{ row.mid }}</td>
                                        <td class="price-cell low">{{ row.low }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                </template>
            </div>
        </template>

        <p class="note">每日早上 8:00 自動存入歷史紀錄。單位：元/公斤</p>
    </div>
</template>

<style scoped lang="scss">
.mphw {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    height: 100%;
}

/* ─ Status ─ */
.status-msg {
    font-size: 0.82rem;
    color: #aaa;
    padding: 0.4rem 0;
    &.muted { color: #555; }
}

/* ─ Date bar（橫向捲動列） ─ */
.date-bar {
    display: flex;
    gap: 0.25rem;
    overflow-x: auto;
    padding-bottom: 0.2rem;
    flex-shrink: 0;

    /* 隱藏捲軸但仍可捲動 */
    scrollbar-width: thin;
    scrollbar-color: #3a3c3e transparent;
    &::-webkit-scrollbar { height: 3px; }
    &::-webkit-scrollbar-thumb { background: #3a3c3e; border-radius: 2px; }
}

.date-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.05rem;
    flex: 1;           /* 七顆平分整列寬度 */
    min-width: 0;
    padding: 0.2rem 0.3rem;
    border-radius: 5px;
    border: 1px solid #1e2535;
    background: #141822;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;

    &:hover { background: #1a2030; border-color: #2e3f5c; }
    &.active { background: #172040; border-color: #3b5bdb; }
    &.is-rest { opacity: 0.45; }
}

.dbtn-date {
    font-size: 0.66rem;
    font-family: monospace;
    color: #7b90b0;
    font-weight: 600;
    white-space: nowrap;
}

.dbtn-sub {
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.dbtn-rows {
    font-size: 0.55rem;
    color: #3d5070;
    white-space: nowrap;
}

.dbtn-time {
    font-size: 0.55rem;
    color: #2e3f58;
    font-family: monospace;
    white-space: nowrap;
}

.tag-rest {
    font-size: 0.52rem;
    color: #7ab3ff;
    border: 1px solid #3a5070;
    border-radius: 3px;
    padding: 0.05rem 0.2rem;
}

/* ─ Detail panel（全寬） ─ */
.detail-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    overflow: hidden;
}

/* ─ Summary grid ─ */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.3rem;
    flex-shrink: 0;
}

.summary-item {
    background: #161a20;
    border: 1px solid #252a35;
    border-radius: 5px;
    padding: 0.18rem 0.45rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
}

.s-label {
    color: #6b7280;
    font-size: 0.58rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.s-value {
    color: #60a5fa;   /* 冷藍色，對比即時行情的琥珀色 */
    font-size: 0.72rem;
    font-weight: 600;
    flex-shrink: 0;
}

/* ─ Table meta bar ─ */
.table-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
}

.row-count {
    font-size: 0.65rem;
    color: #3d5070;
}

.fetch-time {
    font-size: 0.62rem;
    color: #2e3f58;
    font-family: monospace;
}

/* ─ Table ─ */
.table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid #252a35;
    border-radius: 6px;
}

.price-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.73rem;

    thead tr {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    th {
        background: #1a2030;           /* 深藍灰，對比即時行情的 #282a2c */
        color: #5b7a9e;
        font-weight: 500;
        padding: 0.45rem 0.65rem;
        text-align: left;
        white-space: nowrap;
        letter-spacing: 0.03em;
    }

    td {
        padding: 0.4rem 0.65rem;
        border-bottom: 1px solid #1c2030;
        color: #8a9bb5;                /* 整體偏灰藍，不像即時行情那麼亮 */
        white-space: nowrap;
    }

    tr:hover td { background: #1a2030; }
}

/* 歷史行情：冷色調，品名用灰藍、價格用漸層藍紫 */
.name-cell    { color: #7b90b0; font-weight: 500; }
.variety-cell { color: #566880; }
.price-cell   { font-family: monospace; text-align: right; }
.price-cell.high { color: #93c5fd; }   /* 淺藍（高價） */
.price-cell.mid  { color: #a5b4fc; }   /* 淡紫藍（中價） */
.price-cell.low  { color: #c4b5fd; }   /* 淡紫（低價） */

.note {
    color: #444;
    font-size: 0.58rem;
    flex-shrink: 0;
}
</style>
