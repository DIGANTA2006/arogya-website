# Run inside project root to create a client-ready zip.
$ErrorActionPreference = "Stop"

if (!(Test-Path "package.json")) {
  Write-Host "package.json not found. Open project root first." -ForegroundColor Red
  exit
}

$zipName = "medical-website-final-production.zip"
Remove-Item $zipName -Force -ErrorAction SilentlyContinue
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "out" -Recurse -Force -ErrorAction SilentlyContinue

$items = Get-ChildItem -Force | Where-Object {
  $_.Name -ne "node_modules" -and
  $_.Name -ne ".next" -and
  $_.Name -ne "out" -and
  $_.Name -ne ".env.local" -and
  $_.Name -ne $zipName
}

Compress-Archive -Path $items.FullName -DestinationPath $zipName -Force
Write-Host "Created $zipName" -ForegroundColor Green
