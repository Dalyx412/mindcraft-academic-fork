# Mindcraft one-click agent memory reset (Windows)
# Usage: powershell -File scripts/reset-agent-memory.ps1

param(
    [switch]$DryRunOnly,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "!! $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "XX $msg" -ForegroundColor Red }

function Wait-Close {
    if (-not $NoPause) {
        Read-Host 'Press Enter to close'
    }
}

function Get-RunningMindcraftProcesses {
    try {
        $rootPattern = [regex]::Escape($Root)
        Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
            Where-Object {
                $_.CommandLine -and
                ($_.CommandLine -match $rootPattern) -and
                ($_.CommandLine -match '(^|[\\/\s"])main\.js($|[\s"])')
            }
    } catch {
        Write-Warn "Could not inspect running processes: $_"
        @()
    }
}

Write-Host ''
Write-Host '  Mindcraft Agent Memory Reset' -ForegroundColor Green
Write-Host "  Project: $Root"
Write-Host ''
Write-Host '  This resets runtime agent memory only.'
Write-Host '  Kept: settings.js, profiles, source files, templates, and launcher files.'
Write-Host '  Removed: bots/*/memory.json, bots/*/histories, bots/shared_task_state.json.'
Write-Host ''

Write-Step 'Checking whether Mindcraft is running'
$running = @(Get-RunningMindcraftProcesses)
if ($running.Count -gt 0) {
    Write-Err 'Mindcraft appears to be running. Stop the agents first, then run this reset again.'
    $running | Select-Object ProcessId, CommandLine | Format-List
    Wait-Close
    exit 1
}
Write-Host '  No running Mindcraft agent process detected.' -ForegroundColor Green

Write-Step 'Checking Node.js'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err 'Node.js not found. Install Node.js 18 or 20 LTS from https://nodejs.org/'
    Wait-Close
    exit 1
}
Write-Host "  $(node -v)"

Write-Step 'Previewing reset scope'
npm run reset:memory:dry
if ($LASTEXITCODE -ne 0) {
    Write-Err "Dry-run failed with code $LASTEXITCODE"
    Wait-Close
    exit $LASTEXITCODE
}

if ($DryRunOnly) {
    Write-Host ''
    Write-Host 'Dry-run only. No memory files were removed.' -ForegroundColor Green
    Wait-Close
    exit 0
}

Write-Step 'Resetting agent memory'
npm run reset:memory
$code = $LASTEXITCODE
if ($code -ne 0) {
    Write-Err "Reset failed with code $code"
    Wait-Close
    exit $code
}

Write-Host ''
Write-Host 'Agent memory reset complete. Start Mindcraft when you are ready for the next task round.' -ForegroundColor Green
Wait-Close
exit 0
