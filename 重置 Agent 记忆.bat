@echo off
chcp 65001 >nul
title Reset Mindcraft Agent Memory
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\reset-agent-memory.ps1"
exit /b %ERRORLEVEL%
