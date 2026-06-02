import pandas as pd
import json
from io import StringIO
from datetime import timezone, timedelta

TZ_TAIPEI = timezone(timedelta(hours=8))

# Patterns that indicate the first column is a date/time axis
DATE_COLUMN_NAMES = {"date", "日期", "time", "時間", "month", "月份", "year", "年份"}

# Keywords for OHLC (candlestick) column detection — maps keyword → slot index
# slot 0=open, 1=high, 2=low, 3=close
_OHLC_KEYWORDS = [
    (["開盤", "開盤價", "open"],  0),
    (["最高", "最高價", "high"],  1),
    (["最低", "最低價", "low"],   2),
    (["收盤", "收盤價", "close"], 3),
]


def _looks_like_date(series: pd.Series) -> bool:
    try:
        pd.to_datetime(series.head(3), format="mixed")
        return True
    except Exception:
        return False


def _is_text_column(series: pd.Series) -> bool:
    """True if column cannot be cast to numeric (i.e. it's a text category column)."""
    try:
        pd.to_numeric(series)
        return False
    except (ValueError, TypeError):
        return True


def _detect_ohlc_cols(columns: list[str]) -> list[str] | None:
    """
    Return [open_col, high_col, low_col, close_col] if the column names
    contain OHLC keywords, else None.
    """
    mapping: dict[int, str] = {}
    for col in columns:
        col_lower = col.lower()
        for keywords, slot in _OHLC_KEYWORDS:
            if slot not in mapping:
                if any(kw in col_lower for kw in keywords):
                    mapping[slot] = col
                    break
    if set(mapping.keys()) == {0, 1, 2, 3}:
        return [mapping[i] for i in range(4)]
    return None


def _is_scatter_format(df: pd.DataFrame, value_cols: list[str]) -> bool:
    """
    Detect scatter CSV: exactly 2 numeric value cols (optionally preceded by
    one text grouping col).
    Formats:
      品項, x_num, y_num             → 3-col scatter (single series)
      品項, 類別, x_num, y_num       → 4-col scatter (multi-series by 類別)
    """
    if len(value_cols) == 2:
        return all(not _is_text_column(df[c]) for c in value_cols)
    if len(value_cols) == 3 and _is_text_column(df[value_cols[0]]):
        return all(not _is_text_column(df[c]) for c in value_cols[1:])
    return False


