# fun_detective 开机自启注册脚本
# 以管理员身份运行: 右键 -> 使用 PowerShell 运行

$ErrorActionPreference = "Stop"

$taskName = "fun_detective_web_server"
$projectDir = "E:\Work\AIProjects\fun_detective"
$vbsPath = Join-Path $projectDir "start-hidden.vbs"
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $nodePath) {
    Write-Error "未找到 node.exe，请先安装 Node.js 并确保在 PATH 中"
    exit 1
}

if (-not (Test-Path $vbsPath)) {
    Write-Error "未找到 $vbsPath"
    exit 1
}

# 检查是否已存在同名任务
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[提示] 已存在任务 '$taskName'，将覆盖更新..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# 创建动作: 用 wscript 运行无窗口启动器
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsPath`"" -WorkingDirectory $projectDir

# 触发器: 用户登录时
$trigger = New-ScheduledTaskTrigger -AtLogOn

# 设置: 允许电池供电、不限制执行时间、失败后重启
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# 注册任务
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "fun_detective 静态网站服务，开机自启，监听 4321 端口" `
    -Force | Out-Null

Write-Host ""
Write-Host "[成功] 开机自启任务已注册" -ForegroundColor Green
Write-Host "  任务名: $taskName"
Write-Host "  触发: 用户登录时自动启动"
Write-Host "  程序: wscript.exe -> $vbsPath"
Write-Host "  地址: http://127.0.0.1:4321/fun_detective/"
Write-Host ""
Write-Host "管理命令:"
Write-Host "  查看任务: Get-ScheduledTask -TaskName '$taskName'"
Write-Host "  立即启动: Start-ScheduledTask -TaskName '$taskName'"
Write-Host "  停止任务: Stop-ScheduledTask -TaskName '$taskName'"
Write-Host "  卸载自启: .\uninstall-autostart.ps1"
Write-Host ""
