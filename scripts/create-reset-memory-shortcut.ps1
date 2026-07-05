$Root = Split-Path -Parent $PSScriptRoot
$Bat = Join-Path $Root '重置 Agent 记忆.bat'
$Lnk = Join-Path $Root '重置 Agent 记忆.lnk'

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($Lnk)
$Shortcut.TargetPath = $Bat
$Shortcut.WorkingDirectory = $Root
$Shortcut.WindowStyle = 1
$Shortcut.Description = 'Reset Mindcraft agent runtime memory'
$Shortcut.Save()

Write-Host "Created shortcut: $Lnk"
