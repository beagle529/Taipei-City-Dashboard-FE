import json
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from utils.auth import get_current_admin
from utils.csv_parser import parse_csv
import config

def _load_components() -> dict:
    return json.loads(config.COMPONENTS_FILE.read_text(encoding="utf-8"))

def _save_components(data: dict):
    config.COMPONENTS_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent="\t"), encoding="utf-8"
    )

router = APIRouter(prefix="/data", tags=["data"])


def _get_data_path(component_id: str, data_type: str) -> Path:
    # historyData/ is the MoreInfo-dialog historical overlay — not the main chart feed.
    # All admin uploads (including time-series) go to chartData/ so that
    # TimelineSeparateChart / TimelineStackedChart (which read chart_data) get the data.
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
        parsed, detected_type, suggested_chart = parse_csv(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    data_type = detected_type if target == "auto" else target
    return {"data_type": data_type, "preview": parsed, "suggested_chart": suggested_chart}


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
        parsed, detected_type, _ = parse_csv(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    data_type = detected_type if target == "auto" else target
    path = _get_data_path(component_id, data_type)
    path.parent.mkdir(parents=True, exist_ok=True)
    _backup(path)
    path.write_text(json.dumps(parsed, ensure_ascii=False, indent="\t"), encoding="utf-8")

    # ── 散佈圖：自動將 CSV 欄名寫入 chart_config.categories ────────────
    extra = {}
    x_label = parsed.get("x_label", "")
    y_label = parsed.get("y_label", "")
    if x_label and y_label:
        try:
            comps = _load_components()
            if str(component_id) in comps["data"]:
                comp = comps["data"][str(component_id)]
                comp.setdefault("chart_config", {})["categories"] = [x_label, y_label]
                _save_components(comps)
                extra["categories_updated"] = [x_label, y_label]
        except Exception:
            pass  # 非致命錯誤，不阻斷上傳

    return {"message": f"已成功更新 {data_type}/{component_id}.json", "data_type": data_type, **extra}