def parse_csv(content: str) -> tuple[dict, str, str]:
    """
    Parse CSV content and return (json_data, data_type, suggested_chart).
    data_type is either "chartData" or "historyData".
    suggested_chart is the recommended ApexCharts component name.

    Supported CSV formats:

    Time series (→ historyData):
        date,蔬菜,水果
        2024-01,1250,830

    Long-format time series (→ chartData, StackedColumnChart):
        月份,類別,特級,優級,良級,報廢
        2024-06,蔬菜,949,2950,5463,74
        → pivoted to series: 蔬菜_特級, 蔬菜_優級 … 水果_特級 …

    OHLC / K線 (→ chartData, CandlestickChart):
        日期,開盤價,最高價,最低價,收盤價
        2024-01-02,8.5,10.2,7.8,9.6
        → single candlestick series with y=[open,high,low,close]

    Scatter — single series (→ chartData, ScatterChart):
        品項,成交量(公噸),平均價格(元/公斤)
        高麗菜,45.2,8.5

    Scatter — multi-series by group (→ chartData, ScatterChart):
        品項,類別,成交量(公噸),平均價格(元/公斤)
        高麗菜,蔬菜,45.2,8.5
        蘋果,水果,25.6,45.2

    Category / multi series (→ chartData):
        category,系列A,系列B
        北投區,100,200

    Records table (→ chartData, DataTable):
        報修單號,設施類別,維修費用,完工狀態
        MNT-001,冷凍冷藏,71369,已完工
    """
    df = pd.read_csv(StringIO(content))
    if df.empty or len(df.columns) < 2:
        raise ValueError("CSV 至少需要兩欄資料")

    first_col = df.columns[0]
    second_col = df.columns[1] if len(df.columns) >= 2 else None
    value_cols = df.columns[1:].tolist()

    is_time_series = (
        first_col.lower() in DATE_COLUMN_NAMES
        or _looks_like_date(df[first_col])
    )

    if is_time_series:
        # ── OHLC / K線偵測 ───────────────────────────────────────────────
        ohlc_cols = _detect_ohlc_cols(value_cols)
        if ohlc_cols:
            return _to_ohlc_data(df, first_col, ohlc_cols), "chartData", "CandlestickChart"

        # ── 長格式偵測：第二欄是文字（群組欄），其餘欄才是數值 ───────────
        if (second_col is not None
                and len(df.columns) >= 3
                and _is_text_column(df[second_col])):
            group_col = second_col
            num_cols = df.columns[2:].tolist()
            return _to_long_format(df, first_col, group_col, num_cols), "chartData", "StackedColumnChart"

        return _to_history_data(df, first_col, value_cols), "historyData", "TimelineSeparateChart"

    else:
        # ── 散佈圖偵測：品項(label) + [類別(group)] + x數值 + y數值 ──────
        if _is_scatter_format(df, value_cols):
            return _to_scatter_data(df, first_col, value_cols), "chartData", "ScatterChart"

        # ── 記錄表格偵測：多欄且多數欄位為文字 → DataTable 格式 ───────────
        text_col_count = sum(_is_text_column(df[c]) for c in value_cols)
        if text_col_count >= max(1, len(value_cols) // 2):
            return _to_records_table(df, first_col, value_cols), "chartData", "DataTable"

        return _to_chart_data(df, first_col, value_cols), "chartData", "BarChart"


# ── Output formatters ────────────────────────────────────────────────────────

def _to_history_data(df: pd.DataFrame, date_col: str, value_cols: list[str]) -> dict:
    dates = pd.to_datetime(df[date_col])
    series = []
    for col in value_cols:
        data_points = []
        for dt, val in zip(dates, df[col]):
            data_points.append({
                "x": dt.strftime("%Y-%m-%d"),
                "y": _cast(val),
            })
        series.append({"name": col, "data": data_points})
    return {"data": series}


def _to_ohlc_data(df: pd.DataFrame, date_col: str, ohlc_cols: list[str]) -> dict:
    """
    OHLC 格式：每個 data point 的 y 是 [開盤, 最高, 最低, 收盤]。
    ApexCharts candlestick 要求此格式。
    若 CSV 有第 5 欄（如 成交量），也可附帶為第二系列，此處忽略。
    """
    open_col, high_col, low_col, close_col = ohlc_cols
    data_points = []
    for _, row in df.iterrows():
        data_points.append({
            "x": str(row[date_col]),
            "y": [
                _cast(row[open_col]),
                _cast(row[high_col]),
                _cast(row[low_col]),
                _cast(row[close_col]),
            ],
        })
    return {"data": [{"name": "價格", "data": data_points}]}


def _to_scatter_data(df: pd.DataFrame, label_col: str, value_cols: list[str]) -> dict:
    """
    散佈圖格式：每個 data point 的 x/y 均為數值，label 附於 z 欄供 tooltip 使用。
    支援兩種格式：
      value_cols = [x_col, y_col]            → 單一系列
      value_cols = [group_col, x_col, y_col] → 多系列（依 group_col 分組）
    x_label / y_label 存於頂層，供前端自動設定座標軸標題。
    """
    if len(value_cols) == 2:
        x_col, y_col = value_cols
        data_points = [
            {"x": _cast(row[x_col]), "y": _cast(row[y_col]), "label": str(row[label_col])}
            for _, row in df.iterrows()
        ]
        return {"data": [{"name": y_col, "data": data_points}],
                "x_label": x_col, "y_label": y_col}
    else:
        # 4 columns: label, group, x, y
        group_col, x_col, y_col = value_cols[0], value_cols[1], value_cols[2]
        groups = df[group_col].unique()
        series = []
        for group in groups:
            group_df = df[df[group_col] == group]
            data_points = [
                {"x": _cast(row[x_col]), "y": _cast(row[y_col]), "label": str(row[label_col])}
                for _, row in group_df.iterrows()
            ]
            series.append({"name": str(group), "data": data_points})
        return {"data": series, "x_label": x_col, "y_label": y_col}


def _to_chart_data(df: pd.DataFrame, cat_col: str, value_cols: list[str]) -> dict:
    if len(value_cols) == 1:
        series = [{
            "name": "",
            "data": [
                {"x": str(row[cat_col]), "y": _cast(row[value_cols[0]])}
                for _, row in df.iterrows()
            ],
        }]
    else:
        series = []
        for col in value_cols:
            series.append({
                "name": col,
                "data": [
                    {"x": str(row[cat_col]), "y": _cast(row[col])}
                    for _, row in df.iterrows()
                ],
            })
    return {"data": series}


def _to_long_format(df: pd.DataFrame, date_col: str, group_col: str, value_cols: list[str]) -> dict:
    """
    長格式樞紐：(日期 × 群組 × 數值欄) → 多系列 chartData。
    系列名稱格式："{群組}_{數值欄名}"，例如 "蔬菜_特級 (噸)"。
    適用於 StackedColumnChart。
    """
    series = []
    groups = df[group_col].unique()
    for group in groups:
        group_df = df[df[group_col] == group]
        for col in value_cols:
            data_points = [
                {"x": str(row[date_col]), "y": _cast(row[col])}
                for _, row in group_df.iterrows()
            ]
            series.append({"name": f"{group}_{col}", "data": data_points})
    return {"data": series}


def _to_records_table(df: pd.DataFrame, key_col: str, value_cols: list[str]) -> dict:
    """
    記錄表格：每欄成為一個 series，key_col 的值作為各列的 x（識別碼）。
    適用於 DataTable。
    """
    series = []
    for col in value_cols:
        series.append({
            "name": col,
            "data": [
                {"x": str(row[key_col]), "y": _cast(row[col])}
                for _, row in df.iterrows()
            ],
        })
    return {"data": series}


def _cast(val):
    if pd.isna(val):
        return 0
    try:
        f = float(val)
        return int(f) if f == int(f) else round(f, 4)
    except (ValueError, TypeError):
        return str(val)
