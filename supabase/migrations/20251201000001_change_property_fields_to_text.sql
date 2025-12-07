-- Change bedrooms, bathrooms, size fields to TEXT to support flexible input formats

ALTER TABLE public.properties 
ALTER COLUMN bedrooms TYPE TEXT USING bedrooms::TEXT,
ALTER COLUMN bathrooms TYPE TEXT USING bathrooms::TEXT,
ALTER COLUMN size_sqft TYPE TEXT USING size_sqft::TEXT,
ALTER COLUMN size_sqm TYPE TEXT USING size_sqm::TEXT;

COMMENT ON COLUMN public.properties.bedrooms IS 'Bedroom count or description (e.g., "1", "2", "Studio - 4 Bedroom", "1-3 BR")';
COMMENT ON COLUMN public.properties.bathrooms IS 'Bathroom count or description (e.g., "1", "2.5", "1-2")';
COMMENT ON COLUMN public.properties.size_sqft IS 'Size in square feet (e.g., "1200", "1200-1500", "1,200 sqft")';
COMMENT ON COLUMN public.properties.size_sqm IS 'Size in square meters (e.g., "110", "110-140")';
