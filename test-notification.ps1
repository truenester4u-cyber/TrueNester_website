Write-Host "🧪 Testing notification system..." -ForegroundColor Cyan
Write-Host ""

$payload = @{
    customerName = "Test Customer"
    customerEmail = "test@example.com"
    customerPhone = "+971 50 123 4567"
    source = "contact_form"
    subject = "Test Notification"
    message = "This is a test message to verify email delivery is working."
    department = "Sales"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/notifications/fallback" -Method POST -Body $payload -ContentType "application/json"
    
    Write-Host "✅ SUCCESS! Notification sent" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Check these email addresses:" -ForegroundColor Yellow
    Write-Host "   - info@truenester.com"
    Write-Host "   - truenester4u@gmail.com"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Make sure the backend server is running:" -ForegroundColor Yellow
    Write-Host "   cd truenester-chatbot-api"
    Write-Host "   npm run dev"
}
