import json
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from utils.auth import get_current_admin, get_super_admin
import config

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


class DashboardBody(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    components: Optional[List[str]] = None
    hidden: Optional[bool] = None


def _load() -> dict:
    return json.loads(config.DASHBOARDS_FILE.read_text(encoding="utf-8"))


def _save(data: dict):
    config.DASHBOARDS_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent="\t"), encoding="utf-8"
    )


@router.get("")
def list_dashboards(_: dict = Depends(get_current_admin)):
    return _load()


@router.post("")
def create_dashboard(body: DashboardBody, _: dict = Depends(get_super_admin)):
    if not body.name:
        raise HTTPException(status_code=422, detail="name 為必填")
    data = _load()
    index = body.name.replace(" ", "-").lower()
    if any(d["index"] == index for d in data["data"]):
        raise HTTPException(status_code=409, detail=f"已存在 index={index} 的儀表板")
    data["data"].append({
        "name": body.name,
        "index": index,
        "icon": body.icon or "dashboard",
        "components": body.components or [],
        "hidden": False,
    })
    _save(data)
    return {"message": f"已新增儀表板「{body.name}」"}


@router.patch("/{index}")
def update_dashboard(index: str, body: DashboardBody, _: dict = Depends(get_current_admin)):
    data = _load()
    target = next((d for d in data["data"] if d["index"] == index), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"找不到 index={index} 的儀表板")
    updates = body.dict(exclude_none=True)
    target.update(updates)
    _save(data)
    return {"message": f"已更新儀表板「{target['name']}」", "data": target}


@router.delete("/{index}")
def delete_dashboard(
    index: str,
    confirm_name: str = Query(..., description="必須輸入儀表板名稱以確認刪除"),
    _: dict = Depends(get_super_admin),
):
    data = _load()
    target = next((d for d in data["data"] if d["index"] == index), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"找不到 index={index} 的儀表板")
    if confirm_name != target["name"]:
        raise HTTPException(status_code=400, detail="確認名稱不符，拒絕刪除")
    data["data"] = [d for d in data["data"] if d["index"] != index]
    _save(data)
    return {"message": f"已永久刪除儀表板「{target['name']}」"}


@router.post("/reorder")
def reorder_dashboards(indexes: List[str], _: dict = Depends(get_current_admin)):
    data = _load()
    lookup = {d["index"]: d for d in data["data"]}
    reordered = [lookup[i] for i in indexes if i in lookup]
    for d in data["data"]:
        if d["index"] not in indexes:
            reordered.append(d)
    data["data"] = reordered
    _save(data)
    return {"message": "已更新儀表板排序"}
