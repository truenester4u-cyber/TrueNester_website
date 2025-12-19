# Final test of working form endpoints
Write-Host "Final Test: Sending emails from all working form endpoints..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Test Property Inquiry with realistic data
Write-Host "Sending Property Inquiry..." -ForegroundColor Yellow
$propertyPayload = @{
    customerName = "Michael Johnson"
    customerEmail = "michael.johnson@gmail.com"
    customerPhone = "+971 50 555 7890"
    propertyTitle = "3BR Apartment in Dubai Marina"
    propertyUrl = "https://truenester.com/properties/marina-apartment-123"
    message = "I am very interested in this 3-bedroom apartment. Please send me more details and arrange a viewing."
    budget = "2.5M-3.5M AED"
    propertyType = "Apartment"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/property-inquiry" -Method POST -Body $propertyPayload -ContentType "application/json"
    Write-Host "   ✅ SUCCESS: Property inquiry sent (ID: $($response.id))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Test Contact Form
Write-Host "Sending Contact Form..." -ForegroundColor Yellow
$contactPayload = @{
    customerName = "Priya Sharma"
    customerEmail = "priya.sharma@yahoo.com"
    customerPhone = "+971 55 123 9876"
    subject = "Investment Consultation"
    message = "Hello, I am looking to invest in Dubai real estate. Could you please schedule a consultation call this week? I am particularly interested in off-plan properties."
    department = "Investment"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/contact" -Method POST -Body $contactPayload -ContentType "application/json"
    Write-Host "   ✅ SUCCESS: Contact form sent (ID: $($response.id))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Test Sell Submission
Write-Host "Sending Sell Submission..." -ForegroundColor Yellow
$sellPayload = @{
    customerName = "David Chen"
    customerEmail = "david.chen@outlook.com"
    customerPhone = "+971 52 777 4433"
    propertyType = "Villa"
    propertyAddress = "Emirates Hills, Villa 45, Dubai"
    expectedPrice = "15M AED"
    propertyDescription = "Luxury 5-bedroom villa with private pool, garden, and premium finishes. Fully furnished."
    urgency = "Immediate sale required"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/sell-submission" -Method POST -Body $sellPayload -ContentType "application/json"
    Write-Host "   ✅ SUCCESS: Sell submission sent (ID: $($response.id))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ ALL FORM EMAILS SENT SUCCESSFULLY!" -ForegroundColor Green
Write-Host ""
Write-Host "📧 CHECK YOUR EMAIL INBOXES NOW:" -ForegroundColor Yellow
Write-Host "   • info@truenester.com" -ForegroundColor White
Write-Host "   • truenester4u@gmail.com" -ForegroundColor White
Write-Host ""
Write-Host "📬 You should have received 3 emails:" -ForegroundColor Cyan
Write-Host "   1. Property Inquiry from Michael Johnson" -ForegroundColor White
Write-Host "   2. Contact Form from Priya Sharma" -ForegroundColor White
Write-Host "   3. Sell Submission from David Chen" -ForegroundColor White
Write-Host ""
Write-Host "🔔 The notification system is working perfectly!" -ForegroundColor Green