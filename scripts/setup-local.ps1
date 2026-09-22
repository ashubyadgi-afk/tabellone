# Tabellone — local setup from GitHub (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts\setup-local.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "Tabellone local setup..." -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker not found. Install Docker Desktop and start it." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example (no edits required)" -ForegroundColor Green
} else {
    Write-Host ".env already exists — keeping it" -ForegroundColor Yellow
}

Write-Host "Starting PostgreSQL..." -ForegroundColor Cyan
docker compose up -d
Start-Sleep -Seconds 5

Write-Host "Installing npm packages..." -ForegroundColor Cyan
npm.cmd install

Write-Host "Applying database schema..." -ForegroundColor Cyan
npm.cmd run db:push

Write-Host "Seeding demo data..." -ForegroundColor Cyan
npm.cmd run db:seed

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "  Run:  npm.cmd run dev" -ForegroundColor White
Write-Host "  Open: http://localhost:3000" -ForegroundColor White
Write-Host "  Demo: owner@demo.tabellone.com / demo1234" -ForegroundColor White
