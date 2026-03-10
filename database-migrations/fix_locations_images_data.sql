-- Fix locations images data migration
-- This copies data from old column names to new ones if needed

-- Step 1: Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'image')
    THEN 
        ALTER TABLE locations ADD COLUMN image TEXT;
        RAISE NOTICE 'Added image column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'property_count')
    THEN 
        ALTER TABLE locations ADD COLUMN property_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added property_count column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'featured')
    THEN 
        ALTER TABLE locations ADD COLUMN featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added featured column';
    END IF;
END $$;

-- Step 2: Copy data from old columns to new ones if they exist and new columns are empty
DO $$ 
BEGIN
    -- Copy image_url to image if image_url exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'image_url')
    THEN
        UPDATE locations 
        SET image = image_url 
        WHERE (image IS NULL OR image = '') 
          AND image_url IS NOT NULL 
          AND image_url != '';
        RAISE NOTICE 'Copied image_url data to image column';
    END IF;
    
    -- Copy properties_count to property_count if properties_count exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'properties_count')
    THEN
        UPDATE locations 
        SET property_count = properties_count 
        WHERE property_count IS NULL OR property_count = 0;
        RAISE NOTICE 'Copied properties_count data to property_count column';
    END IF;
END $$;

-- Step 3: Verify the data
SELECT 
    id,
    name,
    city,
    image,
    property_count,
    featured
FROM locations
ORDER BY name
LIMIT 10;

-- Step 4: Show summary
SELECT 
    city,
    COUNT(*) as total_locations,
    COUNT(CASE WHEN image IS NOT NULL AND image != '' THEN 1 END) as with_images,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured_count
FROM locations
GROUP BY city
ORDER BY city;
