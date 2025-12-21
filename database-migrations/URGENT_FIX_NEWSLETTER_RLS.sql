-- URGENT FIX: Newsletter RLS Policy
-- Copy this ENTIRE file and paste into Supabase SQL Editor, then click RUN

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Allow public to subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to delete subscribers" ON public.newsletter_subscribers;

-- Step 2: Disable RLS temporarily to test
ALTER TABLE public.newsletter_subscribers DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant permissions to anon role (this is the key fix!)
GRANT ALL ON public.newsletter_subscribers TO anon;
GRANT ALL ON public.newsletter_subscribers TO authenticated;

-- Step 4: Re-enable RLS with proper policies
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive policy for INSERT (allows everyone)
CREATE POLICY "newsletter_public_insert"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 6: Create policy for SELECT (admins only)
CREATE POLICY "newsletter_admin_select"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Step 7: Create policy for UPDATE (admins only)
CREATE POLICY "newsletter_admin_update"
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Step 8: Create policy for DELETE (admins only)
CREATE POLICY "newsletter_admin_delete"
  ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Step 9: Verify policies are created
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'newsletter_subscribers'
ORDER BY policyname;

-- Step 10: Test insert (should succeed)
-- Uncomment the line below to test:
-- INSERT INTO public.newsletter_subscribers (email, source) VALUES ('test@example.com', 'test');
