# Mindcraft one-click launcher (Windows)
# Usage: powershell -File scripts/start-mindcraft.ps1

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "!! $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "XX $msg" -ForegroundColor Red }

$configPath = Join-Path $Root 'launcher.config.json'
$config = [ordered]@{
    minecraftServerDir    = ''
    javaCommand           = 'java'
    minecraftPort         = 25565
    waitForMinecraftSeconds = 90
    autoStartMinecraft    = $true
}

if (Test-Path $configPath) {
    try {
        $fileConfig = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($prop in $config.Keys) {
            if ($null -ne $fileConfig.$prop) {
                $config[$prop] = $fileConfig.$prop
            }
        }
    } catch {
        Write-Warn "Could not parse launcher.config.json: $_"
    }
}

function Test-MinecraftPort {
    param([int]$Port)
    $client = $null
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $task = $client.ConnectAsync('127.0.0.1', $Port)
        if (-not $task.Wait(2000)) { return $false }
        return $client.Connected
    } catch {
        return $false
    } finally {
        if ($client) { $client.Dispose() }
    }
}

function Start-MinecraftServer {
    param([string]$ServerDir, [string]$JavaCommand)

    if (-not (Test-Path $ServerDir)) {
        Write-Warn "minecraftServerDir not found: $ServerDir"
        return $false
    }

    $startBat = @(
        (Join-Path $ServerDir 'start.bat'),
        (Join-Path $ServerDir 'run.bat'),
        (Join-Path $ServerDir 'Start.bat')
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($startBat) {
        Write-Host "  Using $startBat"
        Start-Process cmd.exe -ArgumentList '/k', "`"$startBat`"" -WorkingDirectory $ServerDir
        return $true
    }

    $jar = Get-ChildItem -Path $ServerDir -Filter '*.jar' -File |
        Where-Object { $_.Name -notmatch 'installer|forge|fabric' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $jar) {
        Write-Warn "No start.bat or server .jar found in $ServerDir"
        return $false
    }

    $mem = if ($env:MINECRAFT_HEAP) { $env:MINECRAFT_HEAP } else { '2G' }
    $cmd = "cd /d `"$ServerDir`" && $JavaCommand -Xmx$mem -jar `"$($jar.Name)`" nogui"
    Write-Host "  Starting $($jar.Name) in new window"
    Start-Process cmd.exe -ArgumentList '/k', $cmd -WorkingDirectory $ServerDir
    return $true
}

Write-Host ''
Write-Host '  Mindcraft Launcher' -ForegroundColor Green
Write-Host "  Project: $Root"
Write-Host ''

Write-Step 'Checking Node.js'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err 'Node.js not found. Install Node.js 18 or 20 LTS from https://nodejs.org/'
    Read-Host 'Press Enter to close'
    exit 1
}
Write-Host "  $(node -v)"

Write-Step 'Checking keys.json'
if (-not (Test-Path (Join-Path $Root 'keys.json'))) {
    Write-Err 'keys.json not found. Copy keys.example.json to keys.json and add your API keys.'
    Read-Host 'Press Enter to close'
    exit 1
}

Write-Step 'Checking dependencies'
if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
    Write-Warn 'node_modules missing — running npm install (first time may take a few minutes)...'
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Err 'npm install failed'
        Read-Host 'Press Enter to close'
        exit 1
    }
}

$port = [int]$config.minecraftPort
Write-Step "Checking Minecraft server (127.0.0.1:$port)"

if (-not (Test-MinecraftPort -Port $port)) {
    $serverDir = [string]$config.minecraftServerDir
    if ($config.autoStartMinecraft -and $serverDir.Trim()) {
        Write-Step 'Starting Minecraft server'
        $started = Start-MinecraftServer -ServerDir $serverDir -JavaCommand ([string]$config.javaCommand)
        if (-not $started) {
            Write-Warn 'Could not auto-start Minecraft. Start the server manually.'
        }
    } else {
        Write-Warn @"
Minecraft is not running on port $port.

  1. Start your dedicated server (superflat world, offline mode, port $port)
  2. Or copy launcher.config.example.json -> launcher.config.json
     and set minecraftServerDir to your server folder for auto-start.
"@
    }

    Write-Host ''
    Write-Host "Waiting for port $port (up to $($config.waitForMinecraftSeconds)s)..." -ForegroundColor Yellow
    $deadline = (Get-Date).AddSeconds([int]$config.waitForMinecraftSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-MinecraftPort -Port $port) { break }
        Start-Sleep -Seconds 2
        Write-Host "  still waiting..." -ForegroundColor DarkGray
    }

    if (-not (Test-MinecraftPort -Port $port)) {
        Write-Err "Timed out — Minecraft server not detected on port $port."
        Write-Host 'Start the server, then run this launcher again.'
        Read-Host 'Press Enter to close'
        exit 1
    }
}

Write-Host "  Minecraft server ready on port $port." -ForegroundColor Green

Write-Step 'Starting Mindcraft'
Write-Host @"

  Services (auto-open in browser after a few seconds):
    MindServer  http://localhost:8080
    VoiceWeb    http://localhost:3099  (+ ngrok if enabled)

  Press Ctrl+C to stop Mindcraft (Minecraft server keeps running in its own window).

"@

npm start
$code = $LASTEXITCODE
if ($code -ne 0) {
    Write-Err "npm start exited with code $code"
}
Read-Host 'Press Enter to close'
exit $code
