@echo off
cd /d C:\Users\yukit\resource-allocation-app

echo 🔄 Git status を確認中...
"C:\Program Files\Git\bin\git.exe" status

echo.
echo 📝 変更をステージング中...
"C:\Program Files\Git\bin\git.exe" add -A

echo.
echo 💾 Commit 作成中...
"C:\Program Files\Git\bin\git.exe" commit -m "feat: MySQL migration completed - database switched to production environment"

echo.
echo 🚀 GitHub に push 中...
"C:\Program Files\Git\bin\git.exe" push origin main

echo.
echo ✅ GitHub push 完了！
