-- Add Trakheesi (DLD Permit) fields to properties table
-- Trakheesi/DLD QR code is mandatory from Dubai Land Department for every project listing
-- It shows the authenticity of the broker on social media and website

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS trakheesi_permit_number TEXT,
ADD COLUMN IF NOT EXISTS trakheesi_qr_image TEXT,
ADD COLUMN IF NOT EXISTS trakheesi_qr_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.trakheesi_permit_number IS 'DLD Trakheesi permit number for the property listing';
COMMENT ON COLUMN public.properties.trakheesi_qr_image IS 'Filename in property-images bucket for the Trakheesi QR code PNG image';
