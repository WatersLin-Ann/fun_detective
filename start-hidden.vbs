' fun_detective 无窗口启动器
' 供 Windows 开机自启调用，完全不显示控制台窗口
' 使用系统安装的 node.exe，不依赖豆包沙箱环境
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "E:\Work\AIProjects\fun_detective"
WshShell.Run """D:\Program Files\nodejs\node.exe"" server.js", 0, False
