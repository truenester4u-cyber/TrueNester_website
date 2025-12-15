-- =====================================================
-- FINAL ADMIN LOGIN FIX - RUN ALL OF THIS IN ONE GO
-- =====================================================

-- Step 1: Drop ALL existing policies on admin_users
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view own admin record" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;

-- Step 2: Temporarily disable RLS to fix data
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Clear and re-insert the admin user with correct user_id
-- First, get the auth user id for admin@truenester.com
DELETE FROM admin_users WHERE email = 'admin@truenester.com';

INSERT INTO admin_users (user_id, email, full_name, role, status, requires_mfa)
SELECT 
  id as user_id,
  'admin@truenester.com' as email,
  'Admin' as full_name,
  'super_admin' as role,
  'active' as status,
  false as requires_mfa
FROM auth.users 
WHERE email = 'admin@truenester.com';

-- Step 4: Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, working policies
-- Policy 1: Authenticated users can see their own admin record (for login check)
CREATE POLICY "admin_users_select_own" ON admin_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Super admins can see all admin users (for admin management)
CREATE POLICY "admin_users_select_all" ON admin_users
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'super_admin' 
    AND au.status = 'active'
  )
);

-- Policy 3: Super admins can update admin users
CREATE POLICY "admin_users_update" ON admin_users
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'super_admin' 
    AND au.status = 'active'
  )
);

-- Policy 4: Super admins can insert new admin users
CREATE POLICY "admin_users_insert" ON admin_users
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'super_admin' 
    AND au.status = 'active'
  )
);

-- Step 6: Fix admin_login_attempts table
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow login attempt inserts" ON admin_login_attempts;
DROP POLICY IF EXISTS "login_attempts_insert" ON admin_login_attempts;
CREATE POLICY "login_attempts_insert" ON admin_login_attempts
FOR INSERT TO authenticated
WITH CHECK (true);

-- Step 7: Fix admin_audit_logs table  
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow audit log inserts" ON admin_audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON admin_audit_logs;
CREATE POLICY "audit_logs_insert" ON admin_audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "audit_logs_select" ON admin_audit_logs;
CREATE POLICY "audit_logs_select" ON admin_audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.status = 'active'
  )
);

-- Step 8: Verify the fix worked
SELECT 
  au.user_id,
  au.email,
  au.role,
  au.status,
  au.requires_mfa,
  u.email as auth_email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'admin@truenester.com';
