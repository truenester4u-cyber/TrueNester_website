-- Check current state of newsletter_subscribers table

-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'newsletter_subscribers'
);

-- 2. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'newsletter_subscribers';

-- 3. List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'newsletter_subscribers';

-- 4. Check grants
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='newsletter_subscribers';
