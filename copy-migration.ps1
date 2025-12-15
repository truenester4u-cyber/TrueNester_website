echo "Copying migration script to clipboard..."
Get-Content "supabase_dashboard_migration_fixed.sql" | Set-Clipboard
Write-Host "✅ Migration script copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to the Supabase dashboard (should be open in browser)" -ForegroundColor White
Write-Host "2. Select your Dubai Nest Hub project" -ForegroundColor White
Write-Host "3. Click 'SQL Editor' in left sidebar" -ForegroundColor White
Write-Host "4. Click 'New Query' button" -ForegroundColor White
Write-Host "5. Press Ctrl+V to paste the migration script" -ForegroundColor White
Write-Host "6. Click 'Run' button or press Ctrl+Enter" -ForegroundColor White
Write-Host ""
Write-Host "The migration is now in your clipboard and ready to paste! 📋" -ForegroundColor Green