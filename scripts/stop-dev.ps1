# Stop all Node.js processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow

$processes = Get-Process -Name node -ErrorAction SilentlyContinue

if ($processes) {
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Stopped $($processes.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "[OK] No Node.js processes running" -ForegroundColor Green
}

# Wait for processes to fully terminate
Start-Sleep -Seconds 2

Write-Host "[OK] Ready to start dev server" -ForegroundColor Green
