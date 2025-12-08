# ⚡ EXECUTE NOW: Admin Panel Setup (5 Minutes)

## Step 1: Copy & Run This SQL in Supabase

**Location**: Supabase Dashboard → SQL Editor → New Query

**Copy everything below:**

```sql
-- ========================================
-- SITE SETTINGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT NOT NULL,
  site_description TEXT,
  site_keywords TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  about_us TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read site settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Only admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_site_settings_updated_at();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_created_at 
  ON public.site_settings(created_at);
```

**Action**: Click **Run** button ✓

---

## Step 2: Create Storage Bucket

**Location**: Supabase Dashboard → Storage → Buckets

**Actions:**
1. Click **Create a new bucket**
2. Name: `blog-images` (exact spelling)
3. Toggle **Public** ON
4. Click **Create bucket** ✓

---

## Step 3: Restart Dev Server

```powershell
# Stop current server (Ctrl+C)
# Then:
npm run dev
```

---

## Step 4: Test It! ✅

### Test 1: Settings Page
1. Go to Admin Dashboard
2. Click **Settings** button
3. Fill in at least:
   - Site Title (required)
   - Contact Email (required)
4. Click **Save Settings**
5. Should see success message ✓

### Test 2: Blog Image Upload
1. Go to Admin Dashboard
2. Click **Add Blog Post**
3. Fill title & category
4. Look for **Featured Image** section
5. Click upload area (or drag-drop image)
6. See image preview ✓
7. Complete form and create post ✓

### Test 3: Navigation
1. Dashboard → Settings button works ✓
2. Sidebar → Blog Posts → Create new works ✓

---

## Success Indicators

✅ Settings page loads at `/admin/settings`  
✅ Can fill and save settings  
✅ Blog image upload shows file picker  
✅ Image uploads complete without errors  
✅ Settings button no longer shows "Coming Soon"  

---

## Troubleshooting

### Issue: SQL error when running
**Solution**: 
- Copy entire SQL block again
- Paste in new query
- Run one more time

### Issue: Settings page 404
**Solution**:
- Refresh browser cache (Ctrl+Shift+R)
- Restart dev server

### Issue: Image upload fails
**Solution**:
- Check `blog-images` bucket exists
- Verify bucket is **PUBLIC**
- Try different image file (< 5MB)

### Issue: Can't see blog-images bucket
**Solution**:
- Go to Storage section
- Click **Create a new bucket** button
- Name exactly: `blog-images`

---

## What Changed (For Your Info)

### New Files
- `src/pages/admin/Settings.tsx` - Settings page
- `database-migrations/create_site_settings.sql` - Migration

### Updated Files
- `src/App.tsx` - Added route
- `src/pages/admin/AdminDashboard.tsx` - Fixed Settings button
- `src/pages/admin/BlogPostForm.tsx` - Added upload

### Database
- New table: `site_settings`
- New bucket: `blog-images`

---

## Features Now Available

| Feature | Status |
|---------|--------|
| Settings Page | ✅ Active |
| Image Upload | ✅ Active |
| Site Config | ✅ Active |
| Social Links | ✅ Active |
| Blog Images | ✅ Active |

---

## Next Steps

1. ✅ Run SQL
2. ✅ Create bucket
3. ✅ Restart server
4. ✅ Test features
5. Fill in site settings
6. Create first blog post with image

---

## Need Help?

- See `ADMIN_QUICK_START.md` for visual guide
- See `ADMIN_ENHANCEMENTS.md` for full docs
- Check browser console for errors
- Verify Supabase connection

---

**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy ⭐  
**Status**: Ready Now! 🚀
