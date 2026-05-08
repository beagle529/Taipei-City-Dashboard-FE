from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, data, components, dashboards, admin_users, backup, audit, issues

app = FastAPI(title="Dashboard Admin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:80", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api")
app.include_router(data.router,       prefix="/api")
app.include_router(components.router,  prefix="/api")
app.include_router(dashboards.router,   prefix="/api")
app.include_router(admin_users.router,  prefix="/api")
app.include_router(backup.router,       prefix="/api")
app.include_router(audit.router,        prefix="/api")
app.include_router(issues.router,       prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
