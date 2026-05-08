import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from utils.auth import get_current_admin
import config

router = APIRouter(prefix="/components", tags=["components"])


class ComponentMeta(BaseModel):
    name: Optional[str] = None
    source: Optional[str] = None
    short_desc: Optional[str] = None
    long_desc: Optional[str] = None
    use_case: Optional[str] = None
    tags: Optional[List[str]] = None
    chart_types: Optional[List[str]] = None


def _load() -> dict:
    return json.loads(config.COMPONENTS_FILE.read_text(encoding="utf-8"))


def _save(data: dict):
    config.COMPONENTS_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent="\t"), encoding="utf-8"
    )


def _load_dashboards() -> dict:
    return json.loads(config.DASHBOARDS_FILE.read_text(encoding="utf-8"))


@router.get("")
def list_components(_: str = Depends(get_current_admin)):
    raw = _load()
    dashboards = _load_dashboards()

    # Build a map of component_id → dashboard names
    dash_map: dict[str, list[str]] = {}
    for d in dashboards["data"]:
        for cid in d["components"]:
            dash_map.setdefault(str(cid), []).append(d["name"])

    result = []
    for cid, comp in raw["data"].items():
        has_chart = (config.CHART_DATA_DIR / f"{cid}.json").exists()
        has_history = (config.HISTORY_DATA_DIR / f"{cid}.json").exists()
        result.append({
            "id": cid,
            "name": comp.get("name", ""),
            "source": comp.get("source", ""),
            "short_desc": comp.get("short_desc", ""),
            "chart_types": comp.get("chart_config", {}).get("types", []),
            "history_data": comp.get("history_data", False),
            "has_chart_file": has_chart,
            "has_history_file": has_history,
            "dashboards": dash_map.get(str(cid), []),
        })

    result.sort(key=lambda x: int(x["id"]) if x["id"].isdigit() else 0)
    return {"data": result}


@router.get("/{component_id}")
def get_component(component_id: str, _: str = Depends(get_current_admin)):
    raw = _load()
    comp = raw["data"].get(str(component_id))
    if not comp:
        raise HTTPException(status_code=404, detail=f"找不到 component {component_id}")
    return comp


@router.patch("/{component_id}")
def update_component(component_id: str, body: ComponentMeta, _: str = Depends(get_current_admin)):
    raw = _load()
    if str(component_id) not in raw["data"]:
        raise HTTPException(status_code=404, detail=f"找不到 component {component_id}")

    comp = raw["data"][str(component_id)]
    updates = body.dict(exclude_none=True)
    # chart_types maps to chart_config.types (nested field)
    if "chart_types" in updates:
        comp.setdefault("chart_config", {})["types"] = updates.pop("chart_types")
    comp.update(updates)
    _save(raw)
    return {"message": f"已更新 component {component_id}", "data": comp}
