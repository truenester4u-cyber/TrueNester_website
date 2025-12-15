-- Create customer_inquiries table for tracking property inquiries
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('viewing', 'information', 'purchase', 'rental', 'general')),
  message TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in-progress', 'closed')),
  agent_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_id ON public.customer_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_property_id ON public.customer_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON public.customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON public.customer_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_type ON public.customer_inquiries(inquiry_type);

ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Admin can view all inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Admin can update all inquiries" ON public.customer_inquiries;

CREATE POLICY "Users can view their own inquiries"
  ON public.customer_inquiries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inquiries"
  ON public.customer_inquiries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all inquiries"
  ON public.customer_inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update all inquiries"
  ON public.customer_inquiries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.handle_customer_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_customer_inquiry_updated_at ON public.customer_inquiries;
CREATE TRIGGER set_customer_inquiry_updated_at
  BEFORE UPDATE ON public.customer_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_customer_inquiry_updated_at();

GRANT SELECT, INSERT ON public.customer_inquiries TO authenticated;
GRANT SELECT, UPDATE ON public.customer_inquiries TO authenticated;
GRANT SELECT ON public.customer_inquiries TO anon;
