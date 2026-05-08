<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const activeSection = ref("overview");

const sections = [
    { id: "overview",   label: "系統概覽" },
    { id: "dashboard",  label: "儀表板操作" },
    { id: "mapview",    label: "地圖交叉比對" },
    { id: "admin",      label: "管理後台" },
    { id: "csv",        label: "CSV 上傳格式" },
    { id: "charts",     label: "圖表類型說明" },
];
</script>

<template>
    <div class="help-page">
        <!-- Header -->
        <div class="help-header">
            <button class="btn-back" @click="router.back()">← 返回</button>
            <h1>系統操作說明</h1>
        </div>

        <div class="help-body">
            <!-- Sidebar nav -->
            <nav class="help-nav">
                <button
                    v-for="s in sections"
                    :key="s.id"
                    :class="['nav-item', activeSection === s.id ? 'active' : '']"
                    @click="activeSection = s.id"
                >{{ s.label }}</button>
            </nav>

            <!-- Content -->
            <div class="help-content">

                <!-- 系統概覽 -->
                <section v-show="activeSection === 'overview'">
                    <h2>系統概覽</h2>
                    <p>本系統為公司內部治理儀表板，提供資料視覺化瀏覽與管理功能，主要分為三個區塊：</p>
                    <div class="card-grid">
                        <div class="info-card">
                            <div class="card-icon">dashboard</div>
                            <h3>儀表板總覽</h3>
                            <p>以卡片方式展示各組件的圖表資料，支援多個儀表板切換。</p>
                        </div>
                        <div class="info-card">
                            <div class="card-icon">map</div>
                            <h3>地圖交叉比對</h3>
                            <p>將具備地理資訊的組件疊加在地圖上，進行空間資料比對分析。</p>
                        </div>
                        <div class="info-card">
                            <div class="card-icon">admin_panel_settings</div>
                            <h3>管理後台</h3>
                            <p>透過 CSV 上傳更新圖表資料，並編輯組件的說明與資料來源。</p>
                        </div>
                    </div>
                </section>

                <!-- 儀表板操作 -->
                <section v-show="activeSection === 'dashboard'">
                    <h2>儀表板操作</h2>

                    <h3>切換儀表板</h3>
                    <p>點擊左側側欄上方的儀表板名稱，即可切換不同的儀表板頁面。每個儀表板包含一組相關的資料組件。</p>

                    <h3>組件卡片</h3>
                    <p>每個卡片代表一個資料組件，包含以下功能：</p>
                    <ul>
                        <li><span class="tag">圖表切換</span> 部分組件提供多種圖表類型，點擊卡片右上角的圖表圖示切換</li>
                        <li><span class="tag">歷史趨勢</span> 有歷史資料的組件可點擊時鐘圖示查看時間趨勢</li>
                        <li><span class="tag">組件說明</span> 點擊資訊圖示查看資料說明、使用情境與來源</li>
                        <li><span class="tag">下載資料</span> 點擊下載圖示可取得原始 JSON 資料</li>
                        <li><span class="tag">回報問題</span> 點擊旗幟圖示回報資料異常</li>
                    </ul>

                    <h3>搜尋與篩選</h3>
                    <p>左側側欄提供組件搜尋功能，輸入關鍵字可快速定位特定組件。</p>
                </section>

                <!-- 地圖交叉比對 -->
                <section v-show="activeSection === 'mapview'">
                    <h2>地圖交叉比對</h2>

                    <h3>新增地圖圖層</h3>
                    <p>在左側側欄點擊組件旁的「+」按鈕，將該組件的地理資料加入地圖。最多可同時疊加多個圖層。</p>

                    <h3>圖層管理</h3>
                    <p>已加入的圖層會顯示在右側面板，可點擊眼睛圖示切換顯示/隱藏，或點擊「×」移除圖層。</p>

                    <h3>適用組件類型</h3>
                    <p>地圖視圖僅支援具備地理資訊的組件，圖表類型包含：</p>
                    <ul>
                        <li><span class="tag">MapLegend</span> 分層設色地圖</li>
                        <li><span class="tag">DistrictChart</span> 行政區統計地圖</li>
                        <li><span class="tag">DistrictPointChart</span> 行政區點位地圖</li>
                    </ul>
                </section>

                <!-- 管理後台 -->
                <section v-show="activeSection === 'admin'">
                    <h2>管理後台</h2>

                    <h3>登入</h3>
                    <p>點擊前台右上角 <span class="icon-inline">admin_panel_settings</span> 圖示進入後台，輸入管理員帳號與密碼登入。登入狀態會保存在瀏覽器，關閉視窗後需重新登入。</p>

                    <h3>組件列表</h3>
                    <p>登入後顯示所有組件的清單，包含：</p>
                    <ul>
                        <li>組件 ID、名稱、圖表類型</li>
                        <li>所屬儀表板</li>
                        <li>是否已有圖表資料（chartData）及歷史資料（historyData）</li>
                    </ul>
                    <p>可使用搜尋框或儀表板篩選快速找到目標組件。</p>

                    <h3>CSV 上傳</h3>
                    <p>點擊組件列表中的「CSV 上傳」按鈕，進入資料更新頁面：</p>
                    <ol>
                        <li>選擇存入位置（圖表資料 / 歷史資料 / 自動偵測）</li>
                        <li>拖放或點選 CSV 檔案</li>
                        <li>系統自動預覽資料並顯示相容圖表類型</li>
                        <li>確認無誤後點擊「確認上傳」</li>
                    </ol>
                    <p class="tip">原始檔案會自動備份至 <code>_backups/</code> 資料夾，上傳前可放心操作。</p>

                    <h3>編輯組件資料</h3>
                    <p>點擊「編輯資料」標籤，可修改組件的名稱、資料來源、簡短說明、組件說明及使用情境，儲存後立即反映在前台。</p>
                </section>

                <!-- CSV 格式 -->
                <section v-show="activeSection === 'csv'">
                    <h2>CSV 上傳格式</h2>
                    <p>系統支援兩種 CSV 格式，會根據第一欄的內容自動判斷類型。</p>

                    <h3>時間序列格式（historyData）</h3>
                    <p>第一欄為日期欄（欄名為 <code>date</code>、<code>日期</code>、<code>time</code>、<code>時間</code>、<code>month</code> 等），其餘欄為各系列名稱。</p>
                    <pre>date,蔬菜,水果,根莖類
2024-01,1250,830,520
2024-02,1180,920,480
2024-03,1320,750,610</pre>
                    <p class="tip">適用圖表：TimelineSeparateChart、TimelineStackedChart</p>

                    <h3>類別比較格式（chartData）</h3>
                    <p><strong>單系列</strong>：第一欄為類別名稱，第二欄為數值。</p>
                    <pre>category,value
蔬菜,1250
水果,830
根莖類,520</pre>

                    <p><strong>多系列</strong>：第一欄為類別，其餘欄各為一個系列。</p>
                    <pre>部門,Q1,Q2,Q3,Q4
業務部,320,410,380,450
工程部,280,290,310,330
行銷部,150,180,200,175</pre>
                    <p class="tip">適用圖表：BarChart、ColumnChart、DonutChart、RadarChart 等</p>

                    <h3>注意事項</h3>
                    <ul>
                        <li>僅支援 <code>.csv</code> 格式，編碼請使用 UTF-8</li>
                        <li>至少需要兩欄資料</li>
                        <li>數值欄若有空值，會自動補 0</li>
                        <li>日期格式支援 <code>YYYY-MM</code>、<code>YYYY-MM-DD</code> 等常見格式</li>
                    </ul>
                </section>

                <!-- 圖表類型 -->
                <section v-show="activeSection === 'charts'">
                    <h2>圖表類型說明</h2>
                    <p>系統內建 17 種圖表元件，分為時間序列與類別比較兩大類：</p>

                    <h3>時間序列類（需日期欄）</h3>
                    <div class="chart-table">
                        <div class="ct-row header">
                            <span>元件名稱</span><span>說明</span>
                        </div>
                        <div class="ct-row"><span class="tag">TimelineSeparateChart</span><span>多系列折線圖，各系列獨立顯示趨勢</span></div>
                        <div class="ct-row"><span class="tag">TimelineStackedChart</span><span>堆疊面積圖，顯示各系列趨勢與加總變化</span></div>
                    </div>

                    <h3>類別比較類（不需日期欄）</h3>
                    <div class="chart-table">
                        <div class="ct-row header">
                            <span>元件名稱</span><span>說明</span>
                        </div>
                        <div class="ct-row"><span class="tag">BarChart</span><span>橫條圖，適合類別名稱較長時比較數值</span></div>
                        <div class="ct-row"><span class="tag">BarPercentChart</span><span>百分比橫條圖，顯示各項目在整體中的佔比</span></div>
                        <div class="ct-row"><span class="tag">ColumnChart</span><span>直條圖，適合類別數量較少時的數值比較</span></div>
                        <div class="ct-row"><span class="tag">SimpleColChart</span><span>簡易直條圖，單系列資料適用</span></div>
                        <div class="ct-row"><span class="tag">DonutChart</span><span>甜甜圈圖，顯示各類別佔整體的比例</span></div>
                        <div class="ct-row"><span class="tag">PolarChart</span><span>極座標圖，以扇形面積表示各類別數值</span></div>
                        <div class="ct-row"><span class="tag">RadarChart</span><span>雷達圖，多維度指標對比分析</span></div>
                        <div class="ct-row"><span class="tag">HeatmapChart</span><span>熱度圖，以顏色深淺呈現二維矩陣數值</span></div>
                        <div class="ct-row"><span class="tag">PyramidChart</span><span>金字塔圖，比較兩組資料的分布（如年齡分布）</span></div>
                        <div class="ct-row"><span class="tag">TreemapChart</span><span>樹狀圖，以矩形大小顯示各類別比重</span></div>
                        <div class="ct-row"><span class="tag">GuageChart</span><span>儀錶板圖，顯示單一數值的達成率或進度</span></div>
                    </div>

                    <h3>地圖類</h3>
                    <div class="chart-table">
                        <div class="ct-row header">
                            <span>元件名稱</span><span>說明</span>
                        </div>
                        <div class="ct-row"><span class="tag">MapLegend</span><span>地圖圖例，搭配地圖顯示分層色彩說明</span></div>
                        <div class="ct-row"><span class="tag">DistrictChart</span><span>行政區統計地圖，以顏色深淺標示各區數值</span></div>
                        <div class="ct-row"><span class="tag">DistrictPointChart</span><span>行政區點位地圖，在地圖上標示地點位置</span></div>
                        <div class="ct-row"><span class="tag">MetroChart</span><span>捷運路線圖，顯示各站點資料（如人流量）</span></div>
                    </div>
                </section>

            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.help-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-background, #1a1c1e);
    color: var(--color-text, #ddd);
    overflow: hidden;
}

