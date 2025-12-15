-- Update admin password for admin@truenester.com
-- Execute this in Supabase Dashboard SQL Editor

-- Step 1: Verify user exists
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@truenester.com';

-- Step 2: Update password using the correct Supabase admin method
-- Method 1: Update encrypted_password directly (most reliable)
UPDATE auth.users 
SET 
  encrypted_password = crypt('True$Path_2025!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'admin@truenester.com';

-- Step 3: Verify update
SELECT u.id, u.email, u.updated_at, au.role, au.status
FROM auth.users u
JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'admin@truenester.com';

