# Test all form endpoints for email delivery
Write-Host "Testing All Form Endpoints for Email Delivery..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Property Inquiry
Write-Host "1. Testing Property Inquiry Form..." -ForegroundColor Yellow
$propertyPayload = @{
    customerName = "John Smith"
    customerEmail = "john.smith@example.com"
    customerPhone = "+971 50 123 4567"
    propertyTitle = "Luxury Villa in Downtown Dubai"
    propertyUrl = "https://truenester.com/property/123"
    message = "I am interested in this luxury villa. Can you provide more details?"
    budget = "5M-10M AED"
    propertyType = "Villa"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/property-inquiry" -Method POST -Body $propertyPayload -ContentType "application/json"
    Write-Host "   SUCCESS: Property inquiry submitted" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 2: Contact Form
Write-Host "2. Testing Contact Form..." -ForegroundColor Yellow
$contactPayload = @{
    customerName = "Sarah Ahmed"
    customerEmail = "sarah.ahmed@example.com"
    customerPhone = "+971 55 987 6543"
    subject = "General Inquiry"
    message = "I would like to know more about your real estate services in Dubai."
    department = "Sales"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/contact" -Method POST -Body $contactPayload -ContentType "application/json"
    Write-Host "   SUCCESS: Contact form submitted" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 3: Sell Submission
Write-Host "3. Testing Sell Submission Form..." -ForegroundColor Yellow
$sellPayload = @{
    customerName = "Ahmed Hassan"
    customerEmail = "ahmed.hassan@example.com"
    customerPhone = "+971 52 555 1234"
    propertyType = "Apartment"
    propertyAddress = "Business Bay, Dubai Marina Tower, Unit 1205"
    expectedPrice = "2.5M AED"
    propertyDescription = "2-bedroom apartment with marina view, fully furnished"
    urgency = "Within 3 months"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/sell-submission" -Method POST -Body $sellPayload -ContentType "application/json"
    Write-Host "   SUCCESS: Sell submission submitted" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 4: Chatbot Conversation
Write-Host "4. Testing Chatbot Conversation..." -ForegroundColor Yellow
$chatbotPayload = @{
    customerName = "Fatima Al-Zahra"
    customerEmail = "fatima.alzahra@example.com"
    customerPhone = "+971 56 789 0123"
    intent = "buy"
    budget = "3M-5M AED"
    propertyType = "Townhouse"
    preferredArea = "Arabian Ranches"
    leadScore = 85
    messages = @(
        @{
            id = "msg-1"
            sender = "customer"
            messageText = "Hi, I'm looking for a townhouse in Arabian Ranches"
            messageType = "text"
            timestamp = "2025-12-17T11:00:00.000Z"
        },
        @{
            id = "msg-2" 
            sender = "bot"
            messageText = "Great! I can help you find townhouses in Arabian Ranches. What's your budget?"
            messageType = "text"
            timestamp = "2025-12-17T11:00:15.000Z"
        },
        @{
            id = "msg-3"
            sender = "customer"
            messageText = "Between 3 and 5 million AED"
            messageType = "text"
            timestamp = "2025-12-17T11:00:30.000Z"
        }
    )
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/chatbot/leads" -Method POST -Body $chatbotPayload -ContentType "application/json"
    Write-Host "   SUCCESS: Chatbot conversation submitted" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Check these email addresses for 4 test emails:" -ForegroundColor Yellow
Write-Host "   - info@truenester.com" -ForegroundColor White
Write-Host "   - truenester4u@gmail.com" -ForegroundColor White
Write-Host ""
Write-Host "You should receive emails for:" -ForegroundColor Gray
Write-Host "   1. Property Inquiry from John Smith" -ForegroundColor Gray
Write-Host "   2. Contact Form from Sarah Ahmed" -ForegroundColor Gray  
Write-Host "   3. Sell Submission from Ahmed Hassan" -ForegroundColor Gray
Write-Host "   4. Chatbot Conversation from Fatima Al-Zahra" -ForegroundColor Gray