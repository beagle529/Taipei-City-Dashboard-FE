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
};
