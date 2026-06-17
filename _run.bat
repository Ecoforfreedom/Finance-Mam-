@echo off
chcp 65001 >nul
pushd "%~dp0"
git add -A
git commit -m "chore(layout): localize sidebar subtitle"
echo === BUILD ===
call npm run build
echo === STATUS ===
git status -s
git log --oneline -3
popd
