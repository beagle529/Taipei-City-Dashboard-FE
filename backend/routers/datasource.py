"""
定期來源設定 (Datasource / Scheduled URL fetch)

每個組件可設定一個外部 URL（HTTP/HTTPS，支援 CSV 或 JSON）。
後台排程器依照設定的頻率定期抓取並更新 chartData/<id>.json。

storage: backend/data/datasources.json
{
  "<component_id>": {
    "url": "https://...",
    "schedule": "hourly" | "daily" | "weekly" | "none",
    "enabled": true,
    "last_fetched": "2026-05-14 08:00:00",
    "last_status": "ok" | "error",
    "last_message": "...",
    "created_at": "..."
  }
}
"""
import json
import shutil
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import config
from utils.auth import get_current_admin
from utils.csv_parser import parse_csv

router = APIRouter(prefix="/datasource", tags=["datasource"])

_DS_FILE = Path(__file__).parent.parent / "data" / "datasources.json"
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; TaipeiDashboardBot/1.0)"
    )
}


# ── Storage helpers ──

def _load() -> dict:
    if not _DS_FILE.exists():
        return {}
    try:
        return json.loads(_DS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save(data: dict):
    _DS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _DS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ── Fetch & parse logic (shared between API and scheduler) ──

def _fetch_and_save(component_id: str, url: str) -> dict:
    """
    Fetch the URL, parse CSV or JSON, save to chartData/<id>.json.
    Returns {"status": "ok"|"error", "message": str, "fetched_at": str}
    """
    fetched_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=20)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        raw = resp.text

        # ── Detect format and parse ──
        if "json" in content_type or raw.strip().startswith(("{", "[")):
            # JSON: store directly (must be {data:[...]} or [{...}])
            try:
                parsed = json.loads(raw)
                # Wrap bare arrays to {data:[...]}
                if isinstance(parsed, list):
                    parsed = {"data": parsed}
            except json.JSONDecodeError as e:
                return {"status": "error", "message": f"JSON 解析失敗：{e}", "fetched_at": fetched_at}
        else:
            # CSV
            try:
                parsed, _ = parse_csv(raw)
            except Exception as e:
                return {"status": "error", "message": f"CSV 解析失敗：{e}", "fetched_at": fetched_at}

        # ── Backup & write ──
        dest = config.CHART_DATA_DIR / f"{component_id}.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists():
            backup_dir = dest.parent / "_backups"
            backup_dir.mkdir(exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            shutil.copy2(dest, backup_dir / f"{dest.stem}_{ts}.json")
        dest.write_text(json.dumps(parsed, ensure_ascii=False, indent="\t"), encoding="utf-8")

        return {"status": "ok", "message": "抓取成功", "fetched_at": fetched_at}

    except requests.exceptions.Timeout:
        return {"status": "error", "message": "連線逾時（20 秒）", "fetched_at": fetched_at}
    except requests.exceptions.ConnectionError as e:
        return {"status": "error", "message": f"無法連線：{e}", "fetched_at": fetched_at}
    except requests.exceptions.HTTPError as e:
        return {"status": "error", "message": f"HTTP 錯誤：{e}", "fetched_at": fetched_at}
    except Exception as e:
        return {"status": "error", "message": str(e), "fetched_at": fetched_at}


# ── APScheduler job (called by scheduler) ──

def scheduled_fetch(component_id: str):
    """Called by APScheduler for the given component."""
    ds = _load()
    cfg = ds.get(component_id)
    if not cfg or not cfg.get("enabled") or not cfg.get("url"):
        return
    result = _fetch_and_save(component_id, cfg["url"])
    cfg["last_fetched"] = result["fetched_at"]
    cfg["last_status"] = result["status"]
    cfg["last_message"] = result["message"]
    ds[component_id] = cfg
    _save(ds)
    print(f"[datasource] component={component_id} {result['status']} – {result['message']}")


# ── Pydantic models ──

class DatasourceIn(BaseModel):
    url: str
    schedule: str = "daily"   # "hourly" | "daily" | "weekly" | "none"
    enabled: bool = True


# ── API endpoints ──

@router.get("")
def list_datasources(_: str = Depends(get_current_admin)):
    """List all datasource configs (all components)."""
    return _load()


@router.get("/{component_id}")
def get_datasource(component_id: str, _: str = Depends(get_current_admin)):
    ds = _load()
    if component_id not in ds:
        return {}
    return ds[component_id]


@router.post("/{component_id}")
def set_datasource(
    component_id: str,
    body: DatasourceIn,
    _: str = Depends(get_current_admin),
):
    """Create or update datasource config for a component."""
    if body.schedule not in ("hourly", "daily", "weekly", "none"):
        raise HTTPException(status_code=422, detail="schedule 必須為 hourly / daily / weekly / none")

    ds = _load()
    existing = ds.get(component_id, {})
    ds[component_id] = {
        "url": body.url.strip(),
        "schedule": body.schedule,
        "enabled": body.enabled,
        "last_fetched": existing.get("last_fetched"),
        "last_status": existing.get("last_status"),
        "last_message": existing.get("last_message"),
        "created_at": existing.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
    }
    _save(ds)

    # Re-register scheduler job
    _register_job(component_id, body.schedule, body.enabled)

    return {"message": "已儲存", "config": ds[component_id]}


@router.delete("/{component_id}")
def delete_datasource(component_id: str, _: str = Depends(get_current_admin)):
    ds = _load()
    if component_id not in ds:
        raise HTTPException(status_code=404, detail="找不到設定")
    del ds[component_id]
    _save(ds)
    _remove_job(component_id)
    return {"message": "已刪除"}


@router.post("/{component_id}/fetch-now")
def fetch_now(component_id: str, _: str = Depends(get_current_admin)):
    """Manually trigger an immediate fetch for the component."""
    ds = _load()
    cfg = ds.get(component_id)
    if not cfg or not cfg.get("url"):
        raise HTTPException(status_code=404, detail="尚未設定來源 URL")

    result = _fetch_and_save(component_id, cfg["url"])
    cfg["last_fetched"] = result["fetched_at"]
    cfg["last_status"] = result["status"]
    cfg["last_message"] = result["message"]
    ds[component_id] = cfg
    _save(ds)

    if result["status"] == "error":
        raise HTTPException(status_code=502, detail=result["message"])
    return {"message": result["message"], "fetched_at": result["fetched_at"]}


# ── Scheduler helpers (called from main.py) ──

_scheduler_ref = None   # set by main.py


def init_scheduler(scheduler):
    """Register all active datasource jobs at startup."""
    global _scheduler_ref
    _scheduler_ref = scheduler
    ds = _load()
    count = 0
    for comp_id, cfg in ds.items():
        if cfg.get("enabled") and cfg.get("schedule") != "none":
            _register_job(comp_id, cfg["schedule"], True)
            count += 1
    print(f"[datasource] registered {count} scheduled jobs on startup")


def _job_id(component_id: str) -> str:
    return f"ds_{component_id}"


def _register_job(component_id: str, schedule: str, enabled: bool):
    if _scheduler_ref is None:
        return
    job_id = _job_id(component_id)
    # Remove existing job first
    try:
        _scheduler_ref.remove_job(job_id)
    except Exception:
        pass

    if not enabled or schedule == "none":
        return

    from apscheduler.triggers.cron import CronTrigger
    if schedule == "hourly":
        trigger = CronTrigger(minute=5, timezone="Asia/Taipei")
    elif schedule == "weekly":
        trigger = CronTrigger(day_of_week="mon", hour=6, minute=30, timezone="Asia/Taipei")
    else:  # daily
        trigger = CronTrigger(hour=6, minute=30, timezone="Asia/Taipei")

    _scheduler_ref.add_job(
        scheduled_fetch,
        trigger,
        args=[component_id],
        id=job_id,
        replace_existing=True,
        misfire_grace_time=3600,
    )
    print(f"[datasource] job registered: component={component_id}, schedule={schedule}")


def _remove_job(component_id: str):
    if _scheduler_ref is None:
        return
    try:
        _scheduler_ref.remove_job(_job_id(component_id))
        print(f"[datasource] job removed: component={component_id}")
    except Exception:
        pass
