-- Locations Table for Dubai Nest Hub (WITHOUT SAMPLE DATA)
-- This table stores information about Dubai locations/neighborhoods
-- Use this version if you want to start fresh without any sample locations

CREATE TABLE IF NOT EXISTS locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    city VARCHAR(100),
    description TEXT,
    image_url TEXT,
    properties_count INTEGER DEFAULT 0,
    price_range VARCHAR(100),
    features TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);

-- Create index on published for filtering
CREATE INDEX IF NOT EXISTS idx_locations_published ON locations(published);

-- Create index on city for filtering
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to published locations
CREATE POLICY "Public locations are viewable by everyone"
    ON locations FOR SELECT
    USING (published = true);

-- Policy: Allow authenticated users to view all locations
CREATE POLICY "Authenticated users can view all locations"
    ON locations FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert locations
CREATE POLICY "Authenticated users can insert locations"
    ON locations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update locations
CREATE POLICY "Authenticated users can update locations"
    ON locations FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete locations
CREATE POLICY "Authenticated users can delete locations"
    ON locations FOR DELETE
    USING (auth.role() = 'authenticated');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- NOTE: No sample data inserted. Table is empty and ready for your locations.
