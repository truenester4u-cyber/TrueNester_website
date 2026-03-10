-- =====================================================
-- CREATE PROPERTY-IMAGES STORAGE BUCKET
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- Step 1: Create the property-images bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,  -- Make it public immediately
  52428800,  -- 50MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true;  -- If bucket exists, make sure it's public

-- Step 2: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Public Access for property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON storage.objects;

-- Step 3: Create policy to allow public read access
CREATE POLICY "Public Access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Step 4: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Step 5: Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Step 6: Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Verify the bucket was created
SELECT 
  id, 
  name, 
  public,
  created_at,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'property-images';
node check-storage-access.js
