from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, Response
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from routers import auth, data, components, dashboards, admin_users, backup, audit, issues, market_price, datasource, quicklinks, tapmc_api

# ── Scheduler ──
scheduler = AsyncIOScheduler(timezone="Asia/Taipei")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 每天早上 08:00（台北時間）自動抓取行情並存入歷史紀錄
    scheduler.add_job(
        market_price.scheduled_daily_fetch,
        CronTrigger(hour=8, minute=0, timezone="Asia/Taipei"),
        id="daily_market_price",
        replace_existing=True,
        misfire_grace_time=3600,   # 若錯過可在 1 小時內補跑
    )
    # 從 datasources.json 載入並註冊所有組件的定期來源排程
    datasource.init_scheduler(scheduler)
    scheduler.start()
    print("[scheduler] started – daily market-price fetch at 08:00 Asia/Taipei")
    yield
    scheduler.shutdown()
    print("[scheduler] stopped")


app = FastAPI(title="Dashboard Admin API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允許所有來源（內網部署）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api")
app.include_router(data.router,         prefix="/api")
app.include_router(components.router,   prefix="/api")
app.include_router(dashboards.router,   prefix="/api")
app.include_router(admin_users.router,  prefix="/api")
app.include_router(backup.router,       prefix="/api")
app.include_router(audit.router,        prefix="/api")
app.include_router(issues.router,       prefix="/api")
app.include_router(market_price.router, prefix="/api")
app.include_router(datasource.router,   prefix="/api")
app.include_router(quicklinks.router,   prefix="/api")
app.include_router(tapmc_api.router,    prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── 瀏覽器自動要求的圖示檔（回 204 避免 404 log 噪音）──────────
_ICON_PATHS = [
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
    "/apple-touch-icon-120x120.png",
    "/apple-touch-icon-120x120-precomposed.png",
]
for _p in _ICON_PATHS:
    app.add_api_route(_p, lambda: Response(status_code=204), methods=["GET"])

# ── 根路徑重導向到儀表板 ──────────────────────────────────────────
@app.get("/")
def root_redirect():
    return RedirectResponse(url="/dashboard-demo/", status_code=302)


# ── 根目錄 HTML 檔案（白名單，僅允許指定頁面）──────────────────
ROOT = Path(__file__).parent.parent

# 明確列出允許公開存取的 HTML 檔案（不含 .html）
_ALLOWED_HTML = {"index", "index-1"}

@app.get("/{filename}.html")
def serve_root_html(filename: str):
    if filename not in _ALLOWED_HTML:
        raise HTTPException(status_code=404, detail="Not found")
    f = ROOT / f"{filename}.html"
    if f.exists():
        return FileResponse(f, media_type="text/html")
    raise HTTPException(status_code=404, detail="Not found")


# ── tapmc 靜態網站（明確路由，只攔截 tapmc，不影響 assets 等）──
_TAPMC_ROOT = ROOT / "tapmc"

@app.get("/dashboard-demo/tapmc/{file_path:path}")
def serve_tapmc(file_path: str):
    f = (_TAPMC_ROOT / file_path).resolve()
    # 路徑穿越防護
    if not str(f).startswith(str(_TAPMC_ROOT.resolve())):
        raise HTTPException(status_code=404)
    if f.exists() and f.is_file():
        return FileResponse(f)
    raise HTTPException(status_code=404)


# ── 靜態前端檔案（放在最後，避免攔截 /api 路由）──────────────────
DIST = Path(__file__).parent.parent / "dist"
if DIST.exists():
    # 掛載所有靜態資源子目錄（順序重要：先掛靜態，catch-all 最後）
    for _sub in ["assets", "mapData", "dashboards", "chartData", "historyData"]:
        _dir = DIST / _sub
        if _dir.exists():
            app.mount(f"/dashboard-demo/{_sub}", StaticFiles(directory=_dir), name=_sub)

    # 所有其他路由回傳 index.html（Vue Router history mode）
    @app.get("/dashboard-demo/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(DIST / "index.html")
