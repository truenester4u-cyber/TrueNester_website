-- Check current state of locations table and image data
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;

-- 2. Check actual location data (first 10 rows)
SELECT 
    id,
    name,
    city,
    image,
    image_url,
    property_count,
    properties_count,
    featured
FROM locations
LIMIT 10;

-- 3. Count locations with/without images
SELECT 
    COUNT(*) as total_locations,
    COUNT(image) as locations_with_image_column,
    COUNT(image_url) as locations_with_image_url_column,
    COUNT(CASE WHEN image IS NOT NULL AND image != '' THEN 1 END) as locations_with_valid_image,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as locations_with_valid_image_url
FROM locations;
