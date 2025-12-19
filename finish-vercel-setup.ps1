# Finish Vercel Environment Setup
# Run this script to complete the configuration

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Vercel Environment Setup - Final Step" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Already added:" -ForegroundColor Green
Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

Write-Host "Please get your Supabase API keys from:" -ForegroundColor Yellow
Write-Host "   https://app.supabase.com/project/jwmbxpqpjxqclfcahwcf/settings/api" -ForegroundColor White
Write-Host ""

Write-Host "You need TWO keys:" -ForegroundColor Yellow
Write-Host "   1. anon/public key (safe to expose to browser)" -ForegroundColor Gray
Write-Host "   2. service_role key (secret - for backend only)" -ForegroundColor Gray
Write-Host ""

Read-Host "Press ENTER when you have your keys ready"

Write-Host ""
Write-Host "Adding VITE_SUPABASE_PUBLISHABLE_KEY..." -ForegroundColor Cyan
Write-Host "(Paste your anon/public key when prompted)" -ForegroundColor Yellow
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production

Write-Host ""
Write-Host "Adding SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Cyan
Write-Host "(Paste your service_role key when prompted)" -ForegroundColor Yellow
vercel env add SUPABASE_SERVICE_ROLE_KEY production

Write-Host ""
$addSlack = Read-Host "Do you want to add a Slack webhook URL? (y/n)"
if ($addSlack -eq "y" -or $addSlack -eq "Y") {
    Write-Host "Adding SLACK_WEBHOOK_URL..." -ForegroundColor Cyan
    vercel env add SLACK_WEBHOOK_URL production
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verifying environment variables..." -ForegroundColor Yellow
vercel env ls

Write-Host ""
Write-Host "Now redeploying your site with new configuration..." -ForegroundColor Cyan
vercel --prod --yes

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your site is now live at:" -ForegroundColor Green
Write-Host "https://dubai-nest-hub-f3c99d5902f9f02eb444.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "Test the admin panel at:" -ForegroundColor Green  
Write-Host "https://dubai-nest-hub-f3c99d5902f9f02eb444.vercel.app/admin/conversations" -ForegroundColor White
Write-Host ""
