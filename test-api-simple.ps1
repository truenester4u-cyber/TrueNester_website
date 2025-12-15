$body = @{
    customerName = "Test User"
    customerPhone = "+971501234567"
    customerEmail = "test@example.com"
    intent = "buy"
    budget = "1M-2M AED"
    preferredArea = "Dubai Marina"
    leadScore = 75
    leadQuality = "warm"
    tags = @("test", "buy")
    messages = @(
        @{
            id = [guid]::NewGuid().ToString()
            sender = "bot"
            messageText = "Hello! Welcome to Dubai Nest Hub. How can I help you today?"
            messageType = "text"
            timestamp = (Get-Date).ToUniversalTime().ToString("o")
        },
        @{
            id = [guid]::NewGuid().ToString()
            sender = "customer"
            messageText = "I'm looking to buy a property in Dubai Marina"
            messageType = "text"
            timestamp = (Get-Date).ToUniversalTime().ToString("o")
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Testing Chatbot API..." -ForegroundColor Cyan
Write-Host "Payload:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/chatbot/leads" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body

    Write-Host "✅ Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5)
    
    Write-Host "`n✅ Conversation created successfully!" -ForegroundColor Green
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "1. Admin Panel: http://localhost:8080/admin/conversations" 
    Write-Host "2. Slack Channel: Check for new lead notification"
    Write-Host "3. Supabase: https://jwmbxpqpjxqclfcahwcf.supabase.co/"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $streamReader.ReadToEnd()
        $streamReader.Dispose()
        Write-Host "Details: $responseBody" -ForegroundColor Red
    }
}
