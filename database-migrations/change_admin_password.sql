-- =====================================================
-- CHANGE ADMIN PASSWORD FOR admin@truenester.com
-- =====================================================
-- 
-- This script updates the password for the admin@truenester.com account
-- Run this in Supabase Dashboard → SQL Editor
--
-- IMPORTANT: Replace 'YourNewSecurePassword123!' with your desired password
-- =====================================================

-- Method 1: Using Supabase admin function (Recommended)
-- This is the safest way to change passwords in production

-- Get the user ID first to confirm we're updating the right account
SELECT 
  id, 
  email, 
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'admin@truenester.com';

-- Update password using Supabase's built-in admin function
-- NOTE: Replace 'YourNewSecurePassword123!' with your actual new password
SELECT auth.update_user(
  (SELECT id FROM auth.users WHERE email = 'admin@truenester.com'),
  '{"password": "YourNewSecurePassword123!"}'::jsonb
);

-- Verify the user still exists and is active
SELECT 
  u.id,
  u.email,
  u.updated_at,
  au.role,
  au.status
FROM auth.users u
JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'admin@truenester.com';

-- Method 2: Alternative approach using admin API (if Method 1 doesn't work)
-- This requires service role key access

/*
-- If the above doesn't work, you can also use the admin client in your backend:
-- 
-- import { createClient } from '@supabase/supabase-js'
-- 
-- const supabaseAdmin = createClient(
--   process.env.SUPABASE_URL,
--   process.env.SUPABASE_SERVICE_ROLE_KEY,
--   {
--     auth: {
--       autoRefreshToken: false,
--       persistSession: false
--     }
--   }
-- )
-- 
-- const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
--   'user-id-here',
--   { password: 'YourNewSecurePassword123!' }
-- )
*/

-- Method 3: Reset password via email (Alternative for production)
-- This sends a password reset email to admin@truenester.com

/*
-- You can also trigger a password reset email:
-- Go to Supabase Dashboard → Authentication → Users
-- Find admin@truenester.com → Actions → Send password reset email
-- 
-- Or use the API:
-- await supabase.auth.resetPasswordForEmail('admin@truenester.com', {
--   redirectTo: 'https://yourdomain.com/reset-password'
-- })
*/

-- =====================================================
-- SECURITY VERIFICATION
-- =====================================================

-- 1. Verify admin user record is still intact
SELECT 
  email,
  full_name,
  role,
  status,
  requires_mfa,
  created_at,
  updated_at
FROM admin_users 
WHERE email = 'admin@truenester.com';

-- 2. Check if user can authenticate (you'll test this manually)
-- Navigate to: http://localhost:8080/admin/login
-- Try logging in with: admin@truenester.com and your new password

-- =====================================================
-- ROLLBACK INSTRUCTIONS (If Something Goes Wrong)
-- =====================================================

/*
-- If you need to rollback or the password doesn't work:

-- Option 1: Reset to a known password
SELECT auth.update_user(
  (SELECT id FROM auth.users WHERE email = 'admin@truenester.com'),
  '{"password": "Admin123!@#"}'::jsonb
);

-- Option 2: Create a new admin account if needed
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'backup-admin@truenester.com',
  crypt('TempPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
*/

-- =====================================================
-- POST-CHANGE CHECKLIST
-- =====================================================

/*
After running this script:

✅ 1. Test login at /admin/login with new password
✅ 2. Verify you can access admin dashboard
✅ 3. Check all admin functions work normally
✅ 4. Update password in any documentation/team notes
✅ 5. If using a password manager, update the stored password
✅ 6. Consider enabling MFA for additional security

SECURITY NOTES:
- Use a strong password (12+ characters, mixed case, numbers, symbols)
- Don't reuse passwords from other systems
- Consider enabling 2FA/MFA in the future
- Store the password securely (password manager recommended)
*/