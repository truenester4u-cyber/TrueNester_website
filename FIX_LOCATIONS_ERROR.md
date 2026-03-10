# Fix Locations Admin Panel Error

## Problem
Error: "Could not find the 'featured' column of 'locations' in the schema cache"

## Solution
The locations table is missing the `featured` column and has column name mismatches.

## Steps to Fix

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Click on **SQL Editor** in the left sidebar

### 2. Run the Migration
Copy and paste the entire contents of this file:
```
database-migrations/add_featured_column_to_locations.sql
```

Or copy this SQL directly:

```sql
-- Add missing 'featured' column to locations table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'featured'
    ) THEN
        ALTER TABLE locations ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add index for featured column for better performance
CREATE INDEX IF NOT EXISTS idx_locations_featured ON locations(featured);

-- Rename properties_count to property_count if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'properties_count'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'property_count'
    ) THEN
        ALTER TABLE locations RENAME COLUMN properties_count TO property_count;
    END IF;
END $$;

-- Rename image_url to image if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'image_url'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'image'
    ) THEN
        ALTER TABLE locations RENAME COLUMN image_url TO image;
    END IF;
END $$;
```

### 3. Execute
Click the **RUN** button in the SQL Editor

### 4. Verify
The query should complete successfully. You'll see a results table showing all columns in the locations table, including the new `featured` column.

### 5. Test
Go back to your admin panel and try creating a location again. The error should be fixed!

## What This Does
- ✅ Adds the missing `featured` column (boolean, default false)
- ✅ Renames `properties_count` → `property_count` 
- ✅ Renames `image_url` → `image`
- ✅ Adds performance index for the featured column
- ✅ All changes are safe and won't lose data

## After Migration
The locations form in your admin panel will now work correctly with all fields:
- Name
- Slug
- City
- Description
- Image URL
- Properties Count
- **Featured** (toggle switch)
