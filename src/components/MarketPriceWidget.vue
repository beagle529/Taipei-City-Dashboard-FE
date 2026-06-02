<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useContentStore } from "../store/contentStore";

const contentStore = useContentStore();

// ── Market price ──
const priceData = ref(null);
const loading = ref(false);
const error = ref("");
const showSummary = ref(true);   // 控制概況區是否展開
let refreshTimer = null;

async function fetchPrice(forceRefresh = false) {
    loading.value = true;
    error.value = "";
    try {
        const url = forceRefresh ? "/api/market-price/refresh" : "/api/market-price";
        const method = forceRefresh ? "POST" : "GET";
        const res = await fetch(url, { method });
        const data = await res.json();
        if (data.error && !data.price_table?.length) {
            error.value = `無法取得行情資料：${data.error}`;
        } else {
            priceData.value = data;
            // 同步更新 contentStore，讓「下載資料」對話框能拿到實際行情
            const comp = contentStore.currentDashboard.content.find(c => c.id === 208);
            if (comp) {
                comp.chart_data = data.price_table ?? [];
            }
        }
    } catch (e) {
        error.value = "連線失敗，請確認後端服務是否正常";
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchPrice();
    refreshTimer = setInterval(() => fetchPrice(), 5 * 60 * 1000);
});

onUnmounted(() => {
    clearInterval(refreshTimer);
});
</script>

<template>
    <div class="mpw">
        <!-- ── Market price ── -->
        <div class="price-section">
            <div class="price-head">
                <!-- 收折按鈕 -->
                <button class="btn-toggle" @click="showSummary = !showSummary" :title="showSummary ? '收合概況' : '展開概況'">
                    <span :class="['toggle-arrow', showSummary ? 'open' : '']">▲</span>
                </button>
                <span class="price-title">蔬果行情概況</span>
                <span v-if="priceData?.fetched_at" class="price-updated">
                    {{ priceData.fetched_at }}
                    <span v-if="priceData.stale" class="stale-badge">（舊）</span>
                </span>
                <div class="price-head-right">
                    <button class="btn-refresh" :disabled="loading" @click="fetchPrice(true)">
                        <span :class="['refresh-icon', loading ? 'spinning' : '']">↻</span>
                        {{ loading ? "更新中" : "立即更新" }}
                    </button>
                </div>
            </div>

            <!-- Summary（可收折） -->
            <div v-show="showSummary">
                <div v-if="priceData?.summary && Object.keys(priceData.summary).length" class="summary-grid">
                    <div v-for="(val, key) in priceData.summary" :key="key" class="summary-item">
                        <span class="s-label">{{ key }}</span>
                        <span class="s-value">{{ val }}</span>
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div v-if="loading && !priceData" class="price-loading">載入中...</div>
            <div v-else-if="error" class="price-error">{{ error }}</div>
            <div v-else-if="priceData?.rest_day" class="rest-day-banner">
                <div class="rest-badge">休市</div>
                <div class="rest-info">
                    <span class="rest-text">{{ priceData.rest_message || '今日休市' }}</span>
                    <span class="rest-sub">拍賣市場今日未開市，請參閱前一個交易日行情</span>
                    <a
                        href="https://www.tapmc.com.tw/Pages/Trans/Price1"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rest-link"
                    >查詢歷史行情 →</a>
                </div>
            </div>
            <div v-else-if="priceData?.price_table?.length" class="price-table-wrap">
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
                        <tr v-for="(row, i) in priceData.price_table" :key="i">
                            <td class="name-cell">{{ row.name }}</td>
                            <td class="variety-cell">{{ row.variety }}</td>
                            <td class="price-cell high">{{ row.high }}</td>
                            <td class="price-cell mid">{{ row.mid }}</td>
                            <td class="price-cell low">{{ row.low }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else-if="priceData" class="price-empty">目前無行情資料</div>
            <p class="price-note">備註：當日行情為第一市場7時統計數據，僅供參考。單位：公噸、元/公斤</p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.mpw {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    /* 不設 height:100%，讓外層 componentcontainer-chart 的 overflow-y:scroll 處理 */
}

.price-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.price-head-right {
    margin-left: auto;
    flex-shrink: 0;
}

/* 收折按鈕 */
.btn-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 0.2rem;
    line-height: 1;
    flex-shrink: 0;
}

