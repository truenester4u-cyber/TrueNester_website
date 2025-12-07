-- Locations Table for Dubai Nest Hub
-- This table stores information about Dubai locations/neighborhoods

CREATE TABLE IF NOT EXISTS locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
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

-- Insert sample data
INSERT INTO locations (name, slug, description, image_url, properties_count, price_range, features, published) VALUES
('Downtown Dubai', 'downtown-dubai', 'Home to Burj Khalifa and Dubai Mall, the heart of the city', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c', 120, 'AED 800K - 15M', ARRAY['Burj Khalifa Views', 'Dubai Mall Access', 'Metro Connected', 'Premium Lifestyle'], true),
('Palm Jumeirah', 'palm-jumeirah', 'Iconic palm-shaped island with luxury beachfront living', 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5', 85, 'AED 2M - 50M', ARRAY['Beach Access', '5-Star Hotels', 'Luxury Villas', 'Water Sports'], true),
('Dubai Marina', 'dubai-marina', 'Waterfront community with stunning skyline views', 'https://images.unsplash.com/photo-1518684079-3c830dcef090', 150, 'AED 900K - 8M', ARRAY['Marina Walk', 'Restaurants & Cafes', 'Beach Proximity', 'Yacht Club'], true),
('Business Bay', 'business-bay', 'Modern business district with excellent connectivity', 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33', 95, 'AED 700K - 5M', ARRAY['Business Hub', 'Canal Views', 'Metro Access', 'Mixed-Use'], true),
('JBR', 'jbr', 'Jumeirah Beach Residence - beachfront living at its finest', 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745', 78, 'AED 1M - 6M', ARRAY['Beach Front', 'The Walk JBR', 'Retail Paradise', 'Vibrant Nightlife'], true),
('Arabian Ranches', 'arabian-ranches', 'Tranquil villa community with golf course', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9', 62, 'AED 1.5M - 10M', ARRAY['Golf Course', 'Family Community', 'Parks & Schools', 'Peaceful Living'], true);

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
