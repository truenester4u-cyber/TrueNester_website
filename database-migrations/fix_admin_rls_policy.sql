-- FIX: Admin RLS Policy - Allow users to see their own row
-- The original policy had a circular dependency: you needed to be in admin_users to query admin_users
-- This fix adds a policy that allows authenticated users to see their own row by user_id

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create a new policy that allows:
-- 1. Users to see their own admin record (for login verification)
-- 2. Active admins to see all admin records (for admin management)
CREATE POLICY "Users can view own admin record" ON admin_users
FOR SELECT USING (
  -- Allow user to see their own record (needed for login check)
  user_id = auth.uid()
  OR
  -- Allow active admins to see all records (for admin management)
  EXISTS (
    SELECT 1 FROM admin_users AS au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Also need INSERT policy for logging (admin_login_attempts and admin_audit_logs)
-- These tables should allow inserts from authenticated users

-- Allow authenticated users to insert login attempts (for security logging)
DROP POLICY IF EXISTS "Allow login attempt inserts" ON admin_login_attempts;
CREATE POLICY "Allow login attempt inserts" ON admin_login_attempts
FOR INSERT WITH CHECK (true);

-- Allow authenticated users to insert audit logs
DROP POLICY IF EXISTS "Allow audit log inserts" ON admin_audit_logs;
CREATE POLICY "Allow audit log inserts" ON admin_audit_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure admin_login_attempts has RLS enabled but allows inserts
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Ensure admin_audit_logs allows inserts from authenticated users
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Seed the admin user with correct user_id
-- ============================================
-- First, get auth user IDs and insert/update admin_users

-- This creates an admin user linked to the auth user
-- Run this AFTER getting your auth.users id

-- To get your auth user id, run:
-- SELECT id, email FROM auth.users WHERE email IN ('admin@truenester.com', 'info@truenester.com');

-- Then update admin_users with the correct user_id:
-- Example (replace <AUTH_UUID> with actual UUID from above):
/*
INSERT INTO admin_users (user_id, email, full_name, role, status, requires_mfa)
VALUES ('<AUTH_UUID>', 'admin@truenester.com', 'Admin', 'super_admin', 'active', false)
ON CONFLICT (email) DO UPDATE
SET user_id = EXCLUDED.user_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    requires_mfa = EXCLUDED.requires_mfa;
*/
