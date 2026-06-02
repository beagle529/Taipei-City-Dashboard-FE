<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { CHART_TYPE_DATA } from "../components/admin/chartTypeData.js";

const router = useRouter();
const activeSection = ref("overview");

const CHART_GROUPS = [
    {
        label: "時間序列類（需日期欄）",
        charts: [
            { name: "TimelineSeparateChart", desc: "多系列折線圖，各系列獨立顯示趨勢", scene: "各部門交易量月趨勢比較" },
            { name: "TimelineStackedChart",  desc: "堆疊面積圖，顯示各系列趨勢與加總變化", scene: "各品項總交易額的組成變化" },
        ],
    },
    {
        label: "類別比較類",
        charts: [
            { name: "BarChart",          desc: "橫條圖，水平排列便於閱讀長名稱",       scene: "各品項名稱較長時的銷量排比" },
            { name: "BarPercentChart",   desc: "百分比橫條圖，顯示各項目佔比",         scene: "各部門費用佔總預算比例" },
            { name: "ColumnChart",       desc: "直條圖，類別數量少時的數值比較",       scene: "各季度交易量比較" },
            { name: "SimpleColChart",    desc: "簡易直條圖，單系列資料",               scene: "每月出貨量單一指標" },
            { name: "DonutChart",        desc: "甜甜圈圖，顯示各類別佔比",             scene: "各品類交易佔整體比例" },
            { name: "PolarChart",        desc: "極座標圖，以扇形面積表示數值",         scene: "多維度指標的整體輪廓" },
            { name: "RadarChart",        desc: "雷達圖，多維度指標對比",               scene: "各市場綜合評分比較" },
            { name: "HeatmapChart",      desc: "熱度圖，二維矩陣以顏色呈現數值",       scene: "各品類各月份的銷量熱度" },
            { name: "PyramidChart",      desc: "金字塔圖，比較兩組資料分布",           scene: "男女員工年齡分布比較" },
            { name: "TreemapChart",      desc: "樹狀圖，以矩形大小顯示比重",           scene: "各品項銷售金額的比重分布" },
            { name: "GuageChart",        desc: "儀錶板圖，顯示達成率或進度",           scene: "月度目標達成率" },
            { name: "StackedColumnChart",desc: "堆疊直條圖，多系列疊加呈現組成與總量", scene: "各品類每月交易量的組成堆疊" },
            { name: "DataTable",         desc: "資料表格，多欄位逐筆記錄，支援排序",   scene: "詳細交易紀錄或商品清單瀏覽" },
        ],
    },
    {
        label: "複合分析類",
        charts: [
            { name: "ScatterChart",     desc: "散佈圖，呈現兩變數間的相關性與分布",     scene: "交易量與均價的關聯性分析" },
            { name: "LineColumnChart",  desc: "折線柱狀混合圖，同時呈現量與趨勢",       scene: "月成交量（柱）搭配均價走勢（線）" },
            { name: "CandlestickChart", desc: "K 線圖，呈現開高低收四種價格",           scene: "蔬果每日價格的漲跌分析" },
        ],
    },
    {
        label: "地圖類",
        note: "地圖類圖表的地理資料需由資訊部另行設定，無法僅透過 CSV 上傳完成，請聯絡系統管理員。",
        charts: [
            { name: "MapLegend",         desc: "分層設色地圖，以顏色深淺標示數值範圍", scene: "需配合地理 JSON 資料" },
            { name: "DistrictChart",     desc: "行政區統計地圖，依區域著色",           scene: "需配合地理 JSON 資料" },
            { name: "DistrictPointChart",desc: "行政區點位地圖，在地圖上標示地點",     scene: "需配合點位座標資料" },
            { name: "MetroChart",        desc: "路線圖，顯示各站點資料",               scene: "需配合路線站點定義" },
        ],
    },
    {
        label: "市場專屬類",
        note: "MarketFloorChart 的 SVG 平面圖與區域座標由資訊部設定，資料格式請參考後台 CSV 上傳說明中的「市場樓層」格式。",
        charts: [
            { name: "MarketFloorChart", desc: "互動式市場樓層平面圖，攤位依甲乙丙等級發光著色，支援成交量、進場數、均價、燈光狀態四項指標", scene: "批發市場各區攤位即時狀態監控" },
        ],
    },
];

