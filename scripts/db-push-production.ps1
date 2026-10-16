# Sync Prisma schema to production Neon (same DB as Vercel).
# 1. Put your Neon pooled URL in .env.production.local as DATABASE_URL=...
#    Or run: npx vercel env pull .env.production.local --environment=production
# 2. Run: npm run db:push:production

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$envFile = Join-Path (Get-Location) ".env.production.local"
if (-not (Test-Path $envFile)) {
  Write-Host "Missing .env.production.local" -ForegroundColor Red
  Write-Host "Copy Neon DATABASE_URL from Vercel (Production) into that file, or run:"
  Write-Host "  npx vercel env pull .env.production.local --environment=production"
  exit 1
}

$databaseUrl = $null
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*DATABASE_URL\s*=\s*(.+)\s*$') {
    $databaseUrl = $Matches[1].Trim().Trim('"').Trim("'")
    break
  }
}

if (-not $databaseUrl -or $databaseUrl -match '^\[SENSITIVE\]$|localhost|example\.com') {
  Write-Host "DATABASE_URL in .env.production.local is not a real Neon URL." -ForegroundColor Red
  Write-Host "Edit the file and paste the full connection string from Vercel or Neon."
  exit 1
}

$env:DATABASE_URL = $databaseUrl
Write-Host "Running prisma db push against production database..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done. Retry delete on your Vercel URL (no redeploy needed)." -ForegroundColor Green
