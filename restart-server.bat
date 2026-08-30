@echo off
chcp 65001 >nul
cd /d "E:\Work\AIProjects\fun_detective"

set "NODE_EXE=D:\Program Files\nodejs\node.exe"

echo ========================================
echo   fun_detective 服务重启
echo ========================================

:: 先停止
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4321" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [停止] 已终止旧进程 (PID: %%a)
)

timeout /t 1 >nul

:: 再启动（使用系统 node）
powershell -NoProfile -Command "Start-Process -FilePath '%NODE_EXE%' -ArgumentList 'server.js' -WorkingDirectory '%CD%' -WindowStyle Hidden"

timeout /t 2 >nul

netstat -ano | findstr ":4321" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo.
    echo [成功] 服务已重启
    echo        地址: http://127.0.0.1:4321/fun_detective/
) else (
    echo.
    echo [失败] 重启失败，请查看 server.log
)
echo.
pause
