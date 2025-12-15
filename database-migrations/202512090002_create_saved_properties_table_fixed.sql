-- Create saved_properties table for customer saved properties
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON public.saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON public.saved_properties(created_at DESC);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can insert their own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can delete their own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can update their own saved properties" ON public.saved_properties;

CREATE POLICY "Users can view their own saved properties"
  ON public.saved_properties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved properties"
  ON public.saved_properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved properties"
  ON public.saved_properties
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved properties"
  ON public.saved_properties
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_properties TO authenticated;
GRANT SELECT ON public.saved_properties TO anon;
