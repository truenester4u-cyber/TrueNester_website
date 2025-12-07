-- Run this in Supabase SQL Editor to fix the customer_id column type
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Change customer_id from UUID to TEXT so it accepts any string format
ALTER TABLE public.conversations 
ALTER COLUMN customer_id TYPE TEXT;
