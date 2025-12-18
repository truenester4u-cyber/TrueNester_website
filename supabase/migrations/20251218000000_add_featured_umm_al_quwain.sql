-- Add featured_umm_al_quwain column to properties table
-- This enables properties to be featured on the Umm Al Quwain homepage section

-- Add the new column with default value false
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS featured_umm_al_quwain BOOLEAN DEFAULT false NOT NULL;

-- Create an index for better query performance when filtering featured properties
CREATE INDEX IF NOT EXISTS idx_properties_featured_umm_al_quwain 
ON public.properties(featured_umm_al_quwain) 
WHERE featured_umm_al_quwain = true;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.featured_umm_al_quwain IS 'Flag to mark property as featured in Umm Al Quwain homepage section';

-- Optional: Update existing properties in Umm Al Quwain to be featured (if needed)
-- Uncomment the following line if you want to auto-feature existing UAQ properties:
-- UPDATE public.properties SET featured_umm_al_quwain = true WHERE city = 'Umm Al Quwain' AND published = true;