const sections = [
    { id: "overview",       label: "系統概覽" },
    { id: "dashboard",      label: "儀表板操作" },
    { id: "mapview",        label: "地圖交叉比對" },
    { id: "market-price",   label: "蔬果即時行情" },
    { id: "admin-login",    label: "後台登入" },
    { id: "admin-comp",     label: "組件管理" },
    { id: "admin-datasource", label: "定期來源設定" },
    { id: "admin-dash",     label: "儀表板管理" },
    { id: "admin-issues",   label: "問題回報管理" },
    { id: "admin-backup",   label: "備份管理" },
    { id: "admin-audit",    label: "登入紀錄" },
    { id: "admin-users",    label: "帳號管理" },
    { id: "csv",            label: "CSV 上傳格式" },
    { id: "charts",         label: "圖表類型說明" },
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
                <div class="nav-group-label">一般操作</div>
                <button v-for="s in sections.slice(0, 4)" :key="s.id"
                    :class="['nav-item', activeSection === s.id ? 'active' : '']"
                    @click="activeSection = s.id">{{ s.label }}</button>

                <div class="nav-group-label" style="margin-top:1rem">管理後台</div>
                <button v-for="s in sections.slice(4)" :key="s.id"
                    :class="['nav-item', activeSection === s.id ? 'active' : '']"
                    @click="activeSection = s.id">{{ s.label }}</button>
            </nav>

            <!-- Content -->
            <div class="help-content">

                <!-- ── 系統概覽 ── -->
                <section v-show="activeSection === 'overview'">
                    <h2>系統概覽 <span class="version-badge">v2026051401</span></h2>
                    <p>本系統為<strong>台北農產運銷股份有限公司</strong>內部治理儀表板，提供各部門的業務數據視覺化瀏覽、地圖空間分析，以及後台資料維護功能。主要分為三個區塊：</p>

                    <div class="card-grid">
                        <div class="info-card">
                            <div class="card-icon">dashboard</div>
                            <h3>儀表板總覽</h3>
                            <p>以卡片方式展示各組件的圖表資料，支援多個儀表板頁面切換，可依業務主題分類瀏覽。</p>
                        </div>
                        <div class="info-card">
                            <div class="card-icon">map</div>
                            <h3>地圖交叉比對</h3>
                            <p>將具備地理資訊的組件疊加在地圖上，進行空間資料比對分析。</p>
                        </div>
                        <div class="info-card">
                            <div class="card-icon">admin_panel_settings</div>
                            <h3>管理後台</h3>
                            <p>管理員可上傳 CSV 更新圖表資料、維護儀表板設定、查看問題回報及備份記錄。</p>
                        </div>
                    </div>

                    <h3>系統存取方式</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>
                                <strong>儀表板前台</strong><br>
                                <span>直接開啟系統網址，即可進入儀表板瀏覽頁面，無需登入。</span>
                            </div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>
                                <strong>管理後台</strong><br>
                                <span>點擊右上角 <span class="icon-inline">admin_panel_settings</span> 圖示，或於導覽列選擇「管理後台（新分頁）」，以管理員帳號登入後操作。</span>
                            </div>
                        </div>
                    </div>

                    <div class="tip">目前儀表板資料為展示用途，如需更新實際業務數據，請由各部門負責人聯絡資訊部管理員進行 CSV 上傳。</div>
                </section>

                <!-- ── 儀表板操作 ── -->
                <section v-show="activeSection === 'dashboard'">
                    <h2>儀表板操作</h2>

                    <h3>切換儀表板</h3>
                    <p>點擊左側側欄上方的儀表板名稱，即可切換不同的儀表板頁面。每個儀表板包含一組相關的資料組件，例如「交易數據概覽」、「物流配送分析」等。</p>

                    <h3>搜尋組件</h3>
                    <p>左側側欄下方提供關鍵字搜尋，輸入組件名稱的部分文字，即可快速定位目標組件並跳至對應卡片。</p>

                    <h3>組件卡片功能</h3>
                    <p>每個卡片代表一個資料組件。卡片右上角提供以下操作圖示：</p>
                    <div class="feature-table">
                        <div class="ft-row header"><span>圖示</span><span>功能</span><span>說明</span></div>
                        <div class="ft-row">
                            <span class="icon-inline">bar_chart</span>
                            <span>切換圖表</span>
                            <span>部分組件支援多種圖表類型，點擊後選擇要顯示的圖表樣式</span>
                        </div>
                        <div class="ft-row">
                            <span class="icon-inline">history</span>
                            <span>歷史趨勢</span>
                            <span>若組件有歷史資料，可查看時間軸趨勢圖</span>
                        </div>
                        <div class="ft-row">
                            <span class="icon-inline">info</span>
                            <span>組件說明</span>
                            <span>顯示資料說明、使用情境、資料來源與更新頻率</span>
                        </div>
                        <div class="ft-row">
                            <span class="icon-inline">download</span>
                            <span>下載資料</span>
                            <span>將組件的原始 JSON 資料下載至本機</span>
                        </div>
                        <div class="ft-row">
                            <span class="icon-inline">flag</span>
                            <span>回報問題</span>
                            <span>若發現資料異常或有建議，填寫問題回報表單送給管理員</span>
                        </div>
                    </div>

                    <h3>新增組件至儀表板</h3>
                    <ol>
                        <li>在儀表板頁面點擊右下角「<strong>＋ 新增組件</strong>」按鈕</li>
                        <li>使用搜尋框或資料來源篩選找到目標組件</li>
                        <li>勾選要加入的組件（可多選）</li>
                        <li>點擊「確認新增」完成</li>
                    </ol>
                    <div class="warning">新增組件為前台個人化設定，儲存在瀏覽器本機，清除瀏覽器快取後會還原為預設配置。</div>

                    <h3>收藏儀表板</h3>
                    <p>點擊側欄儀表板名稱旁的星形圖示，可將儀表板加入「收藏」，方便快速存取常用頁面。</p>

                    <h3>回報組件問題</h3>
                    <ol>
                        <li>點擊組件卡片右上角旗幟圖示 <span class="icon-inline">flag</span></li>
                        <li>在彈窗中選擇問題類型（資料有誤、系統問題等）</li>
                        <li>填寫問題說明及您的姓名</li>
                        <li>點擊「送出回報」，管理員將在後台收到通知</li>
                    </ol>
                </section>

                <!-- ── 蔬果即時行情 ── -->
                <section v-show="activeSection === 'market-price'">
                    <h2>蔬果即時行情</h2>
                    <p>「蔬果即時行情」組件（ID：208）自動抓取<strong>台北農產運銷股份有限公司官網</strong>的當日批發市場交易行情，即時顯示品名、品種、上價、中價、下價等資訊，並提供概況統計與資料下載功能。</p>

                    <div class="tip">當日行情為第一市場 7 時統計數據，僅供參考。單位：公噸、元/公斤</div>

                    <h3>功能說明</h3>
                    <div class="feature-table">
                        <div class="ft-row header"><span>功能</span><span>操作方式</span><span>說明</span></div>
                        <div class="ft-row">
                            <span>行情表格</span>
                            <span>進入「交易數據概覽」儀表板即自動載入</span>
                            <span>顯示品名、品種、上價、中價、下價（元/公斤）</span>
                        </div>
                        <div class="ft-row">
                            <span>行情概況</span>
                            <span>組件上方統計區塊</span>
                            <span>當日與昨日蔬菜／水果的交易量（噸）與平均價（元）</span>
                        </div>
                        <div class="ft-row">
                            <span>收折概況</span>
                            <span>點擊 ▲ 按鈕</span>
                            <span>可收合或展開上方的概況統計區塊，讓表格有更多空間</span>
                        </div>
                        <div class="ft-row">
                            <span>關鍵字搜尋</span>
                            <span>在搜尋框輸入品名或品種</span>
                            <span>即時過濾表格內容，右側顯示筆數（n / 總數）</span>
                        </div>
                        <div class="ft-row">
                            <span>立即更新</span>
                            <span>點擊右上角「立即更新」按鈕</span>
                            <span>強制重新抓取最新行情，略過 5 分鐘快取</span>
                        </div>
                        <div class="ft-row">
                            <span>自動刷新</span>
                            <span>無需操作</span>
                            <span>組件每 5 分鐘自動向後端請求最新資料</span>
                        </div>
                        <div class="ft-row">
                            <span>休市顯示</span>
                            <span>休市日自動偵測</span>
                            <span>市場休市時顯示「休市」徽章與說明，並提供歷史行情查詢連結</span>
                        </div>
                    </div>

                    <h3>下載行情資料</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>確認行情表格已正常顯示資料（非載入中狀態）</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>點擊組件卡片底部的「<strong>組件資訊</strong>」按鈕</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>在彈出視窗點擊右上角「<strong>下載資料</strong>」圖示</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">4</span>
                            <div>輸入檔名，選擇格式：<br>
                                <span class="tag">JSON</span> 完整資料結構，適合程式使用<br>
                                <span class="tag">CSV</span> 含欄位名稱（品名、品種、上價、中價、下價），UTF-8 編碼
                            </div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">5</span>
                            <div>點擊「下載 JSON」或「下載 CSV」完成下載</div>
                        </div>
                    </div>
                    <div class="warning">CSV 以 UTF-8 編碼儲存。以 Excel 開啟若出現亂碼，請使用「資料 → 從文字/CSV 匯入」並選擇 UTF-8，或改以 Google 試算表開啟。</div>

                    <h3>行情顏色說明</h3>
                    <div class="feature-table">
                        <div class="ft-row header"><span>顏色</span><span>欄位</span><span>說明</span></div>
                        <div class="ft-row">
                            <span style="color:#f87171;font-weight:700;">紅色</span>
                            <span>上價</span>
                            <span>當日最高成交價</span>
                        </div>
                        <div class="ft-row">
                            <span style="color:#fbbf24;font-weight:700;">黃色</span>
                            <span>中價</span>
                            <span>當日加權平均成交價</span>
                        </div>
                        <div class="ft-row">
                            <span style="color:#4ade80;font-weight:700;">綠色</span>
                            <span>下價</span>
                            <span>當日最低成交價</span>
                        </div>
                    </div>

                    <h3>常見問題</h3>
                    <div class="feature-table">
                        <div class="ft-row header"><span>問題</span><span>解決方式</span></div>
                        <div class="ft-row">
                            <span>組件顯示「連線失敗」</span>
                            <span>確認後端服務是否正常，或點擊「立即更新」重試</span>
                        </div>
                        <div class="ft-row">
                            <span>行情資料顯示「舊」標記</span>
                            <span>系統使用快取中的舊資料，點擊「立即更新」取得最新行情</span>
                        </div>
                        <div class="ft-row">
                            <span>搜尋後無結果</span>
                            <span>確認關鍵字是否正確，嘗試輸入品名或品種的部分文字</span>
                        </div>
                        <div class="ft-row">
                            <span>下載 CSV 看不到資料</span>
                            <span>請等行情表格完全載入後再點擊下載</span>
                        </div>
                    </div>
                </section>

                <!-- ── 地圖交叉比對 ── -->
                <section v-show="activeSection === 'mapview'">
                    <h2>地圖交叉比對</h2>
                    <p>地圖視圖可將多個具地理資訊的組件疊加於同一地圖，進行空間資料的視覺化比對。</p>

                    <h3>進入地圖視圖</h3>
                    <p>點擊左側側欄最下方的地圖圖示，或從導覽列選擇「地圖交叉比對」進入。</p>

                    <h3>新增地圖圖層</h3>
                    <ol>
                        <li>進入地圖視圖後，左側會顯示所有支援地圖的組件清單</li>
                        <li>點擊組件名稱旁的「<strong>＋</strong>」按鈕，將其加入地圖</li>
                        <li>最多可同時疊加多個圖層進行比對</li>
                    </ol>

                    <h3>圖層管理</h3>
                    <div class="feature-table">
                        <div class="ft-row header"><span>操作</span><span>方法</span></div>
                        <div class="ft-row">
                            <span>顯示／隱藏圖層</span>
                            <span>點擊右側圖層面板的眼睛圖示 <span class="icon-inline">visibility</span></span>
                        </div>
                        <div class="ft-row">
                            <span>移除圖層</span>
                            <span>點擊圖層面板的「×」按鈕</span>
                        </div>
                        <div class="ft-row">
                            <span>調整圖層順序</span>
                            <span>拖曳圖層項目可調整疊加順序</span>
                        </div>
                    </div>

                    <h3>支援的圖表類型</h3>
                    <p>地圖視圖僅顯示含地理資訊的組件，支援以下類型：</p>
                    <ul>
                        <li><span class="tag">MapLegend</span> 分層設色地圖，以顏色深淺標示數值範圍</li>
                        <li><span class="tag">DistrictChart</span> 行政區統計地圖，依區域著色</li>
                        <li><span class="tag">DistrictPointChart</span> 行政區點位地圖，在地圖上標示地點</li>
                    </ul>
                    <div class="tip">若組件在地圖清單中不可見，表示該組件沒有設定地理資訊，無法加入地圖圖層。</div>
                </section>

                <!-- ── 後台登入 ── -->
                <section v-show="activeSection === 'admin-login'">
                    <h2>後台登入</h2>
                    <p>管理後台需使用管理員帳號登入，一般使用者無法存取。</p>

                    <h3>進入後台</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>點擊前台右上角 <span class="icon-inline">admin_panel_settings</span> 圖示，或從導覽列選擇「管理後台（新分頁）」</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>在登入頁面輸入<strong>帳號</strong>與<strong>密碼</strong>，點擊「登入」</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>登入成功後，頁面上方會顯示目前登入的帳號名稱。<strong>最高管理員</strong>帳號會另外顯示「最高管理員」紫色標籤</div>
                        </div>
                    </div>

                    <h3>權限說明</h3>
                    <div class="feature-table">
                        <div class="ft-row perm-row header"><span>功能</span><span>一般管理員</span><span>最高管理員</span></div>
                        <div class="ft-row perm-row"><span>組件管理（瀏覽、上傳、編輯）</span><span class="badge-yes">✓</span><span class="badge-yes">✓</span></div>
                        <div class="ft-row perm-row"><span>儀表板管理（編輯）</span><span class="badge-yes">✓</span><span class="badge-yes">✓</span></div>
                        <div class="ft-row perm-row"><span>儀表板管理（新增、刪除）</span><span class="badge-no">✗</span><span class="badge-yes">✓</span></div>
                        <div class="ft-row perm-row"><span>問題回報管理</span><span class="badge-yes">✓</span><span class="badge-yes">✓</span></div>
                        <div class="ft-row perm-row"><span>備份管理（查看）</span><span class="badge-yes">✓</span><span class="badge-yes">✓</span></div>
                        <div class="ft-row perm-row"><span>備份管理（立即備份）</span><span class="badge-no">✗</span><span class="badge-yes">✓</span></div>
                        <div class="ft-row perm-row"><span>登入紀錄</span><span class="badge-yes">✓</span><span class="badge-yes">✓</span></div>
                        <div class="ft-row perm-row"><span>帳號管理</span><span class="badge-no">✗</span><span class="badge-yes">✓</span></div>
                    </div>

                    <h3>登出</h3>
                    <p>點擊右上角「<strong>登出</strong>」按鈕即可結束工作階段。登入狀態存放於瀏覽器，關閉視窗後重新開啟時，系統會自動驗證 Token 是否有效，過期則需重新登入。</p>

                    <div class="warning">請勿將帳號密碼分享給他人。若懷疑帳號遭盜用，請立即聯絡最高管理員更改密碼。</div>
                </section>

                <!-- ── 組件管理 ── -->
                <section v-show="activeSection === 'admin-comp'">
                    <h2>組件管理</h2>
                    <p>組件管理是後台的主要功能，可查看所有組件的狀態、上傳或更新資料，以及修改組件的描述資訊。</p>

                    <h3>組件列表</h3>
                    <p>登入後預設顯示組件列表，每列包含：</p>
                    <ul>
                        <li><strong>ID</strong>：組件唯一識別碼</li>
                        <li><strong>組件名稱</strong>：前台顯示的名稱</li>
                        <li><strong>圖表類型</strong>：組件使用的圖表樣式</li>
                        <li><strong>所屬儀表板</strong>：該組件出現在哪些儀表板</li>
                        <li><strong>資料狀態</strong>：是否已有圖表資料（chartData）及歷史資料（historyData）</li>
                    </ul>
                    <p>可使用上方搜尋框依名稱搜尋，或透過儀表板下拉選單篩選特定儀表板的組件。</p>

                    <h3>上傳 CSV 資料</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>在組件列表找到目標組件，點擊右側「<strong>管理</strong>」按鈕</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>進入組件頁面後，預設顯示「<strong>CSV 上傳</strong>」標籤</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>選擇存入位置：<br>
                                <span class="tag">自動偵測</span> 系統根據欄位格式自動判斷類型（建議使用）<br>
                                <span class="tag">圖表資料</span> 強制存為 chartData（類別比較圖）<br>
                                <span class="tag">歷史資料</span> 強制存為 historyData（時間序列圖）
                            </div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">4</span>
                            <div>將 CSV 檔案<strong>拖放</strong>至上傳區，或點擊選取檔案</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">5</span>
                            <div>系統自動預覽資料內容，並顯示與此格式相容的圖表類型</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">6</span>
                            <div>確認資料無誤後，點擊「<strong>確認上傳</strong>」完成更新</div>
                        </div>
                    </div>
                    <div class="tip">每次上傳前，系統會自動將舊檔案備份至 <code>_backups/</code> 資料夾，操作失誤時可請管理員從備份還原。</div>

                    <h3>編輯組件描述資訊</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>進入組件頁面後，點擊上方「<strong>編輯資料</strong>」標籤</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>可修改以下欄位：
                                <ul style="margin-top:0.4rem">
                                    <li><strong>名稱</strong>：組件在前台顯示的標題</li>
                                    <li><strong>資料來源</strong>：負責提供資料的部門</li>
                                    <li><strong>簡短說明</strong>：顯示在組件卡片上的一行描述</li>
                                    <li><strong>組件說明</strong>：詳細的資料內容說明</li>
                                    <li><strong>使用情境</strong>：此組件適合用於哪些分析場景</li>
                                </ul>
                            </div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>填寫完成後點擊「<strong>儲存</strong>」，變更立即反映至前台</div>
                        </div>
                    </div>
                </section>

                <!-- ── 定期來源設定 ── -->
                <section v-show="activeSection === 'admin-datasource'">
                    <h2>定期來源設定</h2>
                    <p>每個組件除了手動上傳 CSV 之外，還可以設定一個<strong>外部資料 URL</strong>，後台排程器將依照指定頻率自動向該網址發出請求，抓取最新的 CSV 或 JSON 資料並更新圖表，無需人工介入。</p>

                    <h3>運作流程</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>管理員在「定期來源」分頁設定外部 URL 與更新頻率</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>後台排程器依設定時間自動對該 URL 發出 HTTP GET 請求</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>系統自動偵測格式（CSV 或 JSON），解析後覆蓋更新 <code>chartData/&lt;id&gt;.json</code></div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">4</span>
                            <div>每次覆蓋前自動備份舊資料至 <code>chartData/_backups/</code>，可隨時還原</div>
                        </div>
                    </div>

                    <h3>如何設定</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>在組件列表找到目標組件，點擊「<strong>管理</strong>」</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>點擊上方「<strong>定期來源</strong>」分頁（第三個標籤）</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>在「資料來源 URL」欄位填入資料的直接下載網址</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">4</span>
                            <div>選擇「更新頻率」（每小時 / 每日 / 每週 / 手動觸發）</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">5</span>
                            <div>點擊「<strong>儲存設定</strong>」後，可點擊「<strong>立即抓取</strong>」驗證 URL 是否正確</div>
                        </div>
                    </div>
                    <div class="tip">設定後可隨時點擊「立即抓取」手動觸發，不受排程時間限制，適合測試或緊急更新。</div>

                    <h3>排程時間說明</h3>
                    <div class="feature-table">
                        <div class="ft-row header"><span>頻率選項</span><span>執行時間</span><span>適合場景</span></div>
                        <div class="ft-row">
                            <span><span class="tag">每小時</span></span>
                            <span>每小時第 5 分（00:05、01:05…）</span>
                            <span>即時性要求高的資料，如當日行情、進場人數</span>
                        </div>
                        <div class="ft-row">
                            <span><span class="tag">每日</span></span>
                            <span>每天 06:30（台北時間）</span>
                            <span>每日更新一次的日報資料</span>
                        </div>
                        <div class="ft-row">
                            <span><span class="tag">每週</span></span>
                            <span>每週一 06:30（台北時間）</span>
                            <span>週報或不頻繁更新的統計資料</span>
                        </div>
                        <div class="ft-row">
                            <span><span class="tag">手動觸發</span></span>
                            <span>不設排程，僅可點「立即抓取」</span>
                            <span>更新時機不固定，需人工判斷時機</span>
                        </div>
                    </div>

                    <h3>支援的資料來源平台</h3>
                    <p>任何能提供<strong>公開可存取 HTTP / HTTPS 下載網址</strong>的服務均可使用，支援 CSV 與 JSON 兩種格式，系統自動偵測。以下為各平台的設定方式：</p>

                    <h3 style="margin-top:1.25rem">① Google 試算表（最推薦）</h3>
                    <p>業務人員在 Google Sheets 維護資料，儲存後自動生效，不需重新上傳。</p>
                    <div class="step-list">
                        <div class="step-item"><span class="step-num">1</span><div>開啟 Google Sheets → 上方選單「<strong>檔案 → 共用 → 發佈到網路</strong>」</div></div>
                        <div class="step-item"><span class="step-num">2</span><div>選擇要發佈的工作表，格式選「<strong>逗號分隔值（.csv）</strong>」</div></div>
                        <div class="step-item"><span class="step-num">3</span><div>點「<strong>發佈</strong>」→ 複製產生的網址，貼到「資料來源 URL」欄位</div></div>
                    </div>
                    <pre>https://docs.google.com/spreadsheets/d/XXXXXXXX/export?format=csv&amp;gid=0</pre>
                    <div class="tip">推薦搭配「每日」排程。業務人員只需維護 Google Sheets，不需接觸後台，次日早上儀表板自動更新。</div>

                    <h3>② OneDrive / SharePoint（企業環境）</h3>
                    <p>使用 Microsoft 365 的環境，可透過 OneDrive 分享連結提供直接下載網址。</p>
                    <div class="step-list">
                        <div class="step-item"><span class="step-num">1</span><div>上傳 CSV 至 OneDrive → 右鍵「<strong>共用</strong>」→「<strong>複製連結</strong>」（設定為「所有人可檢視」）</div></div>
                        <div class="step-item"><span class="step-num">2</span><div>將分享連結轉換為直接下載格式（去掉 <code>?e=...</code>，改加 <code>download=1</code>）或洽詢 IT 取得直連 URL</div></div>
                    </div>
                    <pre>https://xxxxx.sharepoint.com/sites/XXXXX/_layouts/15/download.aspx?SourceUrl=XXXXX</pre>

                    <h3>③ Dropbox</h3>
                    <div class="step-list">
                        <div class="step-item"><span class="step-num">1</span><div>上傳 CSV 至 Dropbox → 點「<strong>分享</strong>」→「<strong>複製連結</strong>」</div></div>
                        <div class="step-item"><span class="step-num">2</span><div>將連結尾端的 <code>?dl=0</code> 改為 <code>?dl=1</code>（強制直接下載）</div></div>
                    </div>
                    <pre>https://www.dropbox.com/s/XXXXXXXX/data.csv?dl=1</pre>

                    <h3>④ GitHub（技術團隊）</h3>
                    <p>CSV 存放於 GitHub 倉庫，每次 <code>git push</code> 後排程器下次抓取即可取得新版本。</p>
                    <pre>https://raw.githubusercontent.com/組織名/倉庫名/main/data/report.csv</pre>
                    <div class="warning">私有倉庫需在 URL 附加存取 Token，請注意 Token 到期問題，建議改用公開倉庫或其他平台。</div>

                    <h3>⑤ 政府開放資料平台</h3>
                    <p>台北市資料大平台（data.taipei）或政府資料開放平台（data.gov.tw）提供穩定的資料集下載 URL，可直接貼入使用。</p>
                    <pre>https://data.taipei/api/v1/dataset/XXXXXXXX?scope=resourceAquire
https://data.gov.tw/api/datasets/XXXXXXXX/csv</pre>

                    <h3>⑥ 內部伺服器 / 本機網路</h3>
                    <p>若組織內部有 Web 服務（Nginx、IIS、Python 靜態伺服器等），只要後台主機能連到對方即可，不需對外公開。</p>
                    <pre>http://192.168.1.100:8080/exports/daily_report.csv</pre>
                    <div class="tip">後台伺服器與資料伺服器在同一內網即可，適合不對外公開但需定期更新的業務數據。</div>

                    <h3>各平台適用性比較</h3>
                    <div class="feature-table">
                        <div class="ft-row header"><span>平台</span><span>設定難度</span><span>適合對象</span></div>
                        <div class="ft-row">
                            <span>Google 試算表</span>
                            <span>⭐ 最簡單</span>
                            <span>一般業務人員，直接在 Sheets 填寫資料即可</span>
                        </div>
                        <div class="ft-row">
                            <span>OneDrive / SharePoint</span>
                            <span>⭐⭐ 普通</span>
                            <span>使用 Microsoft 365 的企業，習慣以 Excel 維護資料</span>
                        </div>
                        <div class="ft-row">
                            <span>Dropbox</span>
                            <span>⭐⭐ 普通</span>
                            <span>個人或小型團隊，上傳後修改連結參數即可</span>
                        </div>
                        <div class="ft-row">
                            <span>GitHub</span>
                            <span>⭐⭐⭐ 需技術背景</span>
                            <span>有 Git 工作流程的技術團隊，版本控管需求高</span>
                        </div>
                        <div class="ft-row">
                            <span>政府開放資料</span>
                            <span>⭐ 最簡單</span>
                            <span>直接接官方穩定資料集，貼上 URL 即完成</span>
                        </div>
                        <div class="ft-row">
                            <span>內部伺服器</span>
                            <span>⭐⭐⭐ 需 IT 協助</span>
                            <span>不對外公開的業務資料，IT 部門建置靜態服務</span>
                        </div>
                    </div>

                    <h3>常見問題</h3>
                    <div class="feature-table">
                        <div class="ft-row header"><span>問題</span><span>解決方式</span></div>
                        <div class="ft-row">
                            <span>「立即抓取」顯示連線失敗</span>
                            <span>確認 URL 是否可在瀏覽器直接開啟下載，URL 需為直接下載連結而非網頁頁面</span>
                        </div>
                        <div class="ft-row">
                            <span>「立即抓取」顯示連線逾時</span>
                            <span>後台伺服器無法連到目標 URL，確認網路環境或改用內網 IP</span>
                        </div>
                        <div class="ft-row">
                            <span>「立即抓取」顯示 CSV 解析失敗</span>
                            <span>確認檔案為 UTF-8 編碼，且格式符合系統規範（參見「CSV 上傳格式」章節）</span>
                        </div>
                        <div class="ft-row">
                            <span>排程設定後圖表未更新</span>
                            <span>排程需後台服務重啟後生效，或改用「立即抓取」手動觸發，重啟前排程不會執行</span>
                        </div>
                        <div class="ft-row">
                            <span>Google Sheets 抓到舊資料</span>
                            <span>Google 可能有快取延遲，通常在試算表儲存後 1–2 分鐘內生效，可再次點擊「立即抓取」</span>
                        </div>
                    </div>
                </section>

                <!-- ── 儀表板管理 ── -->
                <section v-show="activeSection === 'admin-dash'">
                    <h2>儀表板管理</h2>
                    <p>可建立新儀表板、調整儀表板內的組件配置，以及刪除不需要的儀表板。</p>

                    <h3>新增儀表板（最高管理員）</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>點擊上方導覽列「<strong>儀表板管理</strong>」</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>點擊右上角「<strong>＋ 新增儀表板</strong>」藍色按鈕</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>填寫儀表板名稱，選擇圖示（Material Icons 名稱）</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">4</span>
                            <div>點擊「<strong>建立</strong>」完成，新儀表板會出現在列表中，再進入編輯模式加入組件</div>
                        </div>
                    </div>

                    <h3>編輯儀表板組件</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>在儀表板列表點擊目標儀表板的「<strong>編輯</strong>」按鈕</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>在編輯頁面可看到目前所有組件，以及尚未加入的可用組件列表</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>勾選要加入的組件，或取消勾選移除現有組件</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">4</span>
                            <div>點擊「<strong>儲存</strong>」，前台將立即更新</div>
                        </div>
                    </div>

                    <h3>刪除儀表板（最高管理員）</h3>
                    <p>在儀表板列表點擊「刪除」，系統會要求輸入儀表板名稱進行二次確認，防止誤操作。</p>
                    <div class="warning">刪除儀表板為<strong>不可逆操作</strong>，僅刪除儀表板設定，組件本身的資料不受影響。</div>

                    <h3>顯示／隱藏儀表板</h3>
                    <p>可將儀表板標記為「隱藏」，使其不出現在前台側欄，但資料仍保留，隨時可恢復顯示。</p>
                </section>

                <!-- ── 問題回報管理 ── -->
                <section v-show="activeSection === 'admin-issues'">
                    <h2>問題回報管理</h2>
                    <p>前台使用者透過組件卡片的旗幟圖示回報問題後，管理員可在此頁面統一查看與處理。</p>

                    <h3>查看回報</h3>
                    <p>點擊上方導覽列「<strong>問題回報</strong>」，頁面顯示所有使用者的回報紀錄，欄位包含：</p>
                    <ul>
                        <li><strong>時間</strong>：回報提交的日期與時間</li>
                        <li><strong>組件</strong>：被回報的組件名稱及 ID</li>
                        <li><strong>類型</strong>：問題分類（組件資訊有誤、資料未更新、系統問題、其他建議）</li>
                        <li><strong>問題說明</strong>：使用者填寫的詳細描述</li>
                        <li><strong>回報人</strong>：填寫問題的使用者姓名</li>
                        <li><strong>狀態</strong>：待處理 / 已處理</li>
                    </ul>

                    <h3>篩選回報</h3>
                    <p>頁面右上角提供兩個下拉選單：</p>
                    <ul>
                        <li><strong>狀態篩選</strong>：全部 / 待處理 / 已處理</li>
                        <li><strong>類型篩選</strong>：依問題類型篩選</li>
                    </ul>
                    <p>頁面頂端的橘色標籤顯示目前<strong>待處理件數</strong>。</p>

                    <h3>標記處理狀態</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>找到要處理的回報項目</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>點擊右側「<strong>標記已處理</strong>」按鈕，該列變為半透明表示已完成</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>如需重新開啟，點擊「<strong>重新開啟</strong>」按鈕即可恢復為待處理狀態</div>
                        </div>
                    </div>
                </section>

                <!-- ── 備份管理 ── -->
                <section v-show="activeSection === 'admin-backup'">
                    <h2>備份管理</h2>
                    <p>系統支援組件資料的備份與還原，避免因誤操作造成資料遺失。</p>

                    <h3>自動備份</h3>
                    <p>每次透過後台上傳 CSV 資料時，系統會<strong>自動備份</strong>被覆蓋的舊檔案至備份目錄，不需手動操作。</p>

                    <h3>手動備份（最高管理員）</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>點擊上方導覽列「<strong>備份管理</strong>」</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>點擊「<strong>立即備份</strong>」按鈕，系統會將目前所有組件資料打包備份</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>備份完成後，新記錄會出現在下方的備份紀錄列表</div>
                        </div>
                    </div>

                    <h3>下載備份檔（最高管理員）</h3>
                    <p>在備份紀錄列表中，點擊各備份項目右側的「<strong>下載</strong>」按鈕，可取得壓縮檔案儲存至本機。</p>

                    <h3>查看備份紀錄</h3>
                    <p>一般管理員可查看備份紀錄（時間、操作者、備份大小），但無法執行備份或下載。</p>

                    <div class="tip">建議在每次大量更新資料前，先執行一次手動備份，確保資料安全。</div>
                </section>

                <!-- ── 登入紀錄 ── -->
                <section v-show="activeSection === 'admin-audit'">
                    <h2>登入紀錄</h2>
                    <p>系統會記錄所有管理員的登入嘗試，供稽核追蹤使用。</p>

                    <h3>查看紀錄</h3>
                    <p>點擊上方導覽列「<strong>登入紀錄</strong>」，頁面顯示登入歷史，欄位包含：</p>
                    <div class="feature-table">
                        <div class="ft-row header"><span>欄位</span><span>說明</span></div>
                        <div class="ft-row"><span>時間</span><span>登入嘗試的日期與時間（精確至秒）</span></div>
                        <div class="ft-row"><span>帳號</span><span>嘗試登入的管理員帳號名稱</span></div>
                        <div class="ft-row"><span>來源 IP</span><span>發出請求的 IP 位址</span></div>
                        <div class="ft-row"><span>結果</span><span>登入成功（綠色）或失敗（紅色）</span></div>
                    </div>

                    <h3>異常偵測</h3>
                    <p>若發現以下情形，請立即通知最高管理員：</p>
                    <ul>
                        <li>短時間內多次登入失敗記錄（可能為暴力破解嘗試）</li>
                        <li>非上班時間出現的成功登入紀錄</li>
                        <li>陌生 IP 位址的成功登入</li>
                    </ul>
                </section>

                <!-- ── 帳號管理 ── -->
                <section v-show="activeSection === 'admin-users'">
                    <h2>帳號管理</h2>
                    <p>此功能僅限<strong>最高管理員</strong>使用，可新增、修改或停用其他管理員帳號。</p>

                    <div class="warning">若您沒有看到「帳號管理」選項，表示您的帳號為一般管理員，無此權限。</div>

                    <h3>新增管理員帳號</h3>
                    <div class="step-list">
                        <div class="step-item">
                            <span class="step-num">1</span>
                            <div>點擊上方導覽列「<strong>帳號管理</strong>」（僅最高管理員可見）</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">2</span>
                            <div>點擊「<strong>新增管理員</strong>」按鈕</div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">3</span>
                            <div>填寫：<ul style="margin-top:0.4rem"><li><strong>帳號</strong>（登入用，英數字，建立後不可修改）</li><li><strong>顯示名稱</strong>（後台顯示用）</li><li><strong>密碼</strong>（至少 8 碼）</li></ul></div>
                        </div>
                        <div class="step-item">
                            <span class="step-num">4</span>
                            <div>點擊「<strong>建立</strong>」完成，新帳號即可登入後台</div>
                        </div>
                    </div>

                    <h3>修改密碼</h3>
                    <p>在帳號列表找到目標帳號，點擊「<strong>修改密碼</strong>」，輸入新密碼後儲存。</p>

                    <h3>刪除帳號</h3>
                    <p>點擊帳號列表中的「<strong>刪除</strong>」按鈕，系統會要求確認後執行。</p>
                    <div class="warning">無法刪除最高管理員帳號（<code>admin</code>），以防止系統失去管理員存取權。</div>
                </section>

                <!-- ── CSV 格式 ── -->
                <section v-show="activeSection === 'csv'">
                    <h2>CSV 上傳格式</h2>
                    <p>系統支援兩種 CSV 資料格式，選擇「自動偵測」時會根據第一欄的內容自動判斷。</p>

                    <h3>時間序列格式（historyData）</h3>
                    <p>第一欄必須為日期欄，欄名支援：<code>date</code>、<code>日期</code>、<code>time</code>、<code>時間</code>、<code>month</code>、<code>月份</code> 等。其餘欄為各系列名稱。</p>
                    <pre>date,蔬菜交易量,水果交易量,根莖類交易量
2024-01,1250,830,520
2024-02,1180,920,480
2024-03,1320,750,610
2024-04,1400,810,590</pre>
                    <div class="tip">適用圖表：TimelineSeparateChart（多系列折線）、TimelineStackedChart（堆疊面積）</div>

                    <h3>類別比較格式（chartData）</h3>
                    <p><strong>單系列</strong>：第一欄為類別名稱，第二欄為數值。</p>
                    <pre>category,value
蔬菜,1250
水果,830
根莖類,520
花卉,180</pre>

                    <p><strong>多系列</strong>：第一欄為類別，其餘欄各為一個系列（例如依季度或月份分組）。</p>
                    <pre>部門,第一季,第二季,第三季,第四季
業務部,320,410,380,450
管理部,280,290,310,330
營業部,150,180,200,175
財務部,90,95,100,110</pre>
                    <div class="tip">適用圖表：BarChart、ColumnChart、DonutChart、RadarChart、TreemapChart、StackedColumnChart、DataTable 等</div>

                    <h3>散佈圖格式（ScatterChart）</h3>
                    <p>需提供兩個數值欄作為 X 軸與 Y 軸，可加入第三欄作為分群標籤。上傳後系統自動將欄名帶入「座標軸標題」。</p>
                    <pre>category,平均日交易量(公噸),平均價格(元/公斤)
蔬菜,42.5,28.3
水果,38.2,35.7
根莖類,25.1,18.4
花卉,8.3,62.1</pre>
                    <div class="tip">適用圖表：ScatterChart</div>

                    <h3>K 線圖格式（CandlestickChart）</h3>
                    <p>需提供開盤（open）、最高（high）、最低（low）、收盤（close）四個欄位，第一欄為日期。欄名需包含以下關鍵字（不分大小寫）：</p>
                    <pre>date,open,high,low,close
2024-01-02,28.5,31.2,27.8,30.1
2024-01-03,30.1,32.4,29.5,31.8
2024-01-04,31.8,33.0,30.2,30.7
2024-01-05,30.7,31.5,28.9,29.4</pre>
                    <div class="tip">適用圖表：CandlestickChart（K 線圖）</div>

                    <h3>注意事項</h3>
                    <ul>
                        <li>僅支援 <code>.csv</code> 格式，儲存時請使用 <strong>UTF-8 編碼</strong>（Excel 另存為 CSV UTF-8）</li>
                        <li>至少需要兩欄資料（類別欄 + 至少一個數值欄）</li>
                        <li>數值欄若有空值，系統會自動補 <code>0</code></li>
                        <li>日期格式支援 <code>YYYY-MM</code>、<code>YYYY-MM-DD</code>、<code>YYYY/MM/DD</code> 等常見格式</li>
                        <li>欄位名稱不可有特殊字元（如引號、反斜線）</li>
                        <li>數值欄請勿包含逗號分隔（例如 <code>1,250</code> 應寫為 <code>1250</code>）</li>
                    </ul>

                    <h3>從 Excel 轉存 CSV 步驟</h3>
                    <div class="step-list">
                        <div class="step-item"><span class="step-num">1</span><div>在 Excel 完成資料整理</div></div>
                        <div class="step-item"><span class="step-num">2</span><div>點擊「檔案」→「另存新檔」</div></div>
                        <div class="step-item"><span class="step-num">3</span><div>存檔類型選擇「CSV UTF-8（逗號分隔）(*.csv)」</div></div>
                        <div class="step-item"><span class="step-num">4</span><div>儲存後即可上傳至後台</div></div>
                    </div>
                </section>

                <!-- ── 圖表類型 ── -->
                <section v-show="activeSection === 'charts'">
                    <h2>圖表類型說明</h2>
                    <p>系統內建多種圖表元件，共分五大類。上傳 CSV 時系統會自動顯示相容的圖表類型。</p>

                    <template v-for="group in CHART_GROUPS" :key="group.label">
                        <h3>{{ group.label }}</h3>
                        <div class="chart-card-grid">
                            <div class="chart-card" v-for="chart in group.charts" :key="chart.name">
                                <div class="cc-preview" v-html="CHART_TYPE_DATA[chart.name]?.icon" />
                                <div class="cc-body">
                                    <span class="tag">{{ chart.name }}</span>
                                    <p class="cc-desc">{{ chart.desc }}</p>
                                    <p class="cc-scene"><span class="scene-label">場景</span>{{ chart.scene }}</p>
                                </div>
                            </div>
                        </div>
                        <div v-if="group.note" class="tip">{{ group.note }}</div>
                    </template>
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
    width: 148px;
    flex-shrink: 0;
    padding: 1rem 0.6rem;
    border-right: 1px solid var(--color-border, #3a3c3e);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    overflow-y: auto;
}

.nav-group-label {
    color: #555;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0 0.5rem 0.25rem;
    margin-top: 0.25rem;
}

.nav-item {
    background: none;
    border: none;
    color: #888;
    text-align: left;
    padding: 0.45rem 0.65rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.825rem;
    transition: background 0.15s, color 0.15s;
    line-height: 1.3;

    &:hover { background: #2a2c2e; color: #ccc; }
    &.active { background: #1e2a40; color: #7ab3ff; font-weight: 500; }
}

.help-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1.75rem 2.5rem;

    section { max-width: 780px; }

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
        margin: 1.5rem 0 0.5rem;
    }

    p { color: #aaa; font-size: 0.875rem; line-height: 1.75; margin: 0 0 0.75rem; }

    ul, ol {
        color: #aaa;
        font-size: 0.875rem;
        line-height: 2;
        padding-left: 1.4rem;
        margin: 0 0 0.75rem;
    }

    pre {
        background: #141618;
        border: 1px solid #3a3c3e;
        border-radius: 6px;
        padding: 0.85rem 1rem;
        font-size: 0.78rem;
        color: #aad4ff;
        margin: 0.5rem 0 0.75rem;
        overflow-x: auto;
        line-height: 1.7;
    }

    code {
        background: #2a2c30;
        border-radius: 3px;
        padding: 0.1rem 0.4rem;
        font-size: 0.8rem;
        color: #aad4ff;
    }

    strong { color: #ddd; }
}

.tip {
    background: #1a2a1a;
    border-left: 3px solid #4ade80;
    border-radius: 0 6px 6px 0;
    padding: 0.6rem 0.85rem !important;
    color: #7aba88 !important;
    margin: 0.5rem 0 0.75rem !important;
    font-size: 0.85rem !important;
    line-height: 1.6 !important;
}

.warning {
    background: #2a1a1a;
    border-left: 3px solid #f87171;
    border-radius: 0 6px 6px 0;
    padding: 0.6rem 0.85rem;
    color: #f99 !important;
    margin: 0.5rem 0 0.75rem;
    font-size: 0.85rem;
    line-height: 1.6;
}

.tag {
    display: inline-block;
    background: #2d3e5a;
    color: #7ab3ff;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    font-size: 0.78rem;
    font-family: monospace;
    white-space: nowrap;
    margin-right: 0.25rem;
}

.icon-inline {
    font-family: 'Material Icons';
    font-size: 1rem;
    vertical-align: middle;
    color: #7ab3ff;
}

/* ─ Overview cards ─ */
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

/* ─ Step list ─ */
.step-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 0.5rem 0 0.75rem;
}

.step-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    color: #aaa;
    font-size: 0.875rem;
    line-height: 1.7;
}

.step-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    background: #2d3e5a;
    color: #7ab3ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 700;
    margin-top: 0.2rem;
}

