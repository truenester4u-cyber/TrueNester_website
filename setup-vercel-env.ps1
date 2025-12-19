# Setup Vercel Environment Variables for Dubai Nest Hub
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "You need to provide your Supabase credentials." -ForegroundColor Yellow
Write-Host "Find them at: https://app.supabase.com/project/_/settings/api" -ForegroundColor Yellow
Write-Host ""

# Get Supabase URL
$supabaseUrl = Read-Host "Enter your SUPABASE_URL (e.g., https://xxxxx.supabase.co)"
if ($supabaseUrl) {
    Write-Host "Setting VITE_SUPABASE_URL..." -ForegroundColor Green
    vercel env add VITE_SUPABASE_URL production --yes
    Write-Output $supabaseUrl | vercel env add VITE_SUPABASE_URL production --yes
}

# Get Supabase Anon Key
Write-Host ""
$supabaseAnonKey = Read-Host "Enter your SUPABASE_ANON_KEY (public key)"
if ($supabaseAnonKey) {
    Write-Host "Setting VITE_SUPABASE_PUBLISHABLE_KEY..." -ForegroundColor Green
    Write-Output $supabaseAnonKey | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production --yes
}

# Get Supabase Service Role Key
Write-Host ""
$supabaseServiceKey = Read-Host "Enter your SUPABASE_SERVICE_ROLE_KEY (secret key for API functions)"
if ($supabaseServiceKey) {
    Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Green
    Write-Output $supabaseServiceKey | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes
    Write-Output $supabaseUrl | vercel env add SUPABASE_URL production --yes
}

# Optional: Slack Webhook
Write-Host ""
$slackWebhook = Read-Host "Enter your SLACK_WEBHOOK_URL (optional, press Enter to skip)"
if ($slackWebhook) {
    Write-Host "Setting SLACK_WEBHOOK_URL..." -ForegroundColor Green
    Write-Output $slackWebhook | vercel env add SLACK_WEBHOOK_URL production --yes
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Environment variables configured!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now redeploying your site..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host ""
Write-Host "✅ Deployment complete! Your site should now work correctly." -ForegroundColor Green




