# Test Resend Email Integration
# Run this in PowerShell after backend is running

$body = @{
    customerName = "Test User"
    customerEmail = "test@example.com"
    customerPhone = "+971501234567"
    subject = "Test Resend Email"
    message = "This is a test email to verify Resend integration sends to both addresses."
    department = "Testing"
} | ConvertTo-Json

Write-Host "Sending test contact form..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "http://localhost:4001/api/contact" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "✅ Success!" -ForegroundColor Green
Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📧 Check these email addresses:" -ForegroundColor Cyan
Write-Host "  - info@truenester.com"
Write-Host "  - truenester4u@gmail.com"
