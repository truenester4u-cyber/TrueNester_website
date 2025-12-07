-- Migration Script: Add all missing columns to properties table
-- Run this in your Supabase SQL Editor

-- Step 1: Make price column nullable (to allow price_display as alternative)
ALTER TABLE properties ALTER COLUMN price DROP NOT NULL;

-- Step 2: Add ALL potentially missing columns to the properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS price_display TEXT,
ADD COLUMN IF NOT EXISTS building_description TEXT,
ADD COLUMN IF NOT EXISTS plot_area TEXT,
ADD COLUMN IF NOT EXISTS unit_types JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_plan TEXT,
ADD COLUMN IF NOT EXISTS handover_date TEXT,
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS floor_number INTEGER,
ADD COLUMN IF NOT EXISTS featured_dubai BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_abu_dhabi BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_ras_al_khaimah BOOLEAN DEFAULT false;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY column_name;
