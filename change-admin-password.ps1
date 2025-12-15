# =====================================================
# PowerShell Script to Change Admin Password
# =====================================================
# This script helps you change the admin password for admin@truenester.com
# It provides interactive prompts and generates the SQL needed

Write-Host "🔐 Dubai Nest Hub - Admin Password Change Tool" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Get the new password securely
Write-Host "Enter new password for admin@truenester.com:" -ForegroundColor Yellow
$NewPassword = Read-Host -AsSecureString
$PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($NewPassword))

# Validate password strength
if ($PlainPassword.Length -lt 8) {
    Write-Host "❌ Password too short! Minimum 8 characters required." -ForegroundColor Red
    exit 1
}

$strongPasswordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
if (-not ($PlainPassword -match $strongPasswordPattern)) {
    Write-Host "⚠️  Warning: Password should contain uppercase, lowercase, numbers, and symbols for better security" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Password change cancelled." -ForegroundColor Red
        exit 1
    }
}

# Generate the SQL
Write-Host ""
Write-Host "✅ Generating SQL script..." -ForegroundColor Green

$SqlScript = @"
-- =====================================================
-- EXECUTE THIS IN SUPABASE DASHBOARD SQL EDITOR
-- =====================================================

-- Step 1: Verify the admin user exists
SELECT 
  id, 
  email, 
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'admin@truenester.com';

-- Step 2: Update the password
SELECT auth.update_user(
  (SELECT id FROM auth.users WHERE email = 'admin@truenester.com'),
  '{"password": "$PlainPassword"}'::jsonb
);

-- Step 3: Verify the update
SELECT 
  u.id,
  u.email,
  u.updated_at,
  au.role,
  au.status
FROM auth.users u
JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'admin@truenester.com';
"@

# Save to file
$OutputFile = ".\change_admin_password_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$SqlScript | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host ""
Write-Host "📁 SQL script saved to: $OutputFile" -ForegroundColor Green
Write-Host ""

# Instructions
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open Supabase Dashboard → Authentication → Users" -ForegroundColor White
Write-Host "2. OR Open SQL Editor and copy-paste the generated SQL" -ForegroundColor White
Write-Host "3. Execute the SQL script" -ForegroundColor White
Write-Host "4. Test login at http://localhost:8080/admin/login" -ForegroundColor White
Write-Host ""

# Option to open Supabase dashboard
Write-Host "Would you like to:" -ForegroundColor Yellow
Write-Host "1. View the SQL script content" -ForegroundColor White
Write-Host "2. Open the SQL file in notepad" -ForegroundColor White
Write-Host "3. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📄 Generated SQL Script:" -ForegroundColor Green
        Write-Host "=========================" -ForegroundColor Green
        Write-Host $SqlScript -ForegroundColor White
    }
    "2" {
        if (Get-Command notepad -ErrorAction SilentlyContinue) {
            Start-Process notepad $OutputFile
            Write-Host "📝 Opened SQL file in notepad" -ForegroundColor Green
        } else {
            Write-Host "❌ Notepad not found. Please open $OutputFile manually" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "👋 Goodbye!" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔒 Security Reminder:" -ForegroundColor Yellow
Write-Host "- Store your new password securely" -ForegroundColor White
Write-Host "- Consider enabling 2FA in the future" -ForegroundColor White
Write-Host "- Test the login immediately after change" -ForegroundColor White

# Clean up
Clear-Variable PlainPassword -ErrorAction SilentlyContinue