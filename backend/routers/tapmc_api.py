"""
TAPMC 背板系統 API
對應 server.js 的功能，整合進 FastAPI（port 80）

路由（全部掛在 /api/tapmc/ 下，避免與儀表板 /api/data/ 衝突）：
  GET  /api/tapmc/ping                    健康檢查
  GET  /api/tapmc/data/{filename}         讀取 JSON 設定
  POST /api/tapmc/data/{filename}         儲存 JSON 設定
  POST /api/tapmc/media/img/{img_id}      儲存 Base64 圖片
  POST /api/tapmc/media/vid/{vid_id}      儲存影片 Blob
  GET  /api/tapmc/media/{filename}        讀取媒體檔（含 HEAD）
  DELETE /api/tapmc/media/{filename}      刪除媒體檔
"""

import re
import io
import json
import base64
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse, Response

router = APIRouter(prefix="/tapmc")

# 資料儲存位置（tapmc 目錄下的 data/ 和 media/）
_TAPMC   = Path(__file__).parent.parent.parent / "tapmc"
DATA_DIR  = _TAPMC / "data"
MEDIA_DIR = _TAPMC / "media"
DATA_DIR.mkdir(parents=True, exist_ok=True)
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


def _safe(name: str) -> bool:
    """防止目錄穿越：只允許字母/數字/底線/連字號 + 最多一個點號"""
    return (
        isinstance(name, str) and
        0 < len(name) <= 128 and
        bool(re.match(r'^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]{1,10})?$', name))
    )


# ── 健康檢查 ──────────────────────────────────────────────────────
@router.get("/ping")
def ping():
    return {"ok": True, "version": "1.0"}


# ── 圖片格式轉換（TIF/TIFF → JPEG，使用 Pillow）─────────────────────
@router.post("/convert-image")
async def convert_image(file: UploadFile = File(...)):
    """
    接受任意圖片格式（含 TIF/TIFF），轉換為 JPEG base64 dataUrl 回傳。
    最大尺寸限縮至 1920×1080，品質 85%。
    """
    try:
        from PIL import Image  # 延遲匯入，未安裝時給清楚錯誤
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="伺服器未安裝 Pillow，請執行 pip install Pillow"
        )

    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data))
        # 取第一頁（多頁 TIFF 只取第一頁）
        img.seek(0) if hasattr(img, 'seek') else None
        # 轉成 RGB（CMYK / P / RGBA 等模式都先轉換）
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        # 限縮尺寸
        MAX_W, MAX_H = 1920, 1080
        if img.width > MAX_W or img.height > MAX_H:
            ratio = min(MAX_W / img.width, MAX_H / img.height)
            new_w = max(1, int(img.width  * ratio))
            new_h = max(1, int(img.height * ratio))
            img = img.resize((new_w, new_h), Image.LANCZOS)
        # 編碼為 JPEG
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        return {"dataUrl": f"data:image/jpeg;base64,{b64}",
                "width": img.width, "height": img.height}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"無法轉換圖片：{e}")


# ── JSON 資料（presets / seq steps 等） ──────────────────────────
@router.get("/data/{filename}")
def get_data(filename: str):
    if not _safe(filename) or not filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="非法檔名")
    f = DATA_DIR / filename
    if not f.exists():
        # 檔案尚未建立時回傳適當的空預設值（200 OK），避免前端出現 404 紅字
        _ARRAY_FILES = {"tapmc_presets.json", "tapmc_elements.json", "tapmc_ticker.json"}
        default = "[]" if filename in _ARRAY_FILES else "null"
        return Response(content=default, media_type="application/json; charset=utf-8")
    return Response(
        content=f.read_text(encoding="utf-8"),
        media_type="application/json; charset=utf-8"
    )


@router.post("/data/{filename}")
async def save_data(filename: str, request: Request):
    if not _safe(filename) or not filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="非法檔名")
    body = await request.body()
    try:
        json.loads(body)   # 驗證 JSON 格式
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"無效 JSON：{e}")
    (DATA_DIR / filename).write_bytes(body)
    return {"ok": True}


# ── 圖片（Base64 dataUrl → JPG） ─────────────────────────────────
@router.post("/media/img/{img_id}")
async def save_image(img_id: str, request: Request):
    if not _safe(img_id):
        raise HTTPException(status_code=400, detail="非法 id")
    body = await request.json()
    data_url = body.get("dataUrl", "")
    b64 = re.sub(r'^data:image/\w+;base64,', '', data_url)
    if not b64:
        raise HTTPException(status_code=400, detail="缺少 dataUrl")
    try:
        (MEDIA_DIR / f"img_{img_id}.jpg").write_bytes(base64.b64decode(b64))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


# ── 影片（原始 Blob，副檔名由 X-Extension header 指定） ───────────
@router.post("/media/vid/{vid_id}")
async def save_video(vid_id: str, request: Request):
    if not _safe(vid_id):
        raise HTTPException(status_code=400, detail="非法 id")
    raw_ext = request.headers.get("x-extension", "mp4").lower()
    ext = raw_ext if re.match(r'^[a-z0-9]{1,6}$', raw_ext) else "mp4"
    body = await request.body()
    (MEDIA_DIR / f"vid_{vid_id}.{ext}").write_bytes(body)
    # 記錄副檔名對應，供後續查找
    (DATA_DIR / f"vid_ext_{vid_id}.txt").write_text(ext, encoding="utf-8")
    return {"ok": True, "ext": ext}


# ── 媒體讀取（GET / HEAD） ────────────────────────────────────────
@router.get("/media/{filename}")
@router.head("/media/{filename}")
def get_media(filename: str):
    if not _safe(filename):
        raise HTTPException(status_code=400, detail="非法檔名")
    f = MEDIA_DIR / filename
    if not f.exists():
        raise HTTPException(status_code=404, detail="找不到媒體檔")
    return FileResponse(f)


# ── 媒體刪除 ─────────────────────────────────────────────────────
@router.delete("/media/{filename}")
def delete_media(filename: str):
    if not _safe(filename):
        raise HTTPException(status_code=400, detail="非法檔名")
    f = MEDIA_DIR / filename
    if f.exists():
        f.unlink()
    return {"ok": True}
