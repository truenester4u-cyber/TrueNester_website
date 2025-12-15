-- Migration: Create user_activity table for tracking user actions
-- Description: Stores timeline of user activities (property views, favorites, reviews, inquiries)
-- Run this in Supabase SQL Editor

-- Create enum for activity types
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

-- RLS Policies: Users can only see their own activity
CREATE POLICY "Users can view their own activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies: Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can update their own activity
CREATE POLICY "Users can update their own activity"
  ON user_activity
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can delete their own activity
CREATE POLICY "Users can delete their own activity"
  ON user_activity
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_user_activity_updated_at_trigger
  BEFORE UPDATE ON user_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activity_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_activity TO authenticated;

-- Add helpful comment
COMMENT ON TABLE user_activity IS 'Tracks user activity history for dashboard timeline display';
COMMENT ON COLUMN user_activity.metadata IS 'Store additional context like property title, review rating, etc.';

-- Sample query to verify setup
-- SELECT * FROM user_activity WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 10;
