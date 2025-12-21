-- Temporarily disable RLS to test if that's the issue
-- WARNING: This makes the table accessible to everyone for testing only

ALTER TABLE public.newsletter_subscribers DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.newsletter_subscribers TO anon;
GRANT ALL ON public.newsletter_subscribers TO authenticated;
