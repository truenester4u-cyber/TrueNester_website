# 🔍 FLOOR PLANS DEBUGGING GUIDE

## Issue: Floor plans not saving or displaying

I've added comprehensive debugging tools to help identify the exact problem.

## 🛠️ Step-by-Step Debugging Process

### Step 1: Verify Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run this query to check if columns exist:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'properties' 
AND column_name IN ('payment_plan', 'handover_date', 'floor_plans')
ORDER BY column_name;
```

**Expected Result:** You should see 3 rows returned:
- `floor_plans` | `jsonb` | `'[]'::jsonb`
- `handover_date` | `text` | NULL
- `payment_plan` | `text` | NULL

**If you see 0 rows:** The migration hasn't been run. Go back and run the ALTER TABLE commands.

### Step 2: Check Existing Data

Run this query to see what's actually in the database:

```sql
SELECT id, title, floor_plans, payment_plan, handover_date
FROM properties
LIMIT 5;
```

**What to look for:**
- `floor_plans` column should show `[]` or JSON array
- If you see `NULL`, that's okay for now

### Step 3: Use the Diagnostic Page

1. Open your browser and go to: `http://localhost:8080/diagnostic`
2. Click **"Check Columns"** button
3. Open Browser Console (F12)
4. Look for these messages:
   - ✅ Available columns in properties table: [...]
   - ✅ Has floor_plans? true
   - ✅ Has payment_plan? true
   - ✅ Has handover_date? true

**If any show "false":** The migration didn't work. Run it again.

### Step 4: Test Saving in Admin Panel

1. Go to: `http://localhost:8080/admin/properties/edit/[any-property-id]`
2. Open Browser Console (F12)
3. Scroll to Floor Plans section
4. Add a floor plan:
   - Title: "Test Plan"
   - Size: "1000 sq ft"
   - Upload an image
   - Click "Add Floor Plan"

**Watch Console for:**
- 📥 ADMIN: Fetched property data: {...}
- 📥 ADMIN: Floor plans from DB: [...]
- 📝 ADMIN: Set floor_plans to form: [...]

5. Click "Update Property"

**Watch Console for:**
- 💾 ADMIN: Saving property with floor_plans: [...]
- 💾 ADMIN: Floor plans array length: 1
- 💾 ADMIN: Floor plans is array? true
- ✅ ADMIN: Property saved successfully: [...]

**If you see errors:**
- ❌ ADMIN: Error saving: {...} - Check the error message
- Look for "column does not exist" → Migration not run
- Look for "invalid input syntax" → Data format issue

### Step 5: Verify Data Was Saved

1. Go back to the Diagnostic Page: `http://localhost:8080/diagnostic`
2. Click "Refresh Properties"
3. Find the property you just edited
4. Check if floor_plans shows your data

**Expected:** You should see:
```json
[
  {
    "title": "Test Plan",
    "size": "1000 sq ft",
    "image": "https://..."
  }
]
```

**If you see NULL or []:** Data didn't save. Check console errors from Step 4.

### Step 6: Test Display on Frontend

1. Go to the property detail page: `http://localhost:8080/property/[property-id]`
2. Open Browser Console (F12)

**Watch Console for:**
- 🏠 FRONTEND: Property data loaded: {...}
- 🏠 FRONTEND: Floor plans from DB: [...]
- 🏠 FRONTEND: Floor plans is array? true
- 🏠 FRONTEND: Floor plans length: 1
- Checking floor plans condition: {exists: true, isArray: true, length: 1, data: [...]}

**If section doesn't appear:**
- Check if any of the condition values are false
- If exists=false: Data not loading
- If isArray=false: Data not in correct format
- If length=0: Array is empty

**If images don't show:**
- Check for image error messages in console
- Verify storage bucket is public
- Test image URL directly in browser

## 🔧 Common Issues & Solutions

### Issue: "Column does not exist"
**Solution:** Run the migration SQL in Supabase SQL Editor:
```sql
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb;
```

### Issue: Data saves but shows as NULL
**Possible causes:**
1. TypeScript types not matching
2. Supabase RLS policies blocking writes
3. Data being sent as wrong type

**Debug:** Check console logs when saving:
- 💾 ADMIN: Full property data: {...}
- Look at what's actually in `floor_plans` field

### Issue: Data in DB but not showing on frontend
**Possible causes:**
1. Query not selecting the column
2. Data being filtered out by condition
3. RLS policies blocking reads

**Debug:** Check console logs on property page:
- 🏠 FRONTEND: Floor plans from DB: (should show your data)
- If NULL: Query issue or RLS policy

### Issue: Images upload but don't display
**Possible causes:**
1. Storage bucket not public
2. Wrong URL format
3. CORS issues

**Debug:**
1. Copy image URL from admin panel
2. Paste directly in browser
3. If 404: Bucket doesn't exist or file wasn't uploaded
4. If 403: Bucket not public

## 📋 Checklist

Run through this in order:

- [ ] Database migration executed (Step 1)
- [ ] Columns exist in database (Step 1)
- [ ] Diagnostic page shows columns exist (Step 3)
- [ ] Can add floor plan in admin (Step 4)
- [ ] Console shows data being saved (Step 4)
- [ ] No errors in console when saving (Step 4)
- [ ] Diagnostic page shows saved data (Step 5)
- [ ] Storage bucket exists and is public
- [ ] Console shows data loading on frontend (Step 6)
- [ ] Floor plans section appears on property page (Step 6)
- [ ] Images display correctly (Step 6)

## 🆘 If Still Not Working

Share the console output from:
1. Admin panel when saving (💾 ADMIN messages)
2. Frontend when viewing property (🏠 FRONTEND messages)
3. Diagnostic page (✅ messages)
4. Any error messages (❌ messages)

This will tell me exactly what's failing!
