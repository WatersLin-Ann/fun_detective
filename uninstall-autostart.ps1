# fun_detective 开机自启卸载脚本
# 以管理员身份运行: 右键 -> 使用 PowerShell 运行

$ErrorActionPreference = "Stop"

$taskName = "fun_detective_web_server"

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[提示] 未找到任务 '$taskName'，无需卸载" -ForegroundColor Yellow
    exit 0
}

# 先停止正在运行的实例
Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

# 注销任务
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false

Write-Host ""
Write-Host "[成功] 开机自启任务已卸载" -ForegroundColor Green
Write-Host "  任务名: $taskName"
Write-Host "  注意: 当前正在运行的服务进程不会被自动停止"
Write-Host "        如需停止，请运行 stop-server.bat"
Write-Host ""
