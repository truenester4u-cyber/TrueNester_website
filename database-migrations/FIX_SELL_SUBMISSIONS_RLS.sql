-- ============================================================
-- FIX: RLS Policies for Sell Submissions, Conversations & Storage
-- ============================================================
-- Problem: After enabling RLS, sell submissions fail because:
-- 1. Anonymous/unauthenticated users can't insert into conversations
-- 2. Anonymous users can't insert into chat_messages
-- 3. Storage bucket policies block image uploads/reads
-- 4. Admin panel can't read images with signed URLs
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Fix conversations table RLS
-- ============================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "conversations_anon_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_auth_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete" ON public.conversations;
DROP POLICY IF EXISTS "Public insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admin read all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admin update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow public insert" ON public.conversations;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can delete conversations" ON public.conversations;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ANYONE to INSERT conversations (for sell forms, contact forms, chatbot)
CREATE POLICY "Anyone can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT all conversations (for admin panel)
CREATE POLICY "Authenticated users can read conversations"
ON public.conversations FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 3: Allow authenticated users to UPDATE conversations (for admin panel)
CREATE POLICY "Authenticated users can update conversations"
ON public.conversations FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Allow authenticated users to DELETE conversations (for admin cleanup)
CREATE POLICY "Authenticated users can delete conversations"
ON public.conversations FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================================
-- PART 2: Fix chat_messages table RLS
-- ============================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "Public insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admin read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow public insert" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can create chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can update chat messages" ON public.chat_messages;

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ANYONE to INSERT chat messages (for chatbot, contact forms)
CREATE POLICY "Anyone can create chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT all messages (for admin panel)
CREATE POLICY "Authenticated users can read chat messages"
ON public.chat_messages FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 3: Allow authenticated users to UPDATE messages (for marking as read)
CREATE POLICY "Authenticated users can update chat messages"
ON public.chat_messages FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- PART 3: Fix storage bucket for property-images
-- ============================================================

-- Make the bucket public (allows direct URL access)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'property-images';

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop ALL existing storage policies that might be restrictive
DROP POLICY IF EXISTS "Restrict access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read property images" ON storage.objects;
DROP POLICY IF EXISTS "property_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Public access to property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete property images" ON storage.objects;

-- NOTE: RLS is already enabled on storage.objects by Supabase
-- We only need to create the policies

-- Policy 1: ANYONE can READ images from property-images bucket (public viewing)
CREATE POLICY "Anyone can read property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Policy 2: ANYONE can INSERT/UPLOAD images to property-images bucket
-- (needed for sell form uploads from anonymous visitors)
CREATE POLICY "Anyone can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

-- Policy 3: Authenticated users can UPDATE images
CREATE POLICY "Authenticated can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Policy 4: Authenticated users can DELETE images
CREATE POLICY "Authenticated can delete property images"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- ============================================================
-- PART 4: Grant necessary permissions on PUBLIC schema only
-- ============================================================

-- Grant permissions on public tables (we CAN do this)
GRANT ALL ON public.conversations TO anon, authenticated;
GRANT ALL ON public.chat_messages TO anon, authenticated;

-- Grant sequence permissions (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- NOTE: We cannot GRANT on storage.objects/buckets directly
-- Supabase manages those permissions internally via RLS policies

-- ============================================================
-- PART 5: Verify the fixes
-- ============================================================

-- Check bucket is public
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'property-images';

-- List active policies on conversations
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'conversations';

-- List active policies on chat_messages
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'chat_messages';

-- List active policies on storage.objects
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================
-- SUCCESS! After running this:
-- ✅ Anonymous users can submit sell forms
-- ✅ Anonymous users can upload property images
-- ✅ Sell submissions appear in admin panel
-- ✅ Images display correctly in admin panel
-- ✅ Slack notifications should work (if webhook is configured)
-- ============================================================
