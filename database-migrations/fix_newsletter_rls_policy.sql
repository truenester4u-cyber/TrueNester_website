-- Fix RLS policy for newsletter_subscribers to allow public inserts
-- This allows anonymous users to subscribe to the newsletter

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to delete subscribers" ON public.newsletter_subscribers;

-- Enable RLS (if not already enabled)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ANYONE (including anonymous) to INSERT
CREATE POLICY "Allow public to subscribe"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Allow authenticated admins to SELECT
CREATE POLICY "Allow admins to view all subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Policy 3: Allow authenticated admins to UPDATE
CREATE POLICY "Allow admins to update subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Policy 4: Allow authenticated admins to DELETE
CREATE POLICY "Allow admins to delete subscribers"
  ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Grant necessary permissions to anon role
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'newsletter_subscribers';
