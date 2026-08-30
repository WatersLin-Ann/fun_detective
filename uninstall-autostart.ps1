# fun_detective 开机自启卸载脚本
# 无需管理员权限
# 用法: 右键 -> 使用 PowerShell 运行，或直接双击

$ErrorActionPreference = "Stop"

$name = "fun_detective"
$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

$existing = Get-ItemProperty -Path $runKey -Name $name -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[提示] 未找到自启项 '$name'，无需卸载" -ForegroundColor Yellow
    exit 0
}

Remove-ItemProperty -Path $runKey -Name $name

Write-Host ""
Write-Host "[成功] 开机自启已卸载" -ForegroundColor Green
Write-Host "  已删除: HKCU\Software\Microsoft\Windows\CurrentVersion\Run\$name"
Write-Host "  注意: 当前正在运行的服务不会被自动停止"
Write-Host "        如需停止，请运行 stop-server.bat"
Write-Host ""
