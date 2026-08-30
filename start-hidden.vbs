' fun_detective 无窗口启动器
' 供 Windows 任务计划程序调用，完全不显示控制台窗口
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "E:\Work\AIProjects\fun_detective"
WshShell.Run "node server.js", 0, False
