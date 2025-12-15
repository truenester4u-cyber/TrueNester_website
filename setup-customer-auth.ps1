# Customer Authentication - Quick Setup Script

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Customer Authentication Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check environment variables
Write-Host "Step 1: Checking environment variables..." -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    if ($envContent -match "VITE_SUPABASE_URL" -and $envContent -match "VITE_SUPABASE_PUBLISHABLE_KEY") {
        Write-Host "✓ Environment variables found" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing Supabase environment variables in .env" -ForegroundColor Red
        Write-Host "  Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check migration file
Write-Host "Step 2: Checking database migration..." -ForegroundColor Yellow
$migrationFile = "database-migrations\202512090001_create_profiles_table.sql"
if (Test-Path $migrationFile) {
    Write-Host "✓ Migration file found" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You need to run the migration in Supabase!" -ForegroundColor Magenta
    Write-Host "1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
    Write-Host "2. Copy content from: $migrationFile" -ForegroundColor White
    Write-Host "3. Paste and execute in Supabase SQL Editor" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "Have you run the migration? (y/n)"
    if ($response -ne "y") {
        Write-Host "Please run the migration first!" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✗ Migration file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Install dependencies
Write-Host "Step 3: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 4: Check if server is running
Write-Host "Step 4: Checking dev server..." -ForegroundColor Yellow
$port = 8080
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "✓ Dev server appears to be running on port $port" -ForegroundColor Green
} else {
    Write-Host "! Dev server not running" -ForegroundColor Yellow
    $response = Read-Host "Start dev server now? (y/n)"
    if ($response -eq "y") {
        Write-Host "Starting dev server..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New Routes Available:" -ForegroundColor Yellow
Write-Host "  /login    - Customer login" -ForegroundColor White
Write-Host "  /signup   - Customer registration" -ForegroundColor White
Write-Host "  /dashboard - Protected customer dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:8080/signup" -ForegroundColor White
Write-Host "2. Create a test account" -ForegroundColor White
Write-Host "3. Login and access the dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: CUSTOMER_AUTH_SETUP.md" -ForegroundColor Cyan
Write-Host ""
