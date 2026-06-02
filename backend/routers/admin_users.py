import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.auth import get_current_admin, get_super_admin, hash_password, load_extra_admins, ADMINS_FILE
import config

router = APIRouter(prefix="/admin-users", tags=["admin-users"])


class CreateUserBody(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None


class UpdateUserBody(BaseModel):
    password: Optional[str] = None
    display_name: Optional[str] = None


def _load() -> dict:
    if not ADMINS_FILE.exists():
        return {"data": []}
    return json.loads(ADMINS_FILE.read_text(encoding="utf-8"))


def _save(data: dict):
    ADMINS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent="\t"), encoding="utf-8")


@router.get("")
def list_users(_: dict = Depends(get_current_admin)):
    extra = load_extra_admins()
    result = [{
        "username": config.ADMIN_USERNAME,
        "display_name": "最高管理員（ADMIN）",
        "is_super": True,
        "created_at": None,
    }]
    for a in extra:
        result.append({
            "username": a["username"],
            "display_name": a.get("display_name", a["username"]),
            "is_super": False,
            "created_at": a.get("created_at"),
        })
    return {"data": result}


@router.post("")
def create_user(body: CreateUserBody, _: dict = Depends(get_super_admin)):
    if body.username == config.ADMIN_USERNAME:
        raise HTTPException(400, "不能使用此名稱")
    if len(body.password) < 6:
        raise HTTPException(422, "密碼至少需要 6 個字元")
    data = _load()
    if any(a["username"] == body.username for a in data.get("data", [])):
        raise HTTPException(409, f"用戶「{body.username}」已存在")
    data.setdefault("data", []).append({
        "username": body.username,
        "password_hash": hash_password(body.password),
        "display_name": body.display_name or body.username,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    })
    _save(data)
    return {"message": f"已新增管理員「{body.username}」"}


@router.patch("/{username}")
def update_user(username: str, body: UpdateUserBody, _: dict = Depends(get_super_admin)):
    if username == config.ADMIN_USERNAME:
        raise HTTPException(400, "無法修改最高管理員帳號")
    data = _load()
    target = next((a for a in data.get("data", []) if a["username"] == username), None)
    if not target:
        raise HTTPException(404, f"找不到用戶「{username}」")
    if body.password is not None:
        if len(body.password) < 6:
            raise HTTPException(422, "密碼至少需要 6 個字元")
        target["password_hash"] = hash_password(body.password)
    if body.display_name is not None:
        target["display_name"] = body.display_name
    _save(data)
    return {"message": f"已更新「{username}」"}


@router.delete("/{username}")
def delete_user(username: str, _: dict = Depends(get_super_admin)):
    if username == config.ADMIN_USERNAME:
        raise HTTPException(400, "無法刪除最高管理員")
    data = _load()
    before = len(data.get("data", []))
    data["data"] = [a for a in data.get("data", []) if a["username"] != username]
    if len(data["data"]) == before:
        raise HTTPException(404, f"找不到用戶「{username}」")
    _save(data)
    return {"message": f"已刪除「{username}」"}
