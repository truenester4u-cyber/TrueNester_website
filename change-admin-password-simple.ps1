# =====================================================
# PowerShell Script to Change Admin Password - Simple Version
# =====================================================

Write-Host "🔐 Dubai Nest Hub - Admin Password Change Tool" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Get the new password securely
Write-Host "Enter new password for admin@truenester.com:" -ForegroundColor Yellow
$SecurePassword = Read-Host -AsSecureString
$PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword))

# Basic validation
if ($PlainPassword.Length -lt 8) {
    Write-Host "❌ Password too short! Minimum 8 characters required." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Password length OK ($($PlainPassword.Length) characters)" -ForegroundColor Green

# Create SQL content
$sqlContent = @"
-- Update admin password for admin@truenester.com
-- Execute this in Supabase Dashboard SQL Editor

-- Step 1: Verify user exists
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@truenester.com';

-- Step 2: Update password
SELECT auth.update_user(
  (SELECT id FROM auth.users WHERE email = 'admin@truenester.com'),
  ('{"password": "' || '$PlainPassword' || '"}')::jsonb
);

-- Step 3: Verify update
SELECT u.id, u.email, u.updated_at, au.role, au.status
FROM auth.users u
JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'admin@truenester.com';
"@

# Save SQL to file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sqlFile = "admin_password_change_$timestamp.sql"
$sqlContent | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "📁 SQL script created: $sqlFile" -ForegroundColor Green
Write-Host ""

# Instructions
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "2. Copy and paste the SQL from: $sqlFile" -ForegroundColor White  
Write-Host "3. Execute the SQL" -ForegroundColor White
Write-Host "4. Test login at http://localhost:8080/admin/login" -ForegroundColor White
Write-Host ""

# Show SQL content
Write-Host "📄 Generated SQL:" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host $sqlContent -ForegroundColor White

Write-Host ""
Write-Host "🔒 SECURITY REMINDERS:" -ForegroundColor Red
Write-Host "- Test the login immediately" -ForegroundColor White
Write-Host "- Store password securely" -ForegroundColor White
Write-Host "- Delete this SQL file after use" -ForegroundColor White

# Clear sensitive data
Clear-Variable PlainPassword -ErrorAction SilentlyContinue
Clear-Variable SecurePassword -ErrorAction SilentlyContinue