/* ─ Feature / permission table ─ */
.feature-table {
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    overflow: hidden;
    margin: 0.5rem 0 1rem;
    font-size: 0.85rem;
}

.ft-row {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #2a2c2e;
    gap: 0.75rem;
    align-items: center;
    color: #aaa;
    font-size: 0.85rem;

    &:last-child { border-bottom: none; }
    &.header { background: #282a2c; color: #666; font-size: 0.75rem; }
}

.perm-row {
    grid-template-columns: 2fr 1fr 1fr;
    text-align: left;

    span:nth-child(2),
    span:nth-child(3) { text-align: center; }
}

.badge-yes { color: #4ade80; font-weight: 700; }
.badge-no  { color: #444; }

/* ─ Chart card grid ─ */
.chart-card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin: 0.5rem 0 1.25rem;
}

.chart-card {
    background: #1f2123;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:hover {
        border-color: #5b8cfa;
        box-shadow: 0 0 12px rgba(91, 140, 250, 0.15);
    }
}

.cc-preview {
    background: #141618;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 108px;

    :deep(svg) {
        width: 100%;
        height: 100%;
        max-height: 96px;
    }
}

.cc-body {
    padding: 0.6rem 0.75rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    border-top: 1px solid #2a2c2e;
}

.cc-desc {
    color: #aaa;
    font-size: 0.78rem;
    margin: 0.1rem 0 0;
    line-height: 1.55;
}

.cc-scene {
    color: #666;
    font-size: 0.72rem;
    margin: 0;
    line-height: 1.4;
}

.scene-label {
    display: inline-block;
    background: #252830;
    color: #5b8cfa;
    font-size: 0.65rem;
    border-radius: 3px;
    padding: 0.05rem 0.35rem;
    margin-right: 0.4rem;
    font-weight: 600;
    vertical-align: middle;
}


.version-badge {
    display: inline-block;
    background: #2d3e5a;
    color: #7ab3ff;
    font-size: 0.65rem;
    font-family: monospace;
    font-weight: 400;
    padding: 0.15rem 0.55rem;
    border-radius: 4px;
    vertical-align: middle;
    margin-left: 0.6rem;
    letter-spacing: 0.04em;
}
</style>
