-- Add featured_heart_of_europe flag to properties table
-- This enables the "Featured Developments in Heart of Europe" section on the homepage

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured_heart_of_europe BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_featured_heart_of_europe ON public.properties(featured_heart_of_europe);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'featured_heart_of_europe';
