# Start the portable PostgreSQL used by local Tabellone (Windows, no Docker).
$ErrorActionPreference = "Stop"
$appRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$workspace = $null
$cursor = $appRoot
while ($cursor) {
    if (Test-Path (Join-Path $cursor "pgsql-extract\pgsql\bin\pg_ctl.exe")) {
        $workspace = $cursor
        break
    }
    $parent = Split-Path -Parent $cursor
    if ($parent -eq $cursor) { break }
    $cursor = $parent
}

if (-not $workspace) {
    Write-Host "ERROR: Portable Postgres (pgsql-extract) was not found." -ForegroundColor Red
    Write-Host "If you use Docker instead: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

$pgCtl = Join-Path $workspace "pgsql-extract\pgsql\bin\pg_ctl.exe"
$dataDir = Join-Path $workspace "pgdata"
$logFile = Join-Path $workspace "pg.log"

$pidFile = Join-Path $dataDir "postmaster.pid"
if (Test-Path $pidFile) {
    $oldPid = (Get-Content $pidFile -TotalCount 1).Trim()
    if (-not (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
        Remove-Item $pidFile -Force
    }
}

& $pgCtl start -D $dataDir -l $logFile -w
& (Join-Path $workspace "pgsql-extract\pgsql\bin\pg_isready.exe") -h 127.0.0.1 -p 5432
