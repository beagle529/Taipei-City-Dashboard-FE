/**
 * 臺北農產背板系統 — 伺服器連線設定
 *
 * TAPMC_API_BASE：Python uvicorn 後端的根位址
 *
 * 設定方式：
 *   空字串（預設）  → 相對路徑，適用於從伺服器本機開啟（推薦）
 *                     用 http://192.168.127.42/tapmc/admin.html 存取即可
 *   對外 ngrok     → 'https://xxxx.ngrok-free.app'（改成你的 ngrok URL）
 *
 * ⚠️  不要填 localhost:8080（那是舊的 Node.js，已棄用）
 * 修改後需重新整理所有瀏覽器視窗。
 */
window.TAPMC_API_BASE = '';
