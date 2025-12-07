-- Allow nullable numeric price and introduce display price text column
ALTER TABLE public.properties ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_display TEXT;
