# Location City Field Migration Guide

## Overview
This migration adds a `city` field to the locations table to organize locations by city (Dubai, Abu Dhabi, Ras Al Khaimah).

## Steps to Apply Migration

### 1. Open Supabase Dashboard
- Go to your Supabase project: https://supabase.com/dashboard
- Navigate to: **SQL Editor** (in the left sidebar)

### 2. Run the Migration SQL
Copy and paste the following SQL into the SQL Editor and click **RUN**:

```sql
-- Add city column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Create index on city for faster filtering
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

-- Update existing locations to have city values based on their names
UPDATE locations SET city = 'Dubai' WHERE name ILIKE '%Dubai%' AND city IS NULL;
UPDATE locations SET city = 'Abu Dhabi' WHERE name ILIKE '%Abu Dhabi%' AND city IS NULL;
UPDATE locations SET city = 'Ras Al Khaimah' WHERE (name ILIKE '%Ras Al Khaimah%' OR name ILIKE '%RAK%') AND city IS NULL;
```

### 3. Verify Migration
After running the SQL:
1. Go to **Table Editor** → **locations** table
2. You should see a new `city` column
3. Existing locations should have their city automatically set based on their names

### 4. Refresh Admin Panel
- Go to your admin panel: `/admin/locations`
- Click the **Refresh** button
- You should now see 3 city cards: Dubai, Abu Dhabi, and Ras Al Khaimah

### 5. Ignore TypeScript Errors (Optional)
- You may see TypeScript errors about "locations" table not existing in types
- These are just type checking errors - the code works fine at runtime
- The errors will disappear after you run the migration
- You can continue using the app normally

## What Changed

### Admin Panel
- ✅ Locations page now shows 3 city cards (Dubai, Abu Dhabi, Ras Al Khaimah)
- ✅ Each city card shows its locations as sub-areas
- ✅ "Add Location" button now pre-selects the city
- ✅ Location form has a city dropdown selector

### Main Website
- ✅ Home page shows separate sections for each city's locations
- ✅ Locations page shows all locations from all cities
- ✅ Each location is properly filtered by city field

### Database
- ✅ New `city` column in locations table
- ✅ Index added for fast city filtering
- ✅ Existing locations auto-categorized by city

## How to Use

### Adding a New Location
1. Go to **Admin** → **Locations**
2. Click **Add Location** on any city card (Dubai, Abu Dhabi, or RAK)
3. The city will be pre-selected
4. Fill in location details (name, description, etc.)
5. Publish when ready

### Location Visibility
- Published locations with city = "Dubai" → appear in Dubai section on home page
- Published locations with city = "Abu Dhabi" → appear in Abu Dhabi section on home page
- Published locations with city = "Ras Al Khaimah" → appear in RAK section on home page
- All published locations → appear on `/locations` page

## Troubleshooting

### If locations don't show up in city cards:
1. Check that the location has a `city` value set
2. Make sure the location is published
3. Try clicking the Refresh button in the admin panel

### If the city column doesn't exist:
- Make sure you ran the migration SQL in Supabase
- Check the SQL Editor for any error messages
- Verify you're in the correct Supabase project

## Next Steps
After migration, you can:
- Add locations for Dubai, Abu Dhabi, and Ras Al Khaimah
- Each location will automatically appear in the correct city section
- Properties can be linked to these locations
