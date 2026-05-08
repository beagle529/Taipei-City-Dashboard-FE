import pandas as pd
import json
from io import StringIO
from datetime import timezone, timedelta

TZ_TAIPEI = timezone(timedelta(hours=8))

# Patterns that indicate the first column is a date/time axis
DATE_COLUMN_NAMES = {"date", "日期", "time", "時間", "month", "月份", "year", "年份"}


def _looks_like_date(series: pd.Series) -> bool:
    try:
        pd.to_datetime(series.head(3), format="mixed")
        return True
    except Exception:
        return False


def parse_csv(content: str) -> tuple[dict, str]:
    """
    Parse CSV content and return (json_data, data_type).
    data_type is either "chartData" or "historyData".

    Supported CSV formats:

    Time series (→ historyData):
        date,蔬菜,水果
        2024-01,1250,830

    Category / single series (→ chartData):
        category,value
        蔬菜,1250

    Category / multi series (→ chartData):
        category,系列A,系列B
        北投區,100,200
    """
    df = pd.read_csv(StringIO(content))
    if df.empty or len(df.columns) < 2:
        raise ValueError("CSV 至少需要兩欄資料")

    first_col = df.columns[0]
    value_cols = df.columns[1:].tolist()

    is_time_series = (
        first_col.lower() in DATE_COLUMN_NAMES
        or _looks_like_date(df[first_col])
    )

    if is_time_series:
        return _to_history_data(df, first_col, value_cols), "historyData"
    else:
        return _to_chart_data(df, first_col, value_cols), "chartData"


def _to_history_data(df: pd.DataFrame, date_col: str, value_cols: list[str]) -> dict:
    dates = pd.to_datetime(df[date_col])
    series = []
    for col in value_cols:
        data_points = []
        for dt, val in zip(dates, df[col]):
            aware = dt.replace(tzinfo=TZ_TAIPEI)
            data_points.append({
                "x": aware.isoformat(),
                "y": _cast(val),
            })
        series.append({"name": col, "data": data_points})
    return {"data": series}


def _to_chart_data(df: pd.DataFrame, cat_col: str, value_cols: list[str]) -> dict:
    if len(value_cols) == 1:
        # Single series — flatten to one series with name ""
        series = [{
            "name": "",
            "data": [
                {"x": str(row[cat_col]), "y": _cast(row[value_cols[0]])}
                for _, row in df.iterrows()
            ],
        }]
    else:
        # Multiple series — each value column becomes a series
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


def _cast(val):
    if pd.isna(val):
        return 0
    try:
        f = float(val)
        return int(f) if f == int(f) else round(f, 4)
    except (ValueError, TypeError):
        return str(val)
