# Dubai Nest Hub - Database Migration Script
# This script helps you run the dashboard migration in Supabase

Write-Host "Dubai Nest Hub - Dashboard Migration" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: TypeScript Types Updated!" -ForegroundColor Green
Write-Host "   File: src/integrations/supabase/types.ts" -ForegroundColor Gray
Write-Host "   Added: Properties, Reviews, User Activity, Customer Inquiries" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Next - Run Database Migration" -ForegroundColor Yellow
Write-Host "   1. Open your browser and go to:" -ForegroundColor White
Write-Host "      https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Select your project: Dubai Nest Hub" -ForegroundColor White
Write-Host ""
Write-Host "   3. Go to: SQL Editor (left sidebar)" -ForegroundColor White
Write-Host ""
Write-Host "   4. Click 'New Query' button" -ForegroundColor White
Write-Host ""
Write-Host "   5. Copy the entire migration script:" -ForegroundColor White

$migrationFile = "supabase_dashboard_migration_fixed.sql"
if (Test-Path $migrationFile) {
    Write-Host "       📁 From file: $migrationFile" -ForegroundColor Cyan
    Write-Host "       📝 Lines: $(Get-Content $migrationFile | Measure-Object -Line | Select-Object -ExpandProperty Lines)" -ForegroundColor Gray
} else {
    Write-Host "       ❌ Migration file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "   6. Paste it in the SQL Editor and click 'Run'" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: After Migration Success" -ForegroundColor Yellow
Write-Host "   Property codes will be generated (B000001, R000001, S000001)" -ForegroundColor Green
Write-Host "   Dashboard tables will be created" -ForegroundColor Green
Write-Host "   User activity tracking will be enabled" -ForegroundColor Green
Write-Host "   Reviews and inquiries will work properly" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Verify Migration (Optional)" -ForegroundColor Yellow
Write-Host "   Run these queries in Supabase SQL Editor to check:" -ForegroundColor White
Write-Host ""
Write-Host "   -- Check tables exist" -ForegroundColor Gray
Write-Host "   SELECT table_name FROM information_schema.tables" -ForegroundColor Cyan
Write-Host "   WHERE table_schema = 'public'" -ForegroundColor Cyan
Write-Host "   AND table_name IN ('properties', 'saved_properties', 'customer_inquiries', 'reviews', 'user_activity')" -ForegroundColor Cyan
Write-Host "   ORDER BY table_name;" -ForegroundColor Cyan
Write-Host ""
Write-Host "   -- Check property codes generated" -ForegroundColor Gray
Write-Host "   SELECT property_code, purpose, title FROM public.properties" -ForegroundColor Cyan
Write-Host "   WHERE property_code IS NOT NULL" -ForegroundColor Cyan
Write-Host "   ORDER BY property_code;" -ForegroundColor Cyan
Write-Host ""

Write-Host "Need Help?" -ForegroundColor Magenta
Write-Host "   If you see any errors, copy the error message" -ForegroundColor White
Write-Host "   The migration is safe to run multiple times" -ForegroundColor White
Write-Host "   Your website will keep working during the migration" -ForegroundColor White
Write-Host ""

Write-Host "What This Fixes:" -ForegroundColor Green
Write-Host "   Properties will not disappear after logout" -ForegroundColor White
Write-Host "   Dashboard will show real saved properties count" -ForegroundColor White
Write-Host "   Customer inquiries will be tracked properly" -ForegroundColor White
Write-Host "   Reviews system will work with property codes" -ForegroundColor White
Write-Host "   User activity will be logged for analytics" -ForegroundColor White
Write-Host ""

Write-Host "Ready to proceed? Open Supabase dashboard and run the migration!" -ForegroundColor Green