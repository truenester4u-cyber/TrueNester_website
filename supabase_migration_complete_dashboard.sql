-- Complete Dashboard Migration: All required tables for dashboard functionality
-- Description: Creates saved_properties, customer_inquiries, reviews, and user_activity tables
-- Run this in Supabase SQL Editor

-- ======================================
-- 1. SAVED PROPERTIES TABLE
-- ======================================

-- Create saved_properties table for user favorites
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_properties_unique ON saved_properties(user_id, property_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON saved_properties(created_at DESC);

-- Enable RLS
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_properties (drop existing first)
DROP POLICY IF EXISTS "Users can view their own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can insert their own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can delete their own saved properties" ON saved_properties;

CREATE POLICY "Users can view their own saved properties"
  ON saved_properties
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved properties"
  ON saved_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved properties"
  ON saved_properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON saved_properties TO authenticated;

-- ======================================
-- 2. CUSTOMER INQUIRIES TABLE
-- ======================================

-- Create customer_inquiries table
CREATE TABLE IF NOT EXISTS customer_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'replied', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  agent_notes TEXT,
  agent_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_id ON customer_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_property_id ON customer_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON customer_inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_inquiries (drop existing first)
DROP POLICY IF EXISTS "Users can view their own inquiries" ON customer_inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON customer_inquiries;
DROP POLICY IF EXISTS "Users can update their own inquiries" ON customer_inquiries;

CREATE POLICY "Users can view their own inquiries"
  ON customer_inquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = agent_id);

CREATE POLICY "Users can insert their own inquiries"
  ON customer_inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inquiries"
  ON customer_inquiries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = agent_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON customer_inquiries TO authenticated;

-- ======================================
-- 3. REVIEWS TABLE
-- ======================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews (drop existing first)
DROP POLICY IF EXISTS "Everyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

CREATE POLICY "Everyone can view approved reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY "Users can view their own reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON reviews TO authenticated;
GRANT SELECT ON reviews TO anon;

-- ======================================
-- 4. USER ACTIVITY TABLE (from your file)
-- ======================================

-- Create enum for activity types (drop first if exists)
DROP TYPE IF EXISTS activity_type CASCADE;
CREATE TYPE activity_type AS ENUM (
  'property_view',
  'property_saved',
  'property_unsaved',
  'review_submitted',
  'review_updated',
  'inquiry_submitted',
  'inquiry_updated'
);

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  reference_id UUID NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('property', 'review', 'inquiry')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_reference ON user_activity(reference_id, reference_type);

-- Enable Row Level Security
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own activity (drop existing first)
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can update their own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can delete their own activity" ON user_activity;

CREATE POLICY "Users can view their own activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON user_activity
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity"
  ON user_activity
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_activity TO authenticated;

-- ======================================
-- 5. TRIGGERS AND FUNCTIONS
-- ======================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (drop existing first)
DROP TRIGGER IF EXISTS update_customer_inquiries_updated_at ON customer_inquiries;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_user_activity_updated_at ON user_activity;

CREATE TRIGGER update_customer_inquiries_updated_at
  BEFORE UPDATE ON customer_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activity_updated_at
  BEFORE UPDATE ON user_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- 6. SAMPLE DATA (OPTIONAL)
-- ======================================

-- Add some sample data for testing (uncomment if needed)
-- INSERT INTO properties (id, title, description, price, location, property_type, bedrooms, bathrooms, area, featured_image, published)
-- VALUES (
--   gen_random_uuid(),
--   'Luxury Villa in Dubai Marina',
--   'Beautiful 3-bedroom villa with stunning marina views',
--   5500000,
--   'Dubai Marina',
--   'villa',
--   3,
--   4,
--   2500,
--   'villa-marina.jpg',
--   true
-- );

-- ======================================
-- VERIFICATION QUERIES
-- ======================================

-- Uncomment to test the setup
-- SELECT 'saved_properties' as table_name, count(*) as count FROM saved_properties
-- UNION ALL
-- SELECT 'customer_inquiries', count(*) FROM customer_inquiries  
-- UNION ALL
-- SELECT 'reviews', count(*) FROM reviews
-- UNION ALL
-- SELECT 'user_activity', count(*) FROM user_activity;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('saved_properties', 'customer_inquiries', 'reviews', 'user_activity');

COMMENT ON TABLE saved_properties IS 'User favorite properties for dashboard display';
COMMENT ON TABLE customer_inquiries IS 'Customer inquiries and their status for dashboard';
COMMENT ON TABLE reviews IS 'Property reviews submitted by users';
COMMENT ON TABLE user_activity IS 'Tracks user activity history for dashboard timeline display';