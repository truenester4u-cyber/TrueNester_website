# Add Vercel Environment Variables
# This script will prompt you for each value and add it to Vercel

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your Supabase URL: https://jwmbxpqpjxqclfcahwcf.supabase.co" -ForegroundColor Green
Write-Host ""
Write-Host "Please have your Supabase keys ready from:" -ForegroundColor Yellow
Write-Host "https://app.supabase.com/project/jwmbxpqpjxqclfcahwcf/settings/api" -ForegroundColor Yellow
Write-Host ""

# Add VITE_SUPABASE_URL
Write-Host "Adding VITE_SUPABASE_URL..." -ForegroundColor Cyan
echo "https://jwmbxpqpjxqclfcahwcf.supabase.co" | vercel env add VITE_SUPABASE_URL production

# Add SUPABASE_URL (for API functions)
Write-Host "Adding SUPABASE_URL..." -ForegroundColor Cyan
echo "https://jwmbxpqpjxqclfcahwcf.supabase.co" | vercel env add SUPABASE_URL production

Write-Host ""
Write-Host "Now add your Supabase Anon Key (from the API settings page)" -ForegroundColor Yellow
Write-Host "Run this command and paste your anon key when prompted:" -ForegroundColor White
Write-Host "vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production" -ForegroundColor Green
Write-Host ""
Write-Host "Then add your Service Role Key:" -ForegroundColor Yellow
Write-Host "vercel env add SUPABASE_SERVICE_ROLE_KEY production" -ForegroundColor Green
Write-Host ""
Write-Host "(Optional) Add Slack Webhook:" -ForegroundColor Yellow  
Write-Host "vercel env add SLACK_WEBHOOK_URL production" -ForegroundColor Green
Write-Host ""




