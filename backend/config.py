from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

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
