# Test chatbot endpoint specifically
Write-Host "Testing Chatbot Endpoint..." -ForegroundColor Cyan
Write-Host ""

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
}

$jsonPayload = $chatbotPayload | ConvertTo-Json -Depth 3

Write-Host "Payload:" -ForegroundColor Gray
$jsonPayload | Write-Host

Write-Host ""
Write-Host "Sending request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/chatbot/leads" -Method POST -Body $jsonPayload -ContentType "application/json"
    Write-Host "SUCCESS: Chatbot conversation submitted" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}