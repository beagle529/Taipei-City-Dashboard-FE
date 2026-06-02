"""
快速連結管理 API
GET  /api/quicklinks       — 公開，NavBar 讀取用
PUT  /api/quicklinks       — 需登入，後台修改用
"""

import json
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List

from utils.auth import get_current_admin

router = APIRouter()

# 存放位置：backend 目錄下的 quicklinks.json
DATA_FILE = Path(__file__).parent.parent / "quicklinks.json"

# 預設值（第一次沒有檔案時使用）
DEFAULTS = [
    {"label": "市場幹部儀表板",    "url": "./index-1.html"},
    {"label": "台灣農業氣象地圖",  "url": "http://192.168.127.42:8000"},
    {"label": "Whisper 語音轉文字","url": "/faster-whisper"},
    {"label": "北農 AI 助理",      "url": "/beinong-ai"},
    {"label": "合署辦公室交接系統","url": "https://6c0a-118-163-154-151.ngrok-free.app"},
]


class QuickLink(BaseModel):
    label: str
    url: str


def _read() -> list:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return DEFAULTS


def _write(data: list):
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ── 公開讀取（NavBar 使用）────────────────────────────────────────
@router.get("/quicklinks")
def get_quicklinks():
    return _read()


# ── 需登入才能修改（後台使用）────────────────────────────────────
@router.put("/quicklinks")
def update_quicklinks(links: List[QuickLink], user=Depends(get_current_admin)):
    data = [lnk.dict() for lnk in links]
    _write(data)
    return {"message": "已儲存", "count": len(data)}


# ── Tunnel URL 自動更新（cloudflared 腳本專用）────────────────────
class TunnelUpdate(BaseModel):
    label: str   # 要更新的快速連結名稱
    url: str     # 新的 tunnel URL

@router.post("/quicklinks/tunnel")
def update_tunnel_url(body: TunnelUpdate, x_tunnel_key: str = Header(...)):
    secret = os.environ.get("TUNNEL_SECRET", "")
    if not secret or x_tunnel_key != secret:
        raise HTTPException(status_code=403, detail="金鑰錯誤")

    data = _read()
    updated = False
    for item in data:
        if item.get("label") == body.label:
            item["url"] = body.url
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail=f"找不到連結：{body.label}")

    _write(data)
    return {"message": "已更新", "label": body.label, "url": body.url}
