# Start FastAPI (8000) + Vite (3000). Use from repo root: npm run dev:all
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Test-PortInUse([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return [bool]$conn
}

if (-not (Test-PortInUse 8000)) {
    Write-Host "Starting backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
    Start-Process -FilePath "python" -ArgumentList "run_server.py" -WorkingDirectory $root -WindowStyle Minimized
    $deadline = (Get-Date).AddSeconds(45)
    while (-not (Test-PortInUse 8000) -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500
    }
    if (-not (Test-PortInUse 8000)) {
        Write-Host "Backend did not start on port 8000. Run manually: npm run dev:backend" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Port 8000 already in use — assuming backend is running." -ForegroundColor Yellow
}

Write-Host "Starting frontend (Vite) ..." -ForegroundColor Cyan
Set-Location (Join-Path $root "frontend")
& npm run dev:win
