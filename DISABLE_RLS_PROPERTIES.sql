-- ==============================================================================
-- FIX: RLS (Row Level Security) policies for public tables
-- ==============================================================================
-- 
-- PROBLEM: Published/public data tables (properties, locations, blog_posts)
-- may have RLS policies that only allow "anon" role but not "authenticated" role.
-- This causes data to not load for logged-in users after page refresh.
--
-- SOLUTION: Run the SQL below in Supabase SQL Editor
-- ==============================================================================

-- ==============================================================================
-- 1. FIX PROPERTIES TABLE
-- ==============================================================================

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow all users to view published properties" ON "public"."properties";
DROP POLICY IF EXISTS "public_read_published" ON "public"."properties";
DROP POLICY IF EXISTS "Anyone can view published properties" ON "public"."properties";

-- Create new policy that allows EVERYONE (anon + authenticated) to read published
CREATE POLICY "Anyone can view published properties" 
ON "public"."properties"
FOR SELECT 
TO public
USING (published = true);

-- ==============================================================================
-- 2. FIX LOCATIONS TABLE
-- ==============================================================================

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow all users to view published locations" ON "public"."locations";
DROP POLICY IF EXISTS "public_read_locations" ON "public"."locations";
DROP POLICY IF EXISTS "Anyone can view published locations" ON "public"."locations";

-- Create new policy
CREATE POLICY "Anyone can view published locations" 
ON "public"."locations"
FOR SELECT 
TO public
USING (published = true);

-- ==============================================================================
-- 3. FIX BLOG_POSTS TABLE (if exists)
-- ==============================================================================

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow all users to view published blog posts" ON "public"."blog_posts";
DROP POLICY IF EXISTS "public_read_blog" ON "public"."blog_posts";
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON "public"."blog_posts";

-- Create new policy (only if table exists)
DO $$
BEGIN
  CREATE POLICY "Anyone can view published blog posts" 
  ON "public"."blog_posts"
  FOR SELECT 
  TO public
  USING (published = true);
EXCEPTION WHEN undefined_table THEN
  NULL; -- Table doesn't exist, skip
END $$;

-- ==============================================================================
-- VERIFICATION: Run this after applying changes
-- ==============================================================================

-- Check RLS status for all tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('properties', 'locations', 'blog_posts') 
AND schemaname = 'public';