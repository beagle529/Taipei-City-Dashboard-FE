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
    unit: Optional[str] = None
    categories: Optional[List[str]] = None
    update_freq: Optional[int] = None
    update_freq_unit: Optional[str] = None


class CreateComponentBody(BaseModel):
    name: str
    source: str
    chart_types: List[str]
    history_data: bool = False
    short_desc: str = ""
    long_desc: str = ""
    use_case: str = ""


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


@router.post("")
def create_component(body: CreateComponentBody, _: str = Depends(get_current_admin)):
    raw = _load()
    existing_ids = [int(k) for k in raw["data"].keys() if k.isdigit()]
    new_id = str(max(existing_ids) + 1) if existing_ids else "1"
    if new_id in raw["data"]:
        raise HTTPException(status_code=409, detail=f"ID {new_id} 已存在")
    raw["data"][new_id] = {
        "id": int(new_id),
        "index": f"component-{new_id}",
        "history_data": body.history_data,
        "chart_config": {
            "types": body.chart_types,
            "color": [],
            "unit": "",
        },
        "map_config": None,
        "name": body.name,
        "source": body.source,
        "short_desc": body.short_desc,
        "long_desc": body.long_desc,
        "use_case": body.use_case,
        "links": [],
        "tags": [],
        "contributors": [],
    }
    _save(raw)
    return {"message": f"已新增組件「{body.name}」", "id": new_id}


@router.delete("/{component_id}")
def delete_component(component_id: str, _: str = Depends(get_current_admin)):
    raw = _load()
    if str(component_id) not in raw["data"]:
        raise HTTPException(status_code=404, detail=f"找不到 component {component_id}")
    name = raw["data"][str(component_id)].get("name", component_id)
    del raw["data"][str(component_id)]
    _save(raw)

    # 同步移除各儀表板內的引用
    dashboards = _load_dashboards()
    changed = False
    for d in dashboards["data"]:
        before = len(d["components"])
        d["components"] = [c for c in d["components"] if str(c) != str(component_id)]
        if len(d["components"]) != before:
            changed = True
    if changed:
        config.DASHBOARDS_FILE.write_text(
            json.dumps(dashboards, ensure_ascii=False, indent="\t"), encoding="utf-8"
        )

    # 刪除資料檔（有的話）
    for path in [config.CHART_DATA_DIR / f"{component_id}.json",
                 config.HISTORY_DATA_DIR / f"{component_id}.json"]:
        if path.exists():
            path.unlink()

    return {"message": f"已刪除組件「{name}」（ID: {component_id}）"}


@router.patch("/{component_id}")
def update_component(component_id: str, body: ComponentMeta, _: str = Depends(get_current_admin)):
    raw = _load()
    if str(component_id) not in raw["data"]:
        raise HTTPException(status_code=404, detail=f"找不到 component {component_id}")

    comp = raw["data"][str(component_id)]
    updates = body.dict(exclude_none=True)
    # chart_config 巢狀欄位統一寫入 chart_config.*
    chart_cfg = comp.setdefault("chart_config", {})
    if "chart_types" in updates:
        chart_cfg["types"] = updates.pop("chart_types")
    if "unit" in updates:
        chart_cfg["unit"] = updates.pop("unit")
    if "categories" in updates:
        chart_cfg["categories"] = updates.pop("categories")
    comp.update(updates)
    _save(raw)
    return {"message": f"已更新 component {component_id}", "data": comp}
