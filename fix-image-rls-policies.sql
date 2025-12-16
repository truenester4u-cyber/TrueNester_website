-- Fix RLS policies for Supabase Storage to allow image access
-- Run this in your Supabase SQL Editor

-- 1. Create policy to allow public read access to property images
CREATE POLICY "Allow public access to property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

-- 2. Alternative: Allow authenticated users to access property images
CREATE POLICY "Allow authenticated access to property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- 3. Allow anon users to also access (for public website)
CREATE POLICY "Allow anonymous access to property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images' AND auth.role() = 'anon');

-- 4. Check current policies (informational)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 5. If you want to allow all access to property images bucket (most permissive)
-- Uncomment the next line if the above policies don't work:
-- CREATE POLICY "Public property images access" ON storage.objects FOR ALL USING (bucket_id = 'property-images');

-- Note: You may need to first drop existing policies if they conflict:
-- DROP POLICY IF EXISTS "existing_policy_name" ON storage.objects;