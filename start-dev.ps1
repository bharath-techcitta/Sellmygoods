# Start backend + frontend locally (Windows). Frontend uses subst drive to avoid Vite URI errors.
$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot

Write-Host "Starting backend on http://127.0.0.1:8000 ..."
Start-Process -FilePath 'python' -ArgumentList 'run_server.py' -WorkingDirectory $repoRoot -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting frontend (dev-win.ps1) on http://127.0.0.1:3000 ..."
Set-Location (Join-Path $repoRoot 'frontend')
& powershell -NoProfile -ExecutionPolicy Bypass -File '.\dev-win.ps1'
