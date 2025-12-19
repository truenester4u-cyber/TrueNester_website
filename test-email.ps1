# Test email notification
Write-Host "Testing Email Notification System..." -ForegroundColor Cyan
Write-Host ""

$payload = @{
    customerName = "Test Customer"
    customerEmail = "test@example.com" 
    customerPhone = "+971 50 123 4567"
    source = "contact_form"
    subject = "Test Notification"
    message = "This is a test message to verify email delivery is working."
    department = "Sales"
}

$jsonPayload = $payload | ConvertTo-Json

try {
    Write-Host "Sending test notification..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/notifications/fallback" -Method POST -Body $jsonPayload -ContentType "application/json"
    
    Write-Host ""
    Write-Host "SUCCESS! Notification sent successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Check these email addresses for the test email:" -ForegroundColor Yellow
    Write-Host "   - info@truenester.com" -ForegroundColor White
    Write-Host "   - truenester4u@gmail.com" -ForegroundColor White
    Write-Host ""
    Write-Host "Response Details:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -match "Connection refused" -or $_.Exception.Message -match "No connection could be made") {
        Write-Host ""
        Write-Host "Server not running. Start it with:" -ForegroundColor Yellow
        Write-Host "   cd truenester-chatbot-api" -ForegroundColor White
        Write-Host "   npm run dev" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Test completed" -ForegroundColor Cyan