.help-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--color-border, #3a3c3e);
    flex-shrink: 0;

    h1 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #fff; }
}

.btn-back {
    background: none;
    border: 1px solid #444;
    color: #aaa;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    font-size: 0.875rem;
    &:hover { border-color: #aaa; color: #fff; }
}

.help-body {
    flex: 1;
    min-height: 0;
    display: flex;
}

.help-nav {
    width: 160px;
    flex-shrink: 0;
    padding: 1.25rem 0.75rem;
    border-right: 1px solid var(--color-border, #3a3c3e);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.nav-item {
    background: none;
    border: none;
    color: #888;
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.15s, color 0.15s;

    &:hover { background: #2a2c2e; color: #ccc; }
    &.active { background: #1e2a40; color: #7ab3ff; font-weight: 500; }
}

.help-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1.75rem 2.5rem;

    section {
        max-width: 760px;
    }

    h2 {
        color: #fff;
        font-size: 1.15rem;
        margin: 0 0 1.25rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #3a3c3e;
    }

    h3 {
        color: #ddd;
        font-size: 0.95rem;
        margin: 1.25rem 0 0.5rem;
    }

    p { color: #aaa; font-size: 0.875rem; line-height: 1.7; margin: 0 0 0.75rem; }

    ul, ol {
        color: #aaa;
        font-size: 0.875rem;
        line-height: 1.9;
        padding-left: 1.25rem;
        margin: 0 0 0.75rem;
    }

    pre {
        background: #1a1c1e;
        border: 1px solid #3a3c3e;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        font-size: 0.8rem;
        color: #aad4ff;
        margin: 0.5rem 0 0.75rem;
        overflow-x: auto;
    }

    code {
        background: #2a2c30;
        border-radius: 3px;
        padding: 0.1rem 0.4rem;
        font-size: 0.8rem;
        color: #aad4ff;
    }
}

.tip {
    background: #1e2a1e;
    border-left: 3px solid #4ade80;
    border-radius: 0 6px 6px 0;
    padding: 0.5rem 0.75rem !important;
    color: #7aba88 !important;
    margin-top: 0.5rem !important;
}

.tag {
    background: #2d3e5a;
    color: #7ab3ff;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    font-size: 0.78rem;
    font-family: monospace;
    white-space: nowrap;
}

.icon-inline {
    font-family: 'Material Icons';
    font-size: 1rem;
    vertical-align: middle;
    color: #7ab3ff;
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 1rem 0;
}

.info-card {
    background: #1f2123;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 1rem 1.25rem;

    .card-icon {
        font-family: 'Material Icons';
        font-size: 1.75rem;
        color: #5b8cfa;
        margin-bottom: 0.5rem;
    }

    h3 { color: #ddd; font-size: 0.9rem; margin: 0 0 0.4rem; }
    p { font-size: 0.8rem; color: #888; margin: 0; }
}

.chart-table {
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    overflow: hidden;
    margin: 0.5rem 0 1rem;
}

.ct-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    border-bottom: 1px solid #2a2c2e;
    align-items: center;
    gap: 1rem;
    color: #aaa;

    &:last-child { border-bottom: none; }
    &.header { background: #282a2c; color: #777; font-size: 0.75rem; }
}
</style>
