-- Add all missing fields to properties table in correct order

-- Add payment and floor plan fields
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS payment_plan TEXT,
ADD COLUMN IF NOT EXISTS handover_date TEXT,
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_plan_table JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_units TEXT;

-- Change numeric fields to TEXT for flexible input
ALTER TABLE public.properties 
ALTER COLUMN bedrooms TYPE TEXT USING CASE 
  WHEN bedrooms IS NULL THEN NULL 
  ELSE bedrooms::TEXT 
END,
ALTER COLUMN bathrooms TYPE TEXT USING CASE 
  WHEN bathrooms IS NULL THEN NULL 
  ELSE bathrooms::TEXT 
END,
ALTER COLUMN size_sqft TYPE TEXT USING CASE 
  WHEN size_sqft IS NULL THEN NULL 
  ELSE size_sqft::TEXT 
END,
ALTER COLUMN size_sqm TYPE TEXT USING CASE 
  WHEN size_sqm IS NULL THEN NULL 
  ELSE size_sqm::TEXT 
END;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.payment_plan IS 'Payment plan details for the property (e.g., percentage breakdowns, installment schedule)';
COMMENT ON COLUMN public.properties.handover_date IS 'Expected handover date for the property (e.g., Q4 2025, December 2025)';
COMMENT ON COLUMN public.properties.floor_plans IS 'Array of floor plan objects with title, size, and image URL. Example: [{"title": "1 Bedroom Apartment", "size": "778 to 1,156 sq. ft.", "image": "https://..."}]';
COMMENT ON COLUMN public.properties.payment_plan_table IS 'Structured payment plan table with optional headers. Example: [{"header": "Studio Plan", "milestone": "Booking", "percentage": "20%", "note": "On reservation"}]';
COMMENT ON COLUMN public.properties.total_units IS 'Total units text to display in bold on website (e.g., "156 residential units")';
COMMENT ON COLUMN public.properties.bedrooms IS 'Bedroom count or description (e.g., "1", "2", "Studio - 4 Bedroom", "1-3 BR")';
COMMENT ON COLUMN public.properties.bathrooms IS 'Bathroom count or description (e.g., "1", "2.5", "1-2")';
COMMENT ON COLUMN public.properties.size_sqft IS 'Size in square feet (e.g., "1200", "1200-1500", "1,200 sqft")';
COMMENT ON COLUMN public.properties.size_sqm IS 'Size in square meters (e.g., "110", "110-140")';
