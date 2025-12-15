# Dashboard Data Setup Script
# Run these commands to get your dashboard working with saved properties, inquiries, and activity

Write-Host "🚀 Setting up Dashboard Data..." -ForegroundColor Green
Write-Host ""

Write-Host "📋 STEP 1: Run Database Migrations" -ForegroundColor Yellow
Write-Host "1. Open Supabase Dashboard → SQL Editor"
Write-Host "2. Copy contents of 'supabase_migration_complete_dashboard.sql'"
Write-Host "3. Paste and click 'Run'"
Write-Host "   This creates: saved_properties, customer_inquiries, reviews, user_activity tables"
Write-Host ""

Write-Host "📊 STEP 2: Add Sample Data (Optional)" -ForegroundColor Yellow
Write-Host "To see data in your dashboard immediately:"
Write-Host "1. In Supabase SQL Editor, run: SELECT id, email FROM auth.users;"
Write-Host "2. Copy your user ID"
Write-Host "3. Run the sample data script from 'supabase_sample_dashboard_data.sql'"
Write-Host "4. Replace 'YOUR_USER_ID' with your actual user ID"
Write-Host ""

Write-Host "🔧 STEP 3: Test the Dashboard" -ForegroundColor Yellow
Write-Host "1. Go to: http://localhost:8084/dashboard"
Write-Host "2. Login with your account"
Write-Host "3. Check all tabs: Overview, Saved, Inquiries, Activity, Settings"
Write-Host ""

Write-Host "✅ What You Should See:" -ForegroundColor Green
Write-Host "- Saved Properties: Shows favorited properties with images"
Write-Host "- Inquiries: Shows submitted inquiries with status"
Write-Host "- Activity: Shows timeline of user actions"
Write-Host "- Overview: Shows counts and stats"
Write-Host ""

Write-Host "🐛 Troubleshooting:" -ForegroundColor Red
Write-Host "- If you see zeros (0) everywhere: Run the migration first"
Write-Host "- If data doesn't show: Check RLS policies in Supabase"
Write-Host "- If Activity tab is empty: Use favorite buttons to generate activity"
Write-Host ""

Write-Host "📁 Files Created:" -ForegroundColor Cyan
Write-Host "- supabase_migration_complete_dashboard.sql (main migration)"
Write-Host "- supabase_sample_dashboard_data.sql (test data)"
Write-Host "- USER_ACTIVITY_SETUP_GUIDE.md (detailed documentation)"
Write-Host "- USER_ACTIVITY_QUICK_START.md (quick reference)"
Write-Host ""

Write-Host "🎯 Next Steps:" -ForegroundColor Magenta
Write-Host "1. Run the migration in Supabase"
Write-Host "2. Test saving/unsaving properties"  
Write-Host "3. Submit a contact form inquiry"
Write-Host "4. Leave a property review"
Write-Host "5. Check Activity tab for all actions"
Write-Host ""

Write-Host "✨ Your dashboard will now show real data!" -ForegroundColor Green