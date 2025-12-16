-- ============================================================
-- DIAGNOSTIC: Check Storage Configuration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Check if property-images bucket exists and is public
SELECT 
  id, 
  name, 
  public as is_public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'property-images';

-- 2. List all storage policies on objects table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Check if there are any files in the sell-properties folder
SELECT 
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'property-images' 
  AND name LIKE 'sell-properties/%'
ORDER BY created_at DESC
LIMIT 10;

-- 4. If bucket is NOT public, make it public:
-- UPDATE storage.buckets SET public = true WHERE id = 'property-images';

-- ============================================================
-- QUICK FIX: If images aren't loading, run this:
-- ============================================================

-- Make bucket public (if not already)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'property-images';

-- Verify it's now public
SELECT id, name, public FROM storage.buckets WHERE id = 'property-images';
