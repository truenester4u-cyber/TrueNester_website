Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   TESTING TELEGRAM NOTIFICATIONS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📱 This will test if Telegram notifications work!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Make sure:" -ForegroundColor Yellow
Write-Host "  1. Backend is running (npm run dev)" -ForegroundColor White
Write-Host "  2. You added TELEGRAM_BOT_TOKEN to .env" -ForegroundColor White
Write-Host "  3. You added TELEGRAM_CHAT_ID to .env" -ForegroundColor White
Write-Host ""

$contactPayload = @{
    customerName = "Telegram Test User"
    customerEmail = "telegram@test.com"
    customerPhone = "+971 50 999 8888"
    subject = "Testing Telegram Notifications"
    message = "This is a test message to check if Telegram works!"
    department = "Support"
} | ConvertTo-Json

Write-Host "Sending test notification to backend..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/contact" -Method POST -Body $contactPayload -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend Response:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
    Write-Host ""
    Write-Host "📱 CHECK YOUR TELEGRAM NOW!" -ForegroundColor Green
    Write-Host "You should see a message from your bot!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor White
    Write-Host ""
    
    if ($_.Exception.Message -like "*Cannot POST*") {
        Write-Host "💡 TIP: Backend might not be running" -ForegroundColor Yellow
        Write-Host "   Try: cd truenester-chatbot-api && npm run dev" -ForegroundColor White
    } elseif ($_.Exception.Message -like "*refused*") {
        Write-Host "💡 TIP: Backend is not running on port 4000" -ForegroundColor Yellow
        Write-Host "   Start it: cd truenester-chatbot-api && npm run dev" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
