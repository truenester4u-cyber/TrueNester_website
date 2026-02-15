-- Add show_projects toggle to site_settings table
-- This controls whether property listings (projects) are visible on the public website

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS show_projects BOOLEAN DEFAULT true;

-- Allow anonymous (public) users to read site_settings so the frontend can check show_projects
CREATE POLICY "Allow public to read site settings"
  ON public.site_settings
  FOR SELECT
  TO anon
  USING (true);

-- Update the default row to have show_projects = true
UPDATE public.site_settings SET show_projects = true WHERE show_projects IS NULL;

-- Verify
SELECT show_projects FROM public.site_settings LIMIT 1;
