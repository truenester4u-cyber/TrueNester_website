# Complete RLS Fix for All Public Tables

## Problem
When you hard refresh the page (whether logged in or not), data from `properties`, `locations`, and `blog_posts` tables don't load because the RLS (Row Level Security) policies only allow the `anon` role, not the `authenticated` role.

## Solution

Run the following SQL in your **Supabase Dashboard → SQL Editor**:

```sql
-- ==============================================================================
-- FIX: RLS (Row Level Security) policies for public tables
-- ==============================================================================

-- 1. FIX PROPERTIES TABLE
DROP POLICY IF EXISTS "Allow all users to view published properties" ON "public"."properties";
DROP POLICY IF EXISTS "public_read_published" ON "public"."properties";
DROP POLICY IF EXISTS "Anyone can view published properties" ON "public"."properties";

CREATE POLICY "Anyone can view published properties" 
ON "public"."properties"
FOR SELECT 
TO public
USING (published = true);

-- 2. FIX LOCATIONS TABLE
DROP POLICY IF EXISTS "Allow all users to view published locations" ON "public"."locations";
DROP POLICY IF EXISTS "public_read_locations" ON "public"."locations";
DROP POLICY IF EXISTS "Anyone can view published locations" ON "public"."locations";

CREATE POLICY "Anyone can view published locations" 
ON "public"."locations"
FOR SELECT 
TO public
USING (published = true);

-- 3. FIX BLOG_POSTS TABLE
DROP POLICY IF EXISTS "Allow all users to view published blog posts" ON "public"."blog_posts";
DROP POLICY IF EXISTS "public_read_blog" ON "public"."blog_posts";
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON "public"."blog_posts";

DO $$
BEGIN
  CREATE POLICY "Anyone can view published blog posts" 
  ON "public"."blog_posts"
  FOR SELECT 
  TO public
  USING (published = true);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Verify the policies are created
SELECT policyname, cmd, roles FROM pg_policies 
WHERE tablename IN ('properties', 'locations', 'blog_posts') 
AND schemaname = 'public';
```

## What Changed in Frontend Code

### 1. **App.tsx** - Waits for Auth Before Rendering
- Added `authReady` state
- Shows loading spinner while auth initializes
- After auth is ready, **invalidates all React Query cache** to force refetch with proper auth context
- This ensures queries run AFTER the Supabase client has the correct auth token

### 2. **supabase-queries.ts** - Simplified
- Removed the complicated `waitForAuth` logic
- Now relies on the App-level auth initialization

### 3. **DISABLE_RLS_PROPERTIES.sql** - Updated
- Now includes fix for `properties`, `locations`, and `blog_posts` tables
- All use the same pattern: `TO public USING (published = true)`

## How It Works

### Without Login (Anonymous User)
1. User visits the site
2. Supabase uses `anon` role for queries
3. RLS policies allow `anon` role to read published data
4. Properties, locations, blogs load ✅

### With Login (Authenticated User)
1. User logs in
2. Auth token is stored in localStorage
3. On hard refresh:
   - App loads, shows spinner
   - `supabase.auth.getSession()` restores session from localStorage
   - Once session is restored, auth context is set up
   - React Query cache is invalidated
   - Queries run with `authenticated` role + proper token
4. RLS policies allow `authenticated` role to read published data
5. Properties, locations, blogs load ✅

## Testing

### Test 1: Anonymous User
1. Open incognito window (clear all auth tokens)
2. Visit http://localhost:8084/
3. Should see Featured Properties, Locations on home page ✅
4. Visit /blog, /locations - should see data ✅
5. Hard refresh - data still shows ✅

### Test 2: Logged-in User
1. Login with your credentials
2. Should see properties, locations, blogs ✅
3. Hard refresh (Ctrl+Shift+R)
4. Should see loading spinner briefly
5. Then data should appear ✅
6. Visit /dashboard, /favorites, /inquiries
7. Hard refresh - data loads correctly ✅

### Test 3: Sign Out
1. While logged in, click sign out
2. Should redirect to home page ✅
3. Should see anonymous user content ✅

## Key Points

- **RLS to public**: `TO public` means both `anon` and `authenticated` roles
- **Auth initialization**: App waits for auth before rendering anything
- **Query invalidation**: After auth is ready, all cached queries are cleared so they refetch with correct auth context
- **Persistent**: User session is stored in localStorage and auto-restored on page refresh

## If Still Having Issues

1. Verify RLS policies are set correctly:
   ```sql
   SELECT policyname, cmd, roles FROM pg_policies 
   WHERE tablename IN ('properties', 'locations', 'blog_posts');
   ```

2. Check browser DevTools Console for error messages

3. Clear browser cache and localStorage:
   - Open DevTools (F12)
   - Application → Storage → Clear Site Data

4. Hard refresh (Ctrl+Shift+R)

## Files Modified

- `src/App.tsx` - Added auth initialization and query invalidation
- `src/lib/supabase-queries.ts` - Removed complex waitForAuth logic
- `DISABLE_RLS_PROPERTIES.sql` - Updated with all three table policies
