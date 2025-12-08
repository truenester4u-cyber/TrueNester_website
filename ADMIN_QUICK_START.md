# 🚀 Admin Panel - Quick Setup (5 Minutes)

## What You Got

✅ **Settings Page** - Fully functional settings management  
✅ **Blog Image Upload** - Direct file upload to blog posts  
✅ **Settings Button** - Now navigates to settings (no more "coming soon")

---

## 3 Quick Steps to Activate

### Step 1️⃣: Setup Supabase (2 minutes)

**A) Create site_settings table:**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy-paste this:

```sql
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

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

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

CREATE INDEX IF NOT EXISTS idx_site_settings_created_at ON public.site_settings(created_at);
```

5. Click **Run** ✓

**B) Create blog-images bucket:**
1. Go to **Storage** in Supabase
2. Click **Create a new bucket**
3. Name: `blog-images`
4. Toggle **Public** ON
5. Click **Create bucket** ✓

### Step 2️⃣: Restart Your Dev Server (1 minute)

```powershell
npm run dev
```

### Step 3️⃣: Test It Out (2 minutes)

1. Go to **Admin Dashboard** → **Settings** ✓
2. Fill in your site info and click **Save Settings** ✓
3. Go to **Admin Dashboard** → **Add Blog Post** ✓
4. Upload an image by clicking the upload area ✓
5. Create the post ✓

---

## 🎯 New Routes

| Route | Purpose |
|-------|---------|
| `/admin/settings` | Site settings management |
| `/admin/blog` | Blog posts list |
| `/admin/blog/new` | Create blog post with image upload |
| `/admin/blog/edit/:id` | Edit blog post |

---

## ✨ Key Features

### Settings Page
- Site title & description
- Contact email & phone
- Address
- Social media links
- About Us section
- Auto-save timestamps

### Blog Image Upload
- Direct file upload (PNG, JPG, GIF)
- Max 5MB file size
- Image preview
- Fallback URL paste option
- Automatic cloud storage

---

## 📝 Features Added

### File: `src/pages/admin/Settings.tsx` (NEW)
- Complete settings management UI
- Form validation
- Database integration
- Auto-timestamp updates

### File: `src/pages/admin/BlogPostForm.tsx` (ENHANCED)
- Image upload with file validation
- Image preview system
- Direct file upload to Supabase Storage
- Fallback URL option
- Error handling

### File: `src/App.tsx` (UPDATED)
- New route: `/admin/settings`
- Settings component import

### File: `src/pages/admin/AdminDashboard.tsx` (FIXED)
- Settings button now works
- Navigation to settings page

---

## 🔐 Security

- RLS (Row Level Security) enabled
- Admin-only access to write/update
- Public can view site settings (read-only)
- File uploads validated
- Database mutations secured

---

## 🐛 Troubleshooting

**Settings page shows blank?**
→ Normal! Fill in data and click Save Settings.

**Image upload fails?**
→ Check that `blog-images` bucket is PUBLIC in Supabase

**Can't save settings?**
→ Verify you have admin role in Supabase Auth

**Post doesn't appear on blog page?**
→ Make sure to toggle "Publish immediately" checkbox

---

## 📚 Full Documentation

For complete details, see: `ADMIN_ENHANCEMENTS.md`

---

**Status**: ✅ Ready to Use  
**Setup Time**: ~5 minutes  
**Difficulty**: Easy  
**Dependencies**: Supabase with RLS enabled
