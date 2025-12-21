-- Complete fix for newsletter RLS policies
-- This ensures anonymous users can subscribe

-- First, drop ALL existing policies
DROP POLICY IF EXISTS "Allow public to subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to delete subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow authenticated to view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow authenticated to update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow authenticated to delete subscribers" ON public.newsletter_subscribers;

-- Ensure RLS is enabled
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow EVERYONE (anon and authenticated) to INSERT
CREATE POLICY "newsletter_insert_policy"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT
CREATE POLICY "newsletter_select_policy"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow authenticated users to UPDATE
CREATE POLICY "newsletter_update_policy"
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow authenticated users to DELETE
CREATE POLICY "newsletter_delete_policy"
  ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure proper grants
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT ON public.newsletter_subscribers TO authenticated;
GRANT UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
