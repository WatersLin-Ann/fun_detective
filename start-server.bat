@echo off
chcp 65001 >nul
cd /d "E:\Work\AIProjects\fun_detective"

set "NODE_EXE=D:\Program Files\nodejs\node.exe"

echo ========================================
echo   fun_detective 服务启动
echo ========================================

:: 检查端口是否已被占用
netstat -ano | findstr ":4321" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo.
    echo [提示] 服务已在运行中 (端口 4321)
    echo        地址: http://127.0.0.1:4321/fun_detective/
    echo.
    pause
    exit /b 0
)

:: 隐藏窗口后台启动 node server.js
powershell -NoProfile -Command "Start-Process -FilePath '%NODE_EXE%' -ArgumentList 'server.js' -WorkingDirectory '%CD%' -WindowStyle Hidden"

:: 等待一下让服务启动
timeout /t 2 >nul

:: 验证是否启动成功
netstat -ano | findstr ":4321" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo.
    echo [成功] 服务已后台启动
    echo        地址: http://127.0.0.1:4321/fun_detective/
    echo        日志: server.log
) else (
    echo.
    echo [失败] 服务启动失败，请查看 server.log
)
echo.
pause
