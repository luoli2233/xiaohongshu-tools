@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20 或以上版本。
  pause
  exit /b 1
)
echo 游戏启动后，请打开 http://localhost:4173
echo 关闭此窗口即可停止服务。
node scripts/server.mjs
pause
