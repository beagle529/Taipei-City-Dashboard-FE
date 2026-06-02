from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from utils.auth import authenticate, create_access_token, get_current_admin, log_login
import config

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(body: LoginRequest, request: Request):
    ip = request.client.host if request.client else ""
    if not config.ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=500, detail="後端尚未設定密碼，請檢查 .env")
    user = authenticate(body.username, body.password)
    if not user:
        log_login(body.username, success=False, ip=ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="帳號或密碼錯誤")
    log_login(body.username, success=True, ip=ip)
    token = create_access_token({"sub": user["username"], "is_super": user["is_super"]})
    return {"access_token": token, "token_type": "bearer", "is_super": user["is_super"]}


@router.get("/me")
def me(admin: dict = Depends(get_current_admin)):
    return {"username": admin["username"], "is_super": admin["is_super"]}
