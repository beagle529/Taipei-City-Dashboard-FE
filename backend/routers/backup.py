import json
import shutil
import zipfile
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from utils.auth import get_current_admin, get_super_admin
import config

router = APIRouter(prefix="/backup", tags=["backup"])

# ══════════════════════════════════════════════════════════════════
#  備份固定位置：backend/data/backups/
#  還原時將 zip 解壓後，依 RESTORE_INFO.json 的說明複製回對應路徑
# ══════════════════════════════════════════════════════════════════
BACKUP_DIR = Path(__file__).parent.parent / "data" / "backups"
BACKUP_LOG = Path(__file__).parent.parent / "data" / "backup_log.json"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def _load_log() -> dict:
    if not BACKUP_LOG.exists():
        return {"data": []}
    try:
        return json.loads(BACKUP_LOG.read_text(encoding="utf-8"))
    except Exception:
        return {"data": []}


def _append_log(entry: dict):
    log = _load_log()
    log["data"].insert(0, entry)
    log["data"] = log["data"][:100]
    BACKUP_LOG.write_text(json.dumps(log, ensure_ascii=False, indent="\t"), encoding="utf-8")


def _build_restore_info(ts: str, files_info: list) -> dict:
    """
    產生 RESTORE_INFO.json，讓未來的 AI 或管理員知道如何還原。
    此檔案會打包進每個備份 zip 的根目錄。
    """
    return {
        "system_version": config.SYSTEM_VERSION,
        "backup_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "backup_id": ts,
        "backup_location_on_server": str(BACKUP_DIR),
        "files_included": files_info,
        "restore_guide": {
            "step1": "將 zip 解壓縮到任意暫存資料夾",
            "step2": "對照下方 file_destinations，將各檔案複製到 SERVER 對應路徑",
            "step3": "複製完畢後不需重啟 uvicorn，重新整理瀏覽器即可",
        },
        "file_destinations": {
            "all_components.json":       "SERVER: <project_root>/public/dashboards/all_components.json",
            "all_dashboards.json":       "SERVER: <project_root>/public/dashboards/all_dashboards.json",
            "all_contributors.json":     "SERVER: <project_root>/public/dashboards/all_contributors.json",
            "market_price_history.json": "SERVER: <project_root>/backend/data/market_price_history.json",
            "quicklinks.json":           "SERVER: <project_root>/backend/quicklinks.json",
            "chartData/":                "SERVER: <project_root>/public/chartData/",
            "historyData/":              "SERVER: <project_root>/public/historyData/",
        },
        "note": (
            "project_root 在 SERVER 上的實際路徑為 "
            "C:\\james\\TaipeiDashboardDemo\\Taipei-City-Dashboard-FE\\"
        ),
    }


@router.get("")
def list_backups(_: dict = Depends(get_current_admin)):
    log = _load_log()
    for entry in log["data"]:
        entry["exists"] = (BACKUP_DIR / entry["filename"]).exists()
    return log


@router.post("")
def create_backup(admin: dict = Depends(get_super_admin)):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    tmp = BACKUP_DIR / f"_tmp_{ts}"
    tmp.mkdir(parents=True, exist_ok=True)
    files_info = []

    try:
        # ── 目錄型資料 ──────────────────────────────────────────────
        for src_dir, label in [
            (config.CHART_DATA_DIR,   "chartData"),
            (config.HISTORY_DATA_DIR, "historyData"),
        ]:
            if src_dir.exists():
                shutil.copytree(src_dir, tmp / label)
                count = len(list(src_dir.glob("*.json")))
                files_info.append(f"{label}/ ({count} 個檔案)")

        # ── 單一 JSON 檔案 ──────────────────────────────────────────
        single_files = [
            config.COMPONENTS_FILE,
            config.DASHBOARDS_FILE,
            config.CONTRIBUTORS_FILE,
            config.MARKET_PRICE_HISTORY_FILE,
            config.QUICKLINKS_FILE,
        ]
        for f in single_files:
            if f.exists():
                shutil.copy2(f, tmp / f.name)
                files_info.append(f.name)

        # ── 還原說明（RESTORE_INFO.json）────────────────────────────
        restore_info = _build_restore_info(ts, files_info)
        (tmp / "RESTORE_INFO.json").write_text(
            json.dumps(restore_info, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

        # ── 壓縮成 zip，檔名含版本號 ────────────────────────────────
        version_tag = config.SYSTEM_VERSION.replace(".", "_")
        zip_name = f"{ts}_{version_tag}.zip"
        zip_path = BACKUP_DIR / zip_name
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in tmp.rglob("*"):
                if p.is_file():
                    zf.write(p, p.relative_to(tmp))

        size_kb = round(zip_path.stat().st_size / 1024, 1)

        _append_log({
            "id":           ts,
            "timestamp":    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "version":      config.SYSTEM_VERSION,
            "size_kb":      size_kb,
            "files":        files_info,
            "filename":     zip_name,
            "created_by":   admin["username"],
            "exists":       True,
        })

        return {
            "message":  f"備份成功：{zip_name} ({size_kb} KB)",
            "id":       ts,
            "version":  config.SYSTEM_VERSION,
        }

    finally:
        if tmp.exists():
            shutil.rmtree(tmp)


@router.get("/download/{filename}")
def download_backup(filename: str, _: dict = Depends(get_super_admin)):
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(400, "非法檔名")
    path = BACKUP_DIR / filename
    if not path.exists():
        raise HTTPException(404, "備份檔案不存在")
    return FileResponse(path, filename=filename, media_type="application/zip")
