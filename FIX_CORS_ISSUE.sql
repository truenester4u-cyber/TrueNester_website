-- =====================================================
-- FIX CORS ISSUE FOR PROPERTY-IMAGES BUCKET
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- This ensures the bucket has proper CORS settings for browser access

-- Step 1: Update bucket to ensure it's public
UPDATE storage.buckets
SET public = true
WHERE id = 'property-images';

-- Step 2: Verify bucket settings
SELECT 
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'property-images';

-- Step 3: Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (qual LIKE '%property-images%' OR with_check LIKE '%property-images%');
