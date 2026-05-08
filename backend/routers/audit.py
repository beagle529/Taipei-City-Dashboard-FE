import json
from fastapi import APIRouter, Depends, Query
from utils.auth import get_current_admin, LOGIN_LOG_FILE

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logins")
def get_login_log(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_admin),
):
    if not LOGIN_LOG_FILE.exists():
        return {"data": [], "total": 0, "page": page, "page_size": page_size}
    try:
        all_data = json.loads(LOGIN_LOG_FILE.read_text(encoding="utf-8")).get("data", [])
    except Exception:
        all_data = []
    total = len(all_data)
    start = (page - 1) * page_size
    return {
        "data": all_data[start: start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
