-- Add payment_plan, handover_date, floor_plans, payment_plan_table, and total_units fields to properties table

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS payment_plan TEXT,
ADD COLUMN IF NOT EXISTS handover_date TEXT,
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_plan_table JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_units TEXT;

COMMENT ON COLUMN public.properties.payment_plan IS 'Payment plan details for the property (e.g., percentage breakdowns, installment schedule)';
COMMENT ON COLUMN public.properties.handover_date IS 'Expected handover date for the property (e.g., Q4 2025, December 2025)';
COMMENT ON COLUMN public.properties.floor_plans IS 'Array of floor plan objects with title, size, and image URL. Example: [{"title": "1 Bedroom Apartment", "size": "778 to 1,156 sq. ft.", "image": "https://..."}]';
COMMENT ON COLUMN public.properties.payment_plan_table IS 'Structured payment plan table with optional headers. Example: [{"header": "Studio Plan", "milestone": "Booking", "percentage": "20%", "note": "On reservation"}]';
COMMENT ON COLUMN public.properties.total_units IS 'Total units text to display in bold on website (e.g., "156 residential units")';
