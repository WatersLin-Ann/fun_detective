# fun_detective 开机自启注册脚本
# 无需管理员权限，写入当前用户注册表 Run 键
# 用法: 右键 -> 使用 PowerShell 运行，或直接双击

$ErrorActionPreference = "Stop"

$name = "fun_detective"
$vbsPath = "E:\Work\AIProjects\fun_detective\start-hidden.vbs"
$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

if (-not (Test-Path $vbsPath)) {
    Write-Host "[错误] 未找到 $vbsPath" -ForegroundColor Red
    exit 1
}

# 写入注册表
Set-ItemProperty -Path $runKey -Name $name -Value "wscript.exe `"$vbsPath`""

Write-Host ""
Write-Host "[成功] 开机自启已注册" -ForegroundColor Green
Write-Host "  注册表: HKCU\Software\Microsoft\Windows\CurrentVersion\Run\$name"
Write-Host "  命令: wscript.exe `"$vbsPath`""
Write-Host "  生效: 下次用户登录时自动启动"
Write-Host ""
Write-Host "管理命令:"
Write-Host "  查看自启: Get-ItemProperty '$runKey' -Name '$name'"
Write-Host "  卸载自启: .\uninstall-autostart.ps1"
Write-Host "  手动启动: .\start-server.bat"
Write-Host "  手动停止: .\stop-server.bat"
Write-Host ""
