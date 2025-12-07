-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This adds floor_plans, payment_plan, and handover_date fields
-- Copy and paste all lines below, then click RUN
-- ============================================

-- Add the new columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS payment_plan TEXT,
ADD COLUMN IF NOT EXISTS handover_date TEXT,
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb;

-- Add helpful comments
COMMENT ON COLUMN public.properties.payment_plan IS 'Payment plan details for the property';
COMMENT ON COLUMN public.properties.handover_date IS 'Expected handover date for the property';
COMMENT ON COLUMN public.properties.floor_plans IS 'Array of floor plan objects with title, size, and image URL';

-- Verify the columns were added (you should see 3 rows returned)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'properties' 
AND column_name IN ('payment_plan', 'handover_date', 'floor_plans')
ORDER BY column_name;

-- ============================================
-- DONE! Close SQL Editor and test your property form
-- ============================================
