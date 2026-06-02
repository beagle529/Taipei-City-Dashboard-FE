@echo off
chcp 65001 > nul
title 臺北農產 51 週年背板系統

echo.
echo  臺北農產 51 週年股東常會 背板系統
echo  ======================================
echo  正在啟動本地伺服器，請稍候...
echo.

node server.js

echo.
echo  伺服器已停止。
pause
