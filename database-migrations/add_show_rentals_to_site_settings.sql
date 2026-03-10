-- Add show_rentals toggle to site_settings table
-- This controls whether rental listings are visible on the public website independently from projects (buy)

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS show_rentals BOOLEAN DEFAULT true;

-- Update the default row to have show_rentals = true
UPDATE public.site_settings SET show_rentals = true WHERE show_rentals IS NULL;

-- Verify
SELECT show_rentals FROM public.site_settings LIMIT 1;
