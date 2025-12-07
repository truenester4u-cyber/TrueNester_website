-- Add per-city featured flags to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured_dubai BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured_abu_dhabi BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured_ras_al_khaimah BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_featured_dubai ON public.properties(featured_dubai);
CREATE INDEX IF NOT EXISTS idx_properties_featured_abu_dhabi ON public.properties(featured_abu_dhabi);
CREATE INDEX IF NOT EXISTS idx_properties_featured_ras_al_khaimah ON public.properties(featured_ras_al_khaimah);
