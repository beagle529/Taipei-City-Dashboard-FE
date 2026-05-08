import json
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from utils.auth import get_current_admin
from utils.csv_parser import parse_csv
import config

router = APIRouter(prefix="/data", tags=["data"])


def _get_data_path(component_id: str, data_type: str) -> Path:
    if data_type == "historyData":
        return config.HISTORY_DATA_DIR / f"{component_id}.json"
    return config.CHART_DATA_DIR / f"{component_id}.json"


def _backup(path: Path):
    if path.exists():
        backup_dir = path.parent / "_backups"
        backup_dir.mkdir(exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        shutil.copy2(path, backup_dir / f"{path.stem}_{ts}.json")


@router.get("/{component_id}")
def get_data(component_id: str, data_type: str = "chartData", _: str = Depends(get_current_admin)):
    path = _get_data_path(component_id, data_type)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"找不到 {data_type}/{component_id}.json")
    return json.loads(path.read_text(encoding="utf-8"))


@router.post("/{component_id}/preview")
async def preview_csv(
    component_id: str,
    file: UploadFile = File(...),
    target: str = "auto",
    _: str = Depends(get_current_admin),
):
    content = (await file.read()).decode("utf-8")
    try:
        parsed, detected_type = parse_csv(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    data_type = detected_type if target == "auto" else target
    return {"data_type": data_type, "preview": parsed}


@router.post("/{component_id}/upload")
async def upload_csv(
    component_id: str,
    file: UploadFile = File(...),
    target: str = "auto",
    _: str = Depends(get_current_admin),
):
    """
    target: "auto" | "chartData" | "historyData"
    """
    content = (await file.read()).decode("utf-8")
    try:
        parsed, detected_type = parse_csv(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    data_type = detected_type if target == "auto" else target
    path = _get_data_path(component_id, data_type)
    path.parent.mkdir(parents=True, exist_ok=True)
    _backup(path)
    path.write_text(json.dumps(parsed, ensure_ascii=False, indent="\t"), encoding="utf-8")

    return {"message": f"已成功更新 {data_type}/{component_id}.json", "data_type": data_type}
