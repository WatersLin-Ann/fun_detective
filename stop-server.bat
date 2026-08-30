@echo off
chcp 65001 >nul

echo ========================================
echo   fun_detective 服务停止
echo ========================================

set "found=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4321" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel%==0 (
        echo.
        echo [成功] 已停止服务 (PID: %%a)
        set "found=1"
    )
)

if "%found%"=="0" (
    echo.
    echo [提示] 未找到运行中的服务
)
echo.
pause
