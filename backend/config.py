from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

# ── 系統版本（更新時同步修改此處）──────────────────────────────────
SYSTEM_VERSION: str = os.getenv("SYSTEM_VERSION", "v1.2.0")

ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH: str = os.getenv("ADMIN_PASSWORD_HASH", "")
SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
ALGORITHM = "HS256"

_public_dir = os.getenv("PUBLIC_DIR", "../public")
PUBLIC_DIR = Path(__file__).parent / _public_dir
CHART_DATA_DIR = PUBLIC_DIR / "chartData"
HISTORY_DATA_DIR = PUBLIC_DIR / "historyData"
COMPONENTS_FILE = PUBLIC_DIR / "dashboards" / "all_components.json"
DASHBOARDS_FILE = PUBLIC_DIR / "dashboards" / "all_dashboards.json"
CONTRIBUTORS_FILE = PUBLIC_DIR / "dashboards" / "all_contributors.json"

# ── 後端資料目錄 ──────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
MARKET_PRICE_HISTORY_FILE = DATA_DIR / "market_price_history.json"
QUICKLINKS_FILE = Path(__file__).parent / "quicklinks.json"
