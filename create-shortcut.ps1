$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\DateCopy.lnk")
$Shortcut.TargetPath = "E:\myPrograms\dataCopy\src-tauri\target\release\datecopy.exe"
$Shortcut.WorkingDirectory = "E:\myPrograms\dataCopy\src-tauri\target\release"
$Shortcut.IconLocation = "E:\myPrograms\dataCopy\src-tauri\target\release\datecopy.exe,0"
$Shortcut.Save()
Write-Host "Desktop shortcut created: $DesktopPath\DateCopy.lnk"
