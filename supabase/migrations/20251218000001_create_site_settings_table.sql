-- Create comprehensive site_settings table for admin configuration
-- This table stores all site-wide settings in a single row

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- General Settings
  site_name TEXT DEFAULT 'Dubai Nest Hub',
  site_tagline TEXT DEFAULT 'Find Your Perfect Property in UAE',
  site_description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  
  -- SEO Settings
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  google_analytics_id TEXT,
  google_tag_manager_id TEXT,
  facebook_pixel_id TEXT,
  
  -- Email Settings
  smtp_host TEXT,
  smtp_port TEXT DEFAULT '587',
  smtp_user TEXT,
  smtp_password TEXT,
  email_from_name TEXT,
  email_from_address TEXT,
  
  -- Notification Settings
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_inquiry_notifications BOOLEAN DEFAULT true,
  enable_new_property_alerts BOOLEAN DEFAULT false,
  notification_email TEXT,
  
  -- Currency & Display Settings
  default_currency TEXT DEFAULT 'AED',
  currency_symbol TEXT DEFAULT 'AED',
  price_format TEXT DEFAULT '1,234,567',
  properties_per_page INTEGER DEFAULT 12,
  enable_price_on_request BOOLEAN DEFAULT true,
  
  -- Social Media Links
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  whatsapp_number TEXT,
  
  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#DC2626',
  secondary_color TEXT DEFAULT '#1F2937',
  
  -- Feature Toggles
  enable_chat BOOLEAN DEFAULT true,
  enable_property_comparison BOOLEAN DEFAULT true,
  enable_saved_properties BOOLEAN DEFAULT true,
  enable_property_alerts BOOLEAN DEFAULT true,
  enable_virtual_tours BOOLEAN DEFAULT true,
  
  -- Legal URLs
  terms_url TEXT,
  privacy_url TEXT,
  cookie_policy_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on id for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_id ON public.site_settings(id);

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read settings
CREATE POLICY "Allow admins to read site settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow admins to update settings
CREATE POLICY "Allow admins to update site settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow admins to insert settings
CREATE POLICY "Allow admins to insert site settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default settings row if none exists
INSERT INTO public.site_settings (
  site_name,
  site_tagline,
  default_currency,
  currency_symbol,
  price_format,
  properties_per_page,
  primary_color,
  secondary_color,
  enable_chat,
  enable_property_comparison,
  enable_saved_properties,
  enable_property_alerts,
  enable_virtual_tours,
  enable_email_notifications,
  enable_inquiry_notifications,
  enable_price_on_request
)
SELECT 
  'Dubai Nest Hub',
  'Find Your Perfect Property in UAE',
  'AED',
  'AED',
  '1,234,567',
  12,
  '#DC2626',
  '#1F2937',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- Add comment to table
COMMENT ON TABLE public.site_settings IS 'Stores all site-wide configuration settings for the real estate platform';
