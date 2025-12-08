-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT NOT NULL,
  site_description TEXT,
  site_keywords TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  about_us TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update site settings
CREATE POLICY "Only admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert site settings
CREATE POLICY "Only admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_site_settings_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_settings_created_at ON public.site_settings(created_at);
