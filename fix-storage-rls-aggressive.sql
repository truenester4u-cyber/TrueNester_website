-- AGGRESSIVE RLS FIX FOR SUPABASE STORAGE
-- This will completely open up the property-images bucket

-- 1. First, disable RLS temporarily to clear any blocking policies
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing restrictive policies that might be blocking access
DROP POLICY IF EXISTS "Give anon users access to images in property-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users access to images in property-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous access to property images" ON storage.objects;

-- 3. Re-enable RLS with a completely permissive policy
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create the most permissive policy possible for property images
CREATE POLICY "Full public access to property images" ON storage.objects
FOR ALL 
TO public 
USING (bucket_id = 'property-images');

-- 5. Also ensure the bucket itself is properly configured
UPDATE storage.buckets 
SET public = true 
WHERE id = 'property-images';

-- 6. Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%property%';