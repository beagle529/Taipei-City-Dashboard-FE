const C1 = "#5b8cfa";
const C2 = "#7ab3ff";
const C3 = "#4ade80";
const C4 = "#f59e0b";
const AX = "#555";

export const CHART_TYPE_DATA = {
    BarChart: {
        desc: "橫條圖。比較不同類別的數值，適合類別名稱較長時使用。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="2" x2="12" y2="42" stroke="${AX}" stroke-width="1.5"/>
            <rect x="13" y="5"  width="36" height="8" fill="${C1}" rx="1"/>
            <rect x="13" y="18" width="20" height="8" fill="${C2}" rx="1"/>
            <rect x="13" y="31" width="44" height="8" fill="${C1}" rx="1"/>
        </svg>`,
    },
    BarPercentChart: {
        desc: "百分比橫條圖。顯示各分類在整體中的佔比，每列合計 100%。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6"  width="22" height="9" fill="${C1}" rx="1"/>
            <rect x="28" y="6"  width="16" height="9" fill="${C2}" rx="0"/>
            <rect x="44" y="6"  width="14" height="9" fill="${C3}" rx="1"/>
            <rect x="6" y="19" width="28" height="9" fill="${C1}" rx="1"/>
            <rect x="34" y="19" width="12" height="9" fill="${C2}" rx="0"/>
            <rect x="46" y="19" width="12" height="9" fill="${C3}" rx="1"/>
            <rect x="6" y="32" width="16" height="9" fill="${C1}" rx="1"/>
            <rect x="22" y="32" width="24" height="9" fill="${C2}" rx="0"/>
            <rect x="46" y="32" width="12" height="9" fill="${C3}" rx="1"/>
        </svg>`,
    },
    ColumnChart: {
        desc: "直條圖。比較不同類別數值，適合類別數量不多時。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="38" x2="60" y2="38" stroke="${AX}" stroke-width="1.5"/>
            <rect x="8"  y="18" width="10" height="20" fill="${C1}" rx="1"/>
            <rect x="22" y="10" width="10" height="28" fill="${C2}" rx="1"/>
            <rect x="36" y="22" width="10" height="16" fill="${C1}" rx="1"/>
            <rect x="50" y="6"  width="10" height="32" fill="${C2}" rx="1"/>
        </svg>`,
    },
    SimpleColChart: {
        desc: "簡單直條圖。單系列直條，資料來源單純時適用。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="38" x2="60" y2="38" stroke="${AX}" stroke-width="1.5"/>
            <rect x="10" y="14" width="13" height="24" fill="${C1}" rx="1"/>
            <rect x="27" y="8"  width="13" height="30" fill="${C1}" rx="1"/>
            <rect x="44" y="20" width="13" height="18" fill="${C1}" rx="1"/>
        </svg>`,
    },
    DonutChart: {
        desc: "甜甜圈圖。顯示各類別佔整體的比例，中央可顯示總計。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="22" r="18" fill="none" stroke="${C1}" stroke-width="10" stroke-dasharray="56.5 56.5" stroke-dashoffset="0"/>
            <circle cx="32" cy="22" r="18" fill="none" stroke="${C2}" stroke-width="10" stroke-dasharray="28.3 84.8" stroke-dashoffset="-56.5"/>
            <circle cx="32" cy="22" r="18" fill="none" stroke="${C3}" stroke-width="10" stroke-dasharray="14.1 99" stroke-dashoffset="-84.8"/>
            <circle cx="32" cy="22" r="9" fill="#1a1c1e"/>
        </svg>`,
    },
    PolarChart: {
        desc: "極座標圖。以扇形面積表示各類別數值大小。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 22 L50 10 A20 20 0 0 1 50 34 Z" fill="${C1}" opacity="0.9"/>
            <path d="M32 22 L50 34 A20 20 0 0 1 22 40 Z" fill="${C2}" opacity="0.9"/>
            <path d="M32 22 L22 40 A20 20 0 0 1 14 10 Z" fill="${C3}" opacity="0.9"/>
            <path d="M32 22 L14 10 A20 20 0 0 1 50 10 Z" fill="${C4}" opacity="0.9"/>
        </svg>`,
    },
    TreemapChart: {
        desc: "樹狀圖。以矩形大小顯示各類別數值比重，適合層級資料。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="4"  y="4"  width="34" height="36" fill="${C1}" rx="2"/>
            <rect x="41" y="4"  width="19" height="20" fill="${C2}" rx="2"/>
            <rect x="41" y="27" width="11" height="13" fill="${C3}" rx="2"/>
            <rect x="55" y="27" width="5"  height="13" fill="${C4}" rx="2"/>
        </svg>`,
    },
    RadarChart: {
        desc: "雷達圖。同時比較多個維度的表現，適合多指標分析。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,4 56,18 56,34 32,44 8,34 8,18" fill="none" stroke="${AX}" stroke-width="1"/>
            <polygon points="32,12 48,20 48,30 32,38 16,30 16,20" fill="none" stroke="${AX}" stroke-width="0.5"/>
            <polygon points="32,8 52,24 46,36 32,40 12,32 14,20" fill="${C1}" fill-opacity="0.4" stroke="${C1}" stroke-width="1.5"/>
        </svg>`,
    },
    HeatmapChart: {
        desc: "熱度圖。以顏色深淺表示二維矩陣中的數值大小。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="4"  y="4"  width="16" height="10" fill="${C1}" opacity="0.3" rx="1"/>
            <rect x="23" y="4"  width="16" height="10" fill="${C1}" opacity="0.6" rx="1"/>
            <rect x="42" y="4"  width="16" height="10" fill="${C1}" opacity="1.0" rx="1"/>
            <rect x="4"  y="18" width="16" height="10" fill="${C2}" opacity="0.8" rx="1"/>
            <rect x="23" y="18" width="16" height="10" fill="${C2}" opacity="0.4" rx="1"/>
            <rect x="42" y="18" width="16" height="10" fill="${C2}" opacity="0.9" rx="1"/>
            <rect x="4"  y="32" width="16" height="10" fill="${C3}" opacity="0.6" rx="1"/>
            <rect x="23" y="32" width="16" height="10" fill="${C3}" opacity="1.0" rx="1"/>
            <rect x="42" y="32" width="16" height="10" fill="${C3}" opacity="0.3" rx="1"/>
        </svg>`,
    },
    PyramidChart: {
        desc: "金字塔圖。比較兩組資料的分布（如年齡性別分布）。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="24" y="4"  width="16" height="7" fill="${C1}" rx="1"/>
            <rect x="18" y="14" width="28" height="7" fill="${C1}" rx="1"/>
            <rect x="12" y="24" width="40" height="7" fill="${C2}" rx="1"/>
            <rect x="6"  y="34" width="52" height="7" fill="${C2}" rx="1"/>
        </svg>`,
    },
    GuageChart: {
        desc: "儀錶板圖。顯示單一數值在範圍中的位置，如達成率、進度。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 36 A24 24 0 0 1 56 36" fill="none" stroke="#333" stroke-width="8" stroke-linecap="round"/>
            <path d="M8 36 A24 24 0 0 1 44 14" fill="none" stroke="${C1}" stroke-width="8" stroke-linecap="round"/>
            <line x1="32" y1="36" x2="44" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <circle cx="32" cy="36" r="3" fill="white"/>
        </svg>`,
    },
    TimelineSeparateChart: {
        desc: "時間趨勢折線圖。顯示多個系列隨時間的變化趨勢。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="40" x2="60" y2="40" stroke="${AX}" stroke-width="1.5"/>
            <polyline points="6,30 18,20 30,24 42,14 54,18" fill="none" stroke="${C1}" stroke-width="2" stroke-linejoin="round"/>
            <polyline points="6,36 18,32 30,28 42,30 54,24" fill="none" stroke="${C2}" stroke-width="2" stroke-linejoin="round"/>
        </svg>`,
    },
    TimelineStackedChart: {
        desc: "時間堆疊面積圖。顯示多系列的趨勢與總量變化。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="40" x2="60" y2="40" stroke="${AX}" stroke-width="1.5"/>
            <polygon points="6,40 6,28 18,24 30,26 42,20 54,22 54,40" fill="${C2}" opacity="0.6"/>
            <polygon points="6,28 18,24 30,26 42,20 54,22 54,30 42,28 30,32 18,30 6,34" fill="${C1}" opacity="0.8"/>
        </svg>`,
    },
    MapLegend: {
        desc: "地圖圖例。搭配地圖使用，顯示地圖上各分層的顏色說明。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="6"  y="8"  width="12" height="8" fill="${C1}" rx="1"/>
            <rect x="6"  y="20" width="12" height="8" fill="${C2}" rx="1"/>
            <rect x="6"  y="32" width="12" height="8" fill="${C3}" rx="1"/>
            <rect x="22" y="10" width="22" height="4" fill="#555" rx="1"/>
            <rect x="22" y="22" width="16" height="4" fill="#555" rx="1"/>
            <rect x="22" y="34" width="26" height="4" fill="#555" rx="1"/>
        </svg>`,
    },
    DistrictChart: {
        desc: "行政區地圖。以顏色深淺顯示各行政區的數值差異。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,4 48,10 52,24 44,38 20,40 8,28 12,12" fill="${C2}" opacity="0.4" stroke="${AX}" stroke-width="1"/>
            <polygon points="32,4 48,10 44,22 30,20 20,12" fill="${C1}" opacity="0.7" stroke="${AX}" stroke-width="1"/>
            <polygon points="44,22 52,24 44,38 30,36 30,20" fill="${C2}" opacity="0.6" stroke="${AX}" stroke-width="1"/>
        </svg>`,
    },
    DistrictPointChart: {
        desc: "行政區點位地圖。在地圖上標示各地點位置與數量。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,4 48,10 52,24 44,38 20,40 8,28 12,12" fill="#2a2c30" stroke="${AX}" stroke-width="1"/>
            <circle cx="28" cy="16" r="4" fill="${C1}" opacity="0.9"/>
            <circle cx="40" cy="22" r="5" fill="${C1}" opacity="0.9"/>
            <circle cx="22" cy="28" r="3" fill="${C2}" opacity="0.9"/>
            <circle cx="36" cy="32" r="4" fill="${C1}" opacity="0.9"/>
        </svg>`,
    },
    MetroChart: {
        desc: "捷運圖。顯示捷運各路線、站點的資料（如人流量）。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="8"  y1="22" x2="56" y2="22" stroke="${C1}" stroke-width="4" stroke-linecap="round"/>
            <line x1="32" y1="4"  x2="32" y2="40" stroke="${C2}" stroke-width="4" stroke-linecap="round"/>
            <circle cx="32" cy="22" r="5" fill="white" stroke="${AX}" stroke-width="1.5"/>
            <circle cx="16" cy="22" r="3" fill="white" stroke="${C1}" stroke-width="1.5"/>
            <circle cx="48" cy="22" r="3" fill="white" stroke="${C1}" stroke-width="1.5"/>
            <circle cx="32" cy="10" r="3" fill="white" stroke="${C2}" stroke-width="1.5"/>
            <circle cx="32" cy="34" r="3" fill="white" stroke="${C2}" stroke-width="1.5"/>
        </svg>`,
    },
    RealNameTable: {
        desc: "實名制統計表。顯示蔬菜／水果實名制筆數、件數、重量及供應人數，適合每日人工上傳。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4"  width="56" height="9"  rx="1" fill="#1a3020" stroke="#3a6040" stroke-width="0.5"/>
            <text x="8" y="11" font-size="5.5" fill="#6ee79c">蔬菜</text>
            <text x="22" y="11" font-size="4.5" fill="#888">筆數</text>
            <text x="34" y="11" font-size="4.5" fill="#888">件數</text>
            <text x="46" y="11" font-size="4.5" fill="#888">重量</text>
            <rect x="4" y="14" width="56" height="6"  rx="0" fill="#1a1c1e" stroke="#3a3c3e" stroke-width="0.5"/>
            <text x="8" y="19" font-size="4" fill="#bbb">非實名制</text>
            <rect x="4" y="21" width="56" height="6"  rx="0" fill="#202224" stroke="#3a3c3e" stroke-width="0.5"/>
            <text x="8" y="26" font-size="4" fill="#bbb">實名制</text>
            <rect x="4" y="28" width="56" height="5"  rx="0" fill="#252830" stroke="#3a3c3e" stroke-width="0.5"/>
            <text x="8" y="32" font-size="4" fill="#ccc">總筆數</text>
            <rect x="4" y="34" width="56" height="7"  rx="0" fill="#2e2800" stroke="#504500" stroke-width="0.5"/>
            <text x="8" y="39" font-size="4.5" fill="#ffd700">供應人數量</text>
            <text x="44" y="39" font-size="5" font-weight="bold" fill="#ffd700">3168</text>
        </svg>`,
    },
    StackedColumnChart: {
        desc: "堆疊直條圖（分組）。X 軸為時間或類別，Y 軸為各子項目的堆疊數值。當資料含有「群組_系列」格式時，自動顯示群組切換標籤。適合品質等級、各類別組成等多維度時序資料。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="38" x2="60" y2="38" stroke="${AX}" stroke-width="1.5"/>
            <!-- group A: 2 stacked bars -->
            <rect x="8"  y="26" width="8" height="12" fill="${C1}" rx="1"/>
            <rect x="8"  y="16" width="8" height="10" fill="${C2}" rx="1"/>
            <rect x="8"  y="10" width="8" height="6"  fill="${C3}" rx="1"/>
            <!-- group B -->
            <rect x="18" y="22" width="8" height="16" fill="${C1}" rx="1"/>
            <rect x="18" y="13" width="8" height="9"  fill="${C2}" rx="1"/>
            <rect x="18" y="8"  width="8" height="5"  fill="${C3}" rx="1"/>
            <!-- group C -->
            <rect x="28" y="24" width="8" height="14" fill="${C1}" rx="1"/>
            <rect x="28" y="15" width="8" height="9"  fill="${C2}" rx="1"/>
            <rect x="28" y="10" width="8" height="5"  fill="${C3}" rx="1"/>
            <!-- group D -->
            <rect x="38" y="20" width="8" height="18" fill="${C1}" rx="1"/>
            <rect x="38" y="12" width="8" height="8"  fill="${C2}" rx="1"/>
            <rect x="38" y="7"  width="8" height="5"  fill="${C3}" rx="1"/>
            <!-- tab indicators -->
            <rect x="6"  y="1" width="10" height="4" fill="${C1}" rx="1" opacity="0.9"/>
            <rect x="18" y="1" width="10" height="4" fill="${AX}" rx="1" opacity="0.5"/>
        </svg>`,
    },
    DataTable: {
        desc: "資料表格。以列表方式顯示多欄位的記錄資料，支援點擊欄位標題排序。適合維修記錄、違規事件、進場人員清單等需要逐筆檢視的表格資料。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <!-- header row -->
            <rect x="4" y="4" width="56" height="7" fill="#282a2c" rx="1"/>
            <line x1="4" y1="4" x2="60" y2="4" stroke="${C1}" stroke-width="1"/>
            <line x1="4" y1="11" x2="60" y2="11" stroke="${AX}" stroke-width="0.5"/>
            <!-- col dividers in header -->
            <line x1="22" y1="4" x2="22" y2="11" stroke="${AX}" stroke-width="0.5"/>
            <line x1="40" y1="4" x2="40" y2="11" stroke="${AX}" stroke-width="0.5"/>
            <!-- header text placeholders -->
            <rect x="6"  y="6" width="12" height="3" fill="${C1}" rx="1" opacity="0.8"/>
            <rect x="24" y="6" width="12" height="3" fill="${AX}" rx="1" opacity="0.5"/>
            <rect x="42" y="6" width="12" height="3" fill="${AX}" rx="1" opacity="0.5"/>
            <!-- data rows -->
            <rect x="6"  y="14" width="10" height="2.5" fill="${C2}" rx="1" opacity="0.7"/>
            <rect x="24" y="14" width="14" height="2.5" fill="${AX}" rx="1" opacity="0.4"/>
            <rect x="42" y="14" width="8"  height="2.5" fill="${C3}" rx="1" opacity="0.5"/>
            <rect x="6"  y="20" width="12" height="2.5" fill="${C2}" rx="1" opacity="0.7"/>
            <rect x="24" y="20" width="10" height="2.5" fill="${AX}" rx="1" opacity="0.4"/>
            <rect x="42" y="20" width="11" height="2.5" fill="${C4}" rx="1" opacity="0.5"/>
            <rect x="6"  y="26" width="9"  height="2.5" fill="${C2}" rx="1" opacity="0.7"/>
            <rect x="24" y="26" width="16" height="2.5" fill="${AX}" rx="1" opacity="0.4"/>
            <rect x="42" y="26" width="9"  height="2.5" fill="${C3}" rx="1" opacity="0.5"/>
            <rect x="6"  y="32" width="13" height="2.5" fill="${C2}" rx="1" opacity="0.7"/>
            <rect x="24" y="32" width="12" height="2.5" fill="${AX}" rx="1" opacity="0.4"/>
            <rect x="42" y="32" width="10" height="2.5" fill="${C4}" rx="1" opacity="0.5"/>
            <!-- row dividers -->
            <line x1="4" y1="17.5" x2="60" y2="17.5" stroke="${AX}" stroke-width="0.3" opacity="0.5"/>
            <line x1="4" y1="23.5" x2="60" y2="23.5" stroke="${AX}" stroke-width="0.3" opacity="0.5"/>
            <line x1="4" y1="29.5" x2="60" y2="29.5" stroke="${AX}" stroke-width="0.3" opacity="0.5"/>
        </svg>`,
    },
    ScatterChart: {
        desc: "散佈圖。以 X/Y 座標呈現兩個連續變數的關係，適合觀察相關性或分群分布。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="8" y1="2" x2="8"  y2="38" stroke="${AX}" stroke-width="1.2"/>
            <line x1="8" y1="38" x2="60" y2="38" stroke="${AX}" stroke-width="1.2"/>
            <circle cx="18" cy="28" r="3" fill="${C1}" opacity="0.9"/>
            <circle cx="26" cy="22" r="3" fill="${C1}" opacity="0.9"/>
            <circle cx="22" cy="32" r="3" fill="${C2}" opacity="0.9"/>
            <circle cx="34" cy="16" r="3" fill="${C1}" opacity="0.9"/>
            <circle cx="38" cy="24" r="3" fill="${C2}" opacity="0.9"/>
            <circle cx="44" cy="12" r="3" fill="${C1}" opacity="0.9"/>
            <circle cx="50" cy="20" r="3" fill="${C2}" opacity="0.9"/>
            <circle cx="30" cy="30" r="3" fill="${C3}" opacity="0.9"/>
            <circle cx="48" cy="30" r="3" fill="${C3}" opacity="0.9"/>
        </svg>`,
    },
    LineColumnChart: {
        desc: "折線柱狀混合圖。主要數值用柱狀圖，趨勢指標用折線圖疊加，適合同時呈現量與趨勢。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="8" y1="2" x2="8"  y2="38" stroke="${AX}" stroke-width="1.2"/>
            <line x1="8" y1="38" x2="60" y2="38" stroke="${AX}" stroke-width="1.2"/>
            <!-- columns -->
            <rect x="12" y="18" width="7" height="20" fill="${C1}" rx="1" opacity="0.85"/>
            <rect x="23" y="10" width="7" height="28" fill="${C1}" rx="1" opacity="0.85"/>
            <rect x="34" y="22" width="7" height="16" fill="${C1}" rx="1" opacity="0.85"/>
            <rect x="45" y="14" width="7" height="24" fill="${C1}" rx="1" opacity="0.85"/>
            <!-- line overlay -->
            <polyline points="15,22 26,14 37,18 48,10"
                fill="none" stroke="${C3}" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="15" cy="22" r="2.5" fill="${C3}"/>
            <circle cx="26" cy="14" r="2.5" fill="${C3}"/>
            <circle cx="37" cy="18" r="2.5" fill="${C3}"/>
            <circle cx="48" cy="10" r="2.5" fill="${C3}"/>
        </svg>`,
    },
    MarketFloorChart: {
        desc: "市場樓層圖。以互動式平面圖顯示各區成交量、進場人數、均價與燈光狀態，支援點擊區域展開甲乙丙明細。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <!-- floor plan outline -->
            <rect x="4" y="4" width="56" height="36" fill="#1a1c1e" stroke="${AX}" stroke-width="1" rx="1"/>
            <!-- vegetable zone -->
            <rect x="6" y="6" width="24" height="32" fill="${C1}" opacity="0.45" rx="1"/>
            <text x="18" y="24" text-anchor="middle" font-size="5" fill="#fff">蔬菜區</text>
            <!-- fruit zone -->
            <rect x="32" y="6" width="26" height="26" fill="${C2}" opacity="0.45" rx="1"/>
            <text x="45" y="21" text-anchor="middle" font-size="5" fill="#fff">水果區</text>
            <!-- banana zone -->
            <rect x="32" y="34" width="26" height="6" fill="${C4}" opacity="0.55" rx="1"/>
            <text x="45" y="38.5" text-anchor="middle" font-size="4.5" fill="#fff">芭樂香蕉區</text>
        </svg>`,
    },
    CandlestickChart: {
        desc: "K線圖（蠟燭圖）。顯示開高低收四個價格，紅綠配色代表漲跌，適合金融市場與交易量分析。",
        icon: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg">
            <line x1="8" y1="2" x2="8"  y2="42" stroke="${AX}" stroke-width="1.2"/>
            <line x1="8" y1="42" x2="62" y2="42" stroke="${AX}" stroke-width="1.2"/>
            <!-- candle 1 - up (green) -->
            <line x1="17" y1="8"  x2="17" y2="14" stroke="${C3}" stroke-width="1.5"/>
            <rect x="13" y="14" width="8" height="12" fill="${C3}" rx="1"/>
            <line x1="17" y1="26" x2="17" y2="32" stroke="${C3}" stroke-width="1.5"/>
            <!-- candle 2 - down (red) -->
            <line x1="29" y1="12" x2="29" y2="18" stroke="#f87171" stroke-width="1.5"/>
            <rect x="25" y="18" width="8" height="10" fill="#f87171" rx="1"/>
            <line x1="29" y1="28" x2="29" y2="34" stroke="#f87171" stroke-width="1.5"/>
            <!-- candle 3 - up (green) -->
            <line x1="41" y1="10" x2="41" y2="16" stroke="${C3}" stroke-width="1.5"/>
            <rect x="37" y="16" width="8" height="14" fill="${C3}" rx="1"/>
            <line x1="41" y1="30" x2="41" y2="36" stroke="${C3}" stroke-width="1.5"/>
            <!-- candle 4 - down (red) -->
            <line x1="53" y1="14" x2="53" y2="20" stroke="#f87171" stroke-width="1.5"/>
            <rect x="49" y="20" width="8" height="8" fill="#f87171" rx="1"/>
            <line x1="53" y1="28" x2="53" y2="34" stroke="#f87171" stroke-width="1.5"/>
        </svg>`,
    },
};
