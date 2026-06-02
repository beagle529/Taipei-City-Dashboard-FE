from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import json
from utils.auth import get_current_admin

router = APIRouter(prefix="/issues", tags=["issues"])

ISSUES_FILE = Path(__file__).parent.parent / "data" / "issue_log.json"


def _load():
    if not ISSUES_FILE.exists():
        return {"data": []}
    return json.loads(ISSUES_FILE.read_text(encoding="utf-8"))


def _save(data):
    ISSUES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent="\t"), encoding="utf-8")


class IssueBody(BaseModel):
    component_id: int
    component_name: str
    type: str
    description: str
    name: str


@router.post("")
def submit_issue(body: IssueBody):
    data = _load()
    data["data"].insert(0, {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "component_id": body.component_id,
        "component_name": body.component_name,
        "type": body.type,
        "description": body.description,
        "name": body.name,
        "resolved": False,
    })
    _save(data)
    return {"message": "回報成功，感謝您的意見"}


@router.get("")
def list_issues(admin=Depends(get_current_admin)):
    data = _load()
    return {"data": data["data"], "total": len(data["data"])}


@router.patch("/{index}")
def update_issue(index: int, resolved: bool, admin=Depends(get_current_admin)):
    data = _load()
    items = data["data"]
    if index < 0 or index >= len(items):
        raise HTTPException(status_code=404, detail="Not found")
    items[index]["resolved"] = resolved
    _save(data)
    return {"message": "updated"}
