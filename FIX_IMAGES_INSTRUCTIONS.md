# Fix Image Display Issue - CRITICAL

## Problem
The Supabase `property-images` storage bucket is **NOT PUBLIC**, causing all images to return 404 errors.

## Solution
You need to make the bucket public by running the SQL migration.

## Steps to Fix

### Option 1: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire content from:
   ```
   supabase/migrations/20251222000000_make_property_images_bucket_public.sql
   ```
6. Click **Run** to execute the SQL
7. Refresh your website - images should now load!

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
cd c:/Users/asus/OneDrive/Documents/dubai-nest-hub-f3c99d5902f9f02eb444a8cf6bae253c0a7b8ead/dubai-nest-hub-f3c99d5902f9f02eb444a8cf6bae253c0a7b8ead
supabase db push
```

### Option 3: Manual Configuration

1. Go to Supabase Dashboard → Storage
2. Click on `property-images` bucket
3. Click **Settings** (gear icon)
4. Toggle **Public bucket** to ON
5. Click **Save**
6. Go to **Policies** tab
7. Add a new policy:
   - Name: "Public Access"
   - Policy: `SELECT` operation
   - Target roles: `public`
   - Using expression: `true`

## What This Does

The migration will:
- ✅ Make the `property-images` bucket public
- ✅ Allow anyone to view/download images (SELECT)
- ✅ Allow authenticated users to upload images (INSERT)
- ✅ Allow authenticated users to update images (UPDATE)
- ✅ Allow authenticated users to delete images (DELETE)

## Verify It Works

After running the migration:
1. Refresh your browser
2. Check the console - the 404 errors should be gone
3. Images should display in:
   - Admin properties list
   - Property detail pages
   - Property edit form
   - Frontend property cards

## Important Notes

- This is a **one-time fix** - once the bucket is public, all images will work
- New images uploaded will automatically be accessible
- Old images that were already uploaded will also become accessible
- This is safe - property images are meant to be public anyway

---

**After running the SQL, delete this file.**
