from fastapi import APIRouter
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
import time
import json
import os

router = APIRouter(prefix="/market-price", tags=["market-price"])

SOURCE_URL = "https://www.tapmc.com.tw"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Simple in-memory cache
_cache = {"data": None, "fetched_at": 0}
CACHE_TTL = 300  # seconds

# History file path
_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_HISTORY_FILE = os.path.join(_DATA_DIR, "market_price_history.json")


# ── History helpers ──

def _load_history() -> dict:
    """Load the history dict from JSON; return {} if file doesn't exist."""
    if not os.path.exists(_HISTORY_FILE):
        return {}
    try:
        with open(_HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_history(history: dict):
    """Persist the history dict to JSON."""
    os.makedirs(_DATA_DIR, exist_ok=True)
    with open(_HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def _save_daily_record(data: dict):
    """
    Save today's market data as a daily history record.
    Key = 'YYYY-MM-DD', will NOT overwrite an existing record for the same date
    unless it is a rest day (to allow re-fetch when the market reopens).
    """
    today = datetime.now().strftime("%Y-%m-%d")
    history = _load_history()

    # Don't overwrite a good record with a rest-day record
    existing = history.get(today)
    if existing and not existing.get("rest_day") and data.get("rest_day"):
        return

    history[today] = {
        "date": today,
        "fetched_at": data.get("fetched_at"),
        "rest_day": data.get("rest_day", False),
        "rest_message": data.get("rest_message", ""),
        "price_table": data.get("price_table", []),
        "summary": data.get("summary", {}),
    }
    _save_history(history)


# ── Scraper ──

def _scrape() -> dict:
    resp = requests.get(SOURCE_URL, headers=HEADERS, timeout=15)
    # 使用 resp.content (raw bytes) + from_encoding 避免 requests 編碼誤判問題
    soup = BeautifulSoup(resp.content, "html.parser", from_encoding="utf-8")

    # ── 休市偵測 ──
    rest_day = False
    rest_message = ""
    rest_div = soup.find(class_="rest-text")
    if rest_div:
        text = rest_div.get_text(strip=True)
        if text:
            rest_day = True
            rest_message = text  # e.g. "今日休市"

    # ── 行情表格 ──
    rows = []
    table = soup.find(id="price-table")
    if table:
        for tr in table.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if len(cells) >= 5:
                rows.append({
                    "name":    cells[0],
                    "variety": cells[1],
                    "high":    cells[2],
                    "mid":     cells[3],
                    "low":     cells[4],
                })

    # ── 統計摘要 ──
    summary = {}
    box = soup.find(class_="last-sum-box")
    if box:
        table = box.find("table")
        if table:
            head_row = table.find("tr", class_="sum-head")
            col_veg   = "蔬菜"
            col_fruit = "水果"
            if head_row:
                ths = [th.get_text(strip=True) for th in head_row.find_all("th")]
                if len(ths) >= 3:
                    col_veg, col_fruit = ths[1], ths[2]

            for row in table.find_all("tr", class_=["price-today", "price-yesterday"]):
                cells = [td.get_text(strip=True) for td in row.find_all("td")]
                if len(cells) >= 3:
                    label     = cells[0]
                    veg_val   = cells[1]
                    fruit_val = cells[2]
                    if "價" in label:
                        veg_val   = f"{veg_val} 元"
                        fruit_val = f"{fruit_val} 元"
                    elif "量" in label:
                        veg_val   = f"{veg_val} 噸"
                        fruit_val = f"{fruit_val} 噸"
                    summary[f"{label}({col_veg})"]   = veg_val
                    summary[f"{label}({col_fruit})"] = fruit_val

    return {
        "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "rest_day": rest_day,
        "rest_message": rest_message,
        "price_table": rows,
        "summary": summary,
    }


# ── Scheduled job (called by APScheduler at 08:00 every day) ──

def scheduled_daily_fetch():
    """Fetch market price and persist as today's history record."""
    global _cache
    try:
        data = _scrape()
        _cache["data"] = data
        _cache["fetched_at"] = time.time()
        _save_daily_record(data)
        print(f"[market-price] scheduled fetch OK – {data['fetched_at']}, "
              f"{len(data['price_table'])} rows")
    except Exception as e:
        print(f"[market-price] scheduled fetch FAILED – {e}")


# ── Public API endpoints ──

@router.get("")
def get_market_price():
    """
    優先策略：
    1. 記憶體快取仍有效 → 直接回傳（避免重複讀檔）
    2. 今日歷史紀錄存在 → 從檔案讀取，不連官網
    3. 以上皆無 → 連官網抓取，並存入快取與歷史紀錄
    「立即更新」請用 POST /refresh。
    """
    global _cache
    now = time.time()

    # ① 記憶體快取仍有效
    if _cache["data"] is not None and (now - _cache["fetched_at"]) <= CACHE_TTL:
        return _cache["data"]

    # ② 檢查今日歷史紀錄
    today = datetime.now().strftime("%Y-%m-%d")
    history = _load_history()
    if today in history:
        data = history[today]
        _cache["data"] = data
        _cache["fetched_at"] = now
        print(f"[market-price] served from history record ({today})")
        return data

    # ③ 無紀錄 → 連官網抓取
    try:
        data = _scrape()
        _cache["data"] = data
        _cache["fetched_at"] = now
        _save_daily_record(data)
        print(f"[market-price] scraped from website and saved ({today})")
        return data
    except Exception as e:
        if _cache["data"]:
            return {**_cache["data"], "stale": True, "error": str(e)}
        return {"error": str(e), "price_table": [], "summary": {}, "fetched_at": None}


@router.post("/refresh")
def refresh_market_price():
    """強制重新抓取官網，略過快取與歷史紀錄判斷，並更新歷史紀錄。"""
    global _cache
    try:
        data = _scrape()
        _cache["data"] = data
        _cache["fetched_at"] = time.time()
        _save_daily_record(data)
        return data
    except Exception as e:
        return {"error": str(e), "price_table": [], "summary": {}, "fetched_at": None}


@router.get("/history")
def get_history_list():
    """
    Return a list of available history dates (sorted descending) with summary only.
    """
    history = _load_history()
    result = []
    for date in sorted(history.keys(), reverse=True):
        rec = history[date]
        result.append({
            "date":       rec["date"],
            "fetched_at": rec.get("fetched_at"),
            "rest_day":   rec.get("rest_day", False),
            "row_count":  len(rec.get("price_table", [])),
            "summary":    rec.get("summary", {}),
        })
    return result


@router.get("/history/{date}")
def get_history_by_date(date: str):
    """
    Return the full price_table for a specific date (format: YYYY-MM-DD).
    """
    history = _load_history()
    if date not in history:
        return {"error": f"No record for {date}", "price_table": [], "summary": {}}
    return history[date]


@router.post("/history/save-today")
def save_today_manually():
    """Manually trigger today's history snapshot (same as scheduled job)."""
    scheduled_daily_fetch()
    today = datetime.now().strftime("%Y-%m-%d")
    history = _load_history()
    if today in history:
        return {"status": "saved", "date": today, "row_count": len(history[today].get("price_table", []))}
    return {"status": "error", "detail": "fetch may have failed"}


@router.get("/debug")
def debug_market_price():
    """Return raw HTML snippet for diagnosing scraper issues."""
    try:
        resp = requests.get(SOURCE_URL, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.content, "html.parser", from_encoding="utf-8")

        table = soup.find(id="price-table")
        box = soup.find(class_="last-sum-box")

        first_rows = []
        if table:
            for tr in list(table.find_all("tr"))[:3]:
                cells = [td.get_text(strip=True) for td in tr.find_all("td")]
                first_rows.append(cells)

        return {
            "status_code": resp.status_code,
            "page_title": soup.title.string if soup.title else None,
            "table_found": table is not None,
            "table_html_snippet": str(table)[:500] if table else None,
            "box_found": box is not None,
            "first_rows": first_rows,
        }
    except Exception as e:
        return {"error": str(e)}
