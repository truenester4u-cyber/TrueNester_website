# 🚀 QUICK SETUP GUIDE - Floor Plans Feature

## ⚡ Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste This SQL**
   ```sql
   -- Add the new columns to properties table
   ALTER TABLE public.properties 
   ADD COLUMN IF NOT EXISTS payment_plan TEXT,
   ADD COLUMN IF NOT EXISTS handover_date TEXT,
   ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb;

   -- Add helpful comments
   COMMENT ON COLUMN public.properties.payment_plan IS 'Payment plan details for the property';
   COMMENT ON COLUMN public.properties.handover_date IS 'Expected handover date for the property';
   COMMENT ON COLUMN public.properties.floor_plans IS 'Array of floor plan objects with title, size, and image URL';
   ```

4. **Click "RUN"** (bottom right)
   - You should see "Success. No rows returned"

## ⚡ Step 2: Verify Storage Bucket

1. **In Supabase Dashboard, go to Storage**
   - Click "Storage" in left sidebar

2. **Check if `property-images` bucket exists**
   - If YES: Make sure it's set to **PUBLIC**
   - If NO: Create it now (see below)

### To Create Storage Bucket:
1. Click "New bucket"
2. Name: `property-images`
3. **Toggle ON "Public bucket"** ⚠️ IMPORTANT
4. Click "Create bucket"

### To Make Existing Bucket Public:
1. Click on `property-images` bucket
2. Click "Settings" (gear icon)
3. Toggle ON "Public bucket"
4. Click "Save"

## ⚡ Step 3: Test the Feature

1. **Go to Admin Panel**
   - Navigate to: `http://localhost:8080/admin/properties`
   
2. **Edit or Create a Property**
   - Scroll down to "Floor Plans" section
   
3. **Add a Floor Plan**
   - Enter Plan Title (e.g., "1 Bedroom Apartment")
   - Enter Size (e.g., "778 to 1,156 sq. ft.")
   - Click "Upload" button to select an image from your device
   - Click "Add Floor Plan"
   
4. **Save the Property**
   - Click "Save Property" or "Update Property"

5. **View on Website**
   - Go to the property detail page on your main website
   - You should see the "Floorplans" section with interactive viewer

## 🔍 Troubleshooting

### If images don't upload:
- ✅ Check that `property-images` bucket exists
- ✅ Verify bucket is set to PUBLIC
- ✅ Check browser console for error messages

### If floor plans don't show on website:
- ✅ Verify database migration was successful
- ✅ Open browser DevTools (F12) → Console tab
- ✅ Look for debug messages showing floor_plans data
- ✅ Check if section appears at all (if not, data isn't loading)

### If you see console errors:
- Check the error message in browser console
- If "404" error: Storage bucket doesn't exist or is private
- If "CORS" error: Bucket needs to be public
- If "null" or "undefined": Database migration not run

## ✅ Success Checklist

- [ ] Database migration executed successfully
- [ ] `property-images` storage bucket exists and is PUBLIC
- [ ] Can upload floor plan image in admin panel
- [ ] Can see thumbnail preview after upload
- [ ] Can add multiple floor plans to a property
- [ ] Floor plans section appears on property detail page
- [ ] Can click different floor plans to view them
- [ ] Can zoom in/out with mouse wheel
- [ ] Can drag to pan when zoomed
- [ ] Payment plan and handover date sections display correctly

## 📝 Example Data

**Floor Plan:**
- Title: "1 Bedroom Apartment"
- Size: "778 to 1,156 sq. ft."
- Image: [Upload from device]

**Payment Plan:**
```
20% - On Booking
30% - During Construction
50% - On Handover
```

**Handover Date:**
```
Q4 2025
```

## Need Help?

If something isn't working:
1. Check the browser console (F12) for error messages
2. Verify all steps above were completed
3. Make sure you're logged in as admin
4. Clear browser cache and refresh
