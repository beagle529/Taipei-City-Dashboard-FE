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
    log["data"] = log["data"][:100]  # keep last 100
    BACKUP_LOG.write_text(json.dumps(log, ensure_ascii=False, indent="\t"), encoding="utf-8")


@router.get("")
def list_backups(_: dict = Depends(get_current_admin)):
    log = _load_log()
    # Annotate with whether the zip file still exists
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
        for src_dir, label in [
            (config.CHART_DATA_DIR, "chartData"),
            (config.HISTORY_DATA_DIR, "historyData"),
        ]:
            if src_dir.exists():
                dst = tmp / label
                shutil.copytree(src_dir, dst)
                count = len(list(src_dir.glob("*.json")))
                files_info.append(f"{label}/ ({count} 個檔案)")

        for f in [config.COMPONENTS_FILE, config.DASHBOARDS_FILE]:
            if f.exists():
                shutil.copy2(f, tmp / f.name)
                files_info.append(f.name)

        zip_path = BACKUP_DIR / f"{ts}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in tmp.rglob("*"):
                if p.is_file():
                    zf.write(p, p.relative_to(tmp))

        size_kb = round(zip_path.stat().st_size / 1024, 1)

        _append_log({
            "id": ts,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "size_kb": size_kb,
            "files": files_info,
            "filename": f"{ts}.zip",
            "created_by": admin["username"],
            "exists": True,
        })
        return {"message": f"備份成功：{ts}.zip ({size_kb} KB)", "id": ts}

    finally:
        if tmp.exists():
            shutil.rmtree(tmp)


@router.get("/download/{filename}")
def download_backup(filename: str, _: dict = Depends(get_super_admin)):
    if ".." in filename or "/" in filename:
        raise HTTPException(400, "非法檔名")
    path = BACKUP_DIR / filename
    if not path.exists():
        raise HTTPException(404, "備份檔案不存在")
    return FileResponse(path, filename=filename, media_type="application/zip")
