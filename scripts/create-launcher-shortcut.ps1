$Root = Split-Path -Parent $PSScriptRoot
$Bat = Join-Path $Root '启动 Mindcraft.bat'
$Lnk = Join-Path $Root '启动 Mindcraft.lnk'

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($Lnk)
$Shortcut.TargetPath = $Bat
$Shortcut.WorkingDirectory = $Root
$Shortcut.WindowStyle = 1
$Shortcut.Description = 'Start Mindcraft (Minecraft AI agents)'
$Shortcut.Save()

Write-Host "Created shortcut: $Lnk"
