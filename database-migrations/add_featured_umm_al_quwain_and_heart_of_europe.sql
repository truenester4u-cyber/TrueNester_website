-- Add featured_umm_al_quwain and featured_heart_of_europe flags to properties table
-- This enables the "Featured in Umm Al Quwain" and "Featured in Heart of Europe" sections on the homepage

-- Add featured_umm_al_quwain column
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured_umm_al_quwain BOOLEAN DEFAULT false;

-- Add featured_heart_of_europe column
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured_heart_of_europe BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_featured_umm_al_quwain ON public.properties(featured_umm_al_quwain);
CREATE INDEX IF NOT EXISTS idx_properties_featured_heart_of_europe ON public.properties(featured_heart_of_europe);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'properties' 
  AND column_name IN ('featured_umm_al_quwain', 'featured_heart_of_europe')
ORDER BY column_name;
