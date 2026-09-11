@echo off
REM PowerShell を使わずに直接実行
cd /d %~dp0

REM 既存の node プロセスを終了
taskkill /F /IM node.exe >nul 2>&1

timeout /t 2 /nobreak >nul

REM サーバーを起動
echo 🚀 サーバーを起動します...
cd server
start /B node start-server-simple.js
