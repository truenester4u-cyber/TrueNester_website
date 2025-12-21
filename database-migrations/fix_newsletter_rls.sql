-- Fix newsletter RLS policies to avoid infinite recursion
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public to subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admins to delete subscribers" ON public.newsletter_subscribers;

-- Recreate policies with simpler logic

-- Policy: Allow anyone (anon) to insert (subscribe)
CREATE POLICY "Allow public to subscribe"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to view all subscribers
-- (Admin check will be done at application level)
CREATE POLICY "Allow authenticated to view subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update subscribers
CREATE POLICY "Allow authenticated to update subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to delete subscribers
CREATE POLICY "Allow authenticated to delete subscribers"
  ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (true);
