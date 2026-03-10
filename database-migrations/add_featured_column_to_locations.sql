-- Add missing 'featured' column to locations table
-- This fixes the error: "Could not find the 'featured' column of 'locations' in the schema cache"

-- Add the featured column if it doesn't exist
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

-- Also fix column name mismatches to match the admin form expectations

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

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;