.toggle-arrow {
    display: inline-block;
    font-size: 0.55rem;
    color: #666;
    transition: transform 0.2s, color 0.2s;
    transform: rotate(180deg);   /* 預設展開：箭頭朝下 */

    &.open {
        transform: rotate(0deg); /* 展開：箭頭朝上 */
        color: #7ab3ff;
    }
}

.btn-toggle:hover .toggle-arrow { color: #7ab3ff; }

.price-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
}

.price-updated {
    font-size: 0.65rem;
    color: #555;
    flex: 1;
}

.stale-badge {
    color: #f59e0b;
    font-size: 0.7rem;
}

/* ─ Price section ─ */
.price-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background: #1f2226;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 0.75rem 0.85rem;
}

.btn-refresh {
    background: #2d3e5a;
    border: none;
    color: #7ab3ff;
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    font-size: 0.65rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #3a4f70; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.refresh-icon {
    font-size: 0.75rem;
    display: inline-block;
    &.spinning { animation: spin 1s linear infinite; }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

/* ─ Summary grid ─ */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);   /* 固定 2 欄 */
    gap: 0.35rem;
}

.summary-item {
    background: #141618;
    border: 1px solid #2a2c2e;
    border-radius: 5px;
    padding: 0.2rem 0.5rem;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
}

.s-label { color: #888; font-size: 0.6rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.s-value { color: #f59e0b; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }

/* ─ Table ─ */
.price-table-wrap {
    max-height: 260px;
    overflow-y: auto;
    border: 1px solid #2a2c2e;
    border-radius: 6px;
}

.price-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;

    thead tr {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    th {
        background: #282a2c;
        color: #888;
        font-weight: 500;
        padding: 0.5rem 0.75rem;
        text-align: left;
        white-space: nowrap;
    }

    td {
        padding: 0.45rem 0.75rem;
        border-bottom: 1px solid #1f2123;
        color: #ccc;
        white-space: nowrap;
    }

    tr:hover td { background: #242628; }
}

.name-cell    { color: #e88c30; font-weight: 500; }
.variety-cell { color: #aaa; }
.price-cell   { font-family: monospace; text-align: right; }
.price-cell.high { color: #f87171; }
.price-cell.mid  { color: #fbbf24; }
.price-cell.low  { color: #4ade80; }

.price-loading { color: #666; font-size: 0.875rem; }
.price-error   { color: #f87171; font-size: 0.875rem; }
.price-empty   { color: #555; font-size: 0.875rem; }
.price-note    { color: #555; font-size: 0.6rem; margin-top: 0.2rem; line-height: 1.4; }

/* ─ Rest day ─ */
.rest-day-banner {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    background: #141618;
    border: 1px solid #2a2c2e;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    overflow: hidden;
}

.rest-badge {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: #1a2a3a;
    border: 2px solid #7ab3ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #7ab3ff;
    letter-spacing: 0.05em;
    user-select: none;
}

.rest-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
}

.rest-text {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f59e0b;
    letter-spacing: 0.08em;
}

.rest-sub {
    font-size: 0.72rem;
    color: #888;
    line-height: 1.4;
}

.rest-link {
    display: inline-block;
    margin-top: 0.3rem;
    font-size: 0.75rem;
    color: #7ab3ff;
    text-decoration: none;
    border: 1px solid #2d3e5a;
    border-radius: 4px;
    padding: 0.2rem 0.6rem;
    width: fit-content;
    transition: background 0.15s, color 0.15s;

    &:hover {
        background: #2d3e5a;
        color: #fff;
    }
}
</style>
