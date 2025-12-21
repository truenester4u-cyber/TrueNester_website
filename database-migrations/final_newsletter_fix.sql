-- FINAL FIX: Complete newsletter RLS setup
-- This approach uses service role bypass for public inserts

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Allow public to subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to delete subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow authenticated to view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow authenticated to update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow authenticated to delete subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_insert_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_select_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_update_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_delete_policy" ON public.newsletter_subscribers;

-- Step 2: Disable RLS temporarily
ALTER TABLE public.newsletter_subscribers DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant full permissions
GRANT ALL ON public.newsletter_subscribers TO anon;
GRANT ALL ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

-- Step 4: Re-enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive policies

-- Allow anyone to insert (subscribe)
CREATE POLICY "Enable insert for all users"
ON public.newsletter_subscribers
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Enable read for authenticated users"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Enable delete for authenticated users"
ON public.newsletter_subscribers
FOR DELETE
TO authenticated
USING (true);
