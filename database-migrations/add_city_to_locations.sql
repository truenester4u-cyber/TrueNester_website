-- Add city column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Create index on city for faster filtering
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

-- Update existing locations to have city values based on their names
UPDATE locations SET city = 'Dubai' WHERE name ILIKE '%Dubai%' AND city IS NULL;
UPDATE locations SET city = 'Abu Dhabi' WHERE name ILIKE '%Abu Dhabi%' AND city IS NULL;
UPDATE locations SET city = 'Ras Al Khaimah' WHERE (name ILIKE '%Ras Al Khaimah%' OR name ILIKE '%RAK%') AND city IS NULL;
