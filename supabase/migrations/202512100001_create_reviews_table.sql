-- Create reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    headline TEXT NOT NULL,
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Everyone can read approved reviews
CREATE POLICY "Public reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (status = 'approved');

-- Anyone can insert a review (pending by default)
CREATE POLICY "Anyone can insert a review" 
ON public.reviews FOR INSERT 
WITH CHECK (true);

-- Only authenticated users (admins) can view all reviews
-- Note: Assuming authenticated users are admins or we have a specific role check. 
-- For now, allowing authenticated users to view all for admin panel.
CREATE POLICY "Authenticated users can view all reviews" 
ON public.reviews FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can update reviews (approve/reject)
CREATE POLICY "Authenticated users can update reviews" 
ON public.reviews FOR UPDATE
TO authenticated 
USING (true);

-- Only authenticated users can delete reviews
CREATE POLICY "Authenticated users can delete reviews" 
ON public.reviews FOR DELETE
TO authenticated 
USING (true);

-- Add realtime
alter publication supabase_realtime add table public.reviews;
