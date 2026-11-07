# Vite breaks when the repo path contains %, ^, or & (URI malformed in decodeURIComponent).
# Maps the repo to drive S: so dev runs from a clean path.
$ErrorActionPreference = 'Stop'

$drive = 'S:'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if ($repoRoot -match '[%&^]') {
    Write-Host ""
    Write-Host "NOTE: Folder path contains %, ^, or & — Vite may show 'URI malformed' on this machine." -ForegroundColor Yellow
    Write-Host "Best fix: move the repo to a simple path, e.g. C:\dev\sellmygoods" -ForegroundColor Yellow
    Write-Host "Workaround: using drive ${drive} mapping for this session..." -ForegroundColor Yellow
    Write-Host ""
}

Set-Location $repoRoot
cmd /c "subst $drive /d" 2>$null | Out-Null
Start-Sleep -Milliseconds 150
$substResult = cmd /c "subst $drive `"$repoRoot`"" 2>&1
if ($LASTEXITCODE -ne 0 -and $substResult -notmatch 'already SUBSTed') {
    Write-Host $substResult -ForegroundColor Red
    exit 1
}
Write-Host "Mapped $repoRoot -> ${drive}\"
Write-Host "Starting Vite at http://127.0.0.1:3000 (API proxy -> localhost:8000)"
Set-Location "${drive}\frontend"

try {
    & node ".\node_modules\vite\bin\vite.js" --host 127.0.0.1
} finally {
    subst $drive /D 2>$null | Out-Null
}
