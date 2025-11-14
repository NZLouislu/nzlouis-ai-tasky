# Clean and Restart Script for Windows PowerShell

Write-Host "🧹 Cleaning Next.js cache..." -ForegroundColor Yellow

# Stop any running dev server (optional)
# Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove .next directory
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next directory not found" -ForegroundColor Cyan
}

# Remove node_modules cache (optional)
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✅ Removed node_modules cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
Write-Host ""

# Start dev server
npm run dev
