-- Add show_rentals toggle to site_settings table
-- This controls whether rental listings are visible on the public website independently from projects

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS show_rentals BOOLEAN DEFAULT true;

-- Backfill existing rows
UPDATE public.site_settings SET show_rentals = true WHERE show_rentals IS NULL;
