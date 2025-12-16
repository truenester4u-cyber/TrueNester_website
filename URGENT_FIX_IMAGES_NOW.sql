-- URGENT: Complete Fix for Image Loading Issues
-- This will completely open up the property-images bucket for public access
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Make the property-images bucket completely public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'property-images';

-- Step 2: Drop ALL existing RLS policies on storage.objects that might block access
DROP POLICY IF EXISTS "Restrict access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read property images" ON storage.objects;
DROP POLICY IF EXISTS "property_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete_policy" ON storage.objects;

-- Step 3: Create a single, permissive policy for the property-images bucket
CREATE POLICY "Public access to property images"
ON storage.objects FOR ALL
USING (bucket_id = 'property-images');

-- Step 4: Ensure RLS is enabled but with our permissive policy
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the bucket exists and is public (informational)
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'property-images';

-- Step 6: Grant necessary permissions
GRANT ALL ON storage.objects TO postgres, anon, authenticated;
GRANT ALL ON storage.buckets TO postgres, anon, authenticated;

-- NOTE: After running this, all images in property-images bucket will be publicly accessible
-- You can access them directly via: https://your-supabase-url/storage/v1/object/public/property-images/filename.jpg