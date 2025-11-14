# Quick test script for model API (PowerShell)
# Make sure dev server is running on localhost:3000

Write-Host "🧪 Testing Model API" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing OpenRouter model..." -ForegroundColor Yellow

$body = @{
    modelId = "tngtech/deepseek-r1t2-chimera:free"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-model" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host

    if ($response.success) {
        Write-Host ""
        Write-Host "✅ Success! The fix is working!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Test failed. Check the error message above." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Request failed: $_" -ForegroundColor Red
    Write-Host "Make sure the dev server is running on http://localhost:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 To test all models, visit: http://localhost:3000/test-models" -ForegroundColor Cyan
