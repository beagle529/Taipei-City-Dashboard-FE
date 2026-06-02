import json
from datetime import datetime, timedelta
from pathlib import Path
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
ADMINS_FILE = DATA_DIR / "admins.json"
LOGIN_LOG_FILE = DATA_DIR / "login_log.json"


def log_login(username: str, success: bool, ip: str = ""):
    try:
        data = {"data": []}
        if LOGIN_LOG_FILE.exists():
            data = json.loads(LOGIN_LOG_FILE.read_text(encoding="utf-8"))
        data["data"].insert(0, {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "username": username,
            "success": success,
            "ip": ip,
        })
        data["data"] = data["data"][:1000]
        LOGIN_LOG_FILE.write_text(json.dumps(data, ensure_ascii=False, indent="\t"), encoding="utf-8")
    except Exception:
        pass


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=config.ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)


def load_extra_admins() -> list:
    if not ADMINS_FILE.exists():
        return []
    try:
        return json.loads(ADMINS_FILE.read_text(encoding="utf-8")).get("data", [])
    except Exception:
        return []


def authenticate(username: str, password: str):
    """Returns {"username": ..., "is_super": bool} or None."""
    if username == config.ADMIN_USERNAME:
        if config.ADMIN_PASSWORD_HASH and verify_password(password, config.ADMIN_PASSWORD_HASH):
            return {"username": username, "is_super": True}
        return None
    for admin in load_extra_admins():
        if admin["username"] == username:
            if verify_password(password, admin.get("password_hash", "")):
                return {"username": username, "is_super": False}
            return None
    return None


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Returns {"username": ..., "is_super": bool}. Raises 401 on bad token."""
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    try:
        payload = jwt.decode(credentials.credentials, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise exc
        # Verify the user still exists and resolve is_super from live data
        if username == config.ADMIN_USERNAME:
            is_super = True
        else:
            extras = load_extra_admins()
            if not any(a["username"] == username for a in extras):
                raise exc
            is_super = False
        return {"username": username, "is_super": is_super}
    except JWTError:
        raise exc


def get_super_admin(admin: dict = Depends(get_current_admin)) -> dict:
    """Dependency that requires the super-admin role."""
    if not admin.get("is_super"):
        raise HTTPException(status_code=403, detail="需要最高管理員權限")
    return admin
