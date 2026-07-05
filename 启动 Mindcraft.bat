@echo off
chcp 65001 >nul
title Mindcraft
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-mindcraft.ps1"
exit /b %ERRORLEVEL%
