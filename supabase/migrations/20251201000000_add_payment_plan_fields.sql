-- Add payment_plan_table and total_units fields to properties table

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS payment_plan_table JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_units TEXT;

COMMENT ON COLUMN public.properties.payment_plan_table IS 'Structured payment plan table with optional headers. Example: [{"header": "Studio Plan", "milestone": "Booking", "percentage": "20%", "note": "On reservation"}]';
COMMENT ON COLUMN public.properties.total_units IS 'Total units text to display in bold on website (e.g., "156 residential units")';
