-- SAFE DASHBOARD MIGRATION
-- Compatible with existing Supabase schema
-- Adds only missing tables and columns without conflicts
-- Updated: December 2025

-- ===============================================
-- STEP 1: CREATE ACTIVITY TYPE ENUM (if not exists)
-- ===============================================
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
        'property_view',
        'property_save',
        'property_unsave',
        'inquiry_submit',
        'review_submit',
        'search_perform',
        'profile_update',
        'login',
        'logout'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===============================================
-- STEP 2: ENSURE SAVED_PROPERTIES TABLE EXISTS
-- ===============================================
CREATE TABLE IF NOT EXISTS public.saved_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    UNIQUE(user_id, property_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON public.saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON public.saved_properties(created_at DESC);

-- Enable RLS
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can insert their own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can delete their own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can update their own saved properties" ON public.saved_properties;

CREATE POLICY "Users can view their own saved properties"
    ON public.saved_properties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved properties"
    ON public.saved_properties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved properties"
    ON public.saved_properties FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved properties"
    ON public.saved_properties FOR UPDATE
    USING (auth.uid() = user_id);

-- ===============================================
-- STEP 3: ENSURE CUSTOMER_INQUIRIES TABLE EXISTS
-- ===============================================
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    inquiry_type TEXT NOT NULL DEFAULT 'general',
    message TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    status TEXT DEFAULT 'new',
    agent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Add missing columns to existing table (safe - won't error if columns exist)
DO $$ 
BEGIN
    -- Add inquiry_type if it doesn't exist
    BEGIN
        ALTER TABLE public.customer_inquiries ADD COLUMN inquiry_type TEXT NOT NULL DEFAULT 'general';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add status if it doesn't exist
    BEGIN
        ALTER TABLE public.customer_inquiries ADD COLUMN status TEXT DEFAULT 'new';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add agent_notes if it doesn't exist
    BEGIN
        ALTER TABLE public.customer_inquiries ADD COLUMN agent_notes TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add updated_at if it doesn't exist
    BEGIN
        ALTER TABLE public.customer_inquiries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add responded_at if it doesn't exist
    BEGIN
        ALTER TABLE public.customer_inquiries ADD COLUMN responded_at TIMESTAMP WITH TIME ZONE;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_id ON public.customer_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_property_id ON public.customer_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON public.customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON public.customer_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_type ON public.customer_inquiries(inquiry_type);

-- Enable RLS
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view their own inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Admin can view all inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Admin can update all inquiries" ON public.customer_inquiries;

CREATE POLICY "Users can view their own inquiries"
    ON public.customer_inquiries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inquiries"
    ON public.customer_inquiries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin policies (assuming admin role in profiles table)
CREATE POLICY "Admin can view all inquiries"
    ON public.customer_inquiries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can update all inquiries"
    ON public.customer_inquiries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ===============================================
-- STEP 4: ENSURE REVIEWS TABLE EXISTS AND UPDATED
-- ===============================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns to existing reviews table (safe)
DO $$ 
BEGIN
    -- Add user_id if it doesn't exist
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add title if it doesn't exist
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN title TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add verified if it doesn't exist
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN verified BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add helpful_votes if it doesn't exist
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN helpful_votes INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add updated_at if it doesn't exist
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin can update all reviews" ON public.reviews;

-- Public can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
    ON public.reviews FOR SELECT
    USING (status = 'approved');

-- Users can view their own reviews
CREATE POLICY "Users can view their own reviews"
    ON public.reviews FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create reviews
CREATE POLICY "Users can insert their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reviews
CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- Admin can view all reviews
CREATE POLICY "Admin can view all reviews"
    ON public.reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Admin can update all reviews
CREATE POLICY "Admin can update all reviews"
    ON public.reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ===============================================
-- STEP 5: CREATE USER_ACTIVITY TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_agent TEXT,
    ip_address TEXT
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_data ON public.user_activity USING GIN (activity_data);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Admin can view all activity" ON public.user_activity;

CREATE POLICY "Users can view their own activity"
    ON public.user_activity FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
    ON public.user_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all activity"
    ON public.user_activity FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ===============================================
-- STEP 6: ADD MISSING COLUMNS TO PROPERTIES TABLE
-- ===============================================
-- Only add columns that might be missing for dashboard features
DO $$ 
BEGIN
    -- Add view_count if it doesn't exist (for analytics)
    BEGIN
        ALTER TABLE public.properties ADD COLUMN view_count INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    -- Add last_viewed_at if it doesn't exist
    BEGIN
        ALTER TABLE public.properties ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- ===============================================
-- STEP 7: CREATE HELPFUL FUNCTIONS
-- ===============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_customer_inquiries_updated_at ON public.customer_inquiries;
CREATE TRIGGER update_customer_inquiries_updated_at
    BEFORE UPDATE ON public.customer_inquiries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment property view count
CREATE OR REPLACE FUNCTION public.increment_property_views(property_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.properties 
    SET 
        view_count = COALESCE(view_count, 0) + 1,
        last_viewed_at = timezone('utc'::text, now())
    WHERE id = property_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO authenticated;

-- ===============================================
-- VERIFICATION QUERIES (Run these to check)
-- ===============================================

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('properties', 'saved_properties', 'customer_inquiries', 'reviews', 'user_activity', 'profiles')
-- ORDER BY table_name;

-- Check saved_properties structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'saved_properties'
-- ORDER BY ordinal_position;

-- Check customer_inquiries structure  
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'customer_inquiries'  
-- ORDER BY ordinal_position;

-- Check reviews structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'reviews'
-- ORDER BY ordinal_position;

-- Check user_activity structure
-- SELECT column_name, data_type, is_nullable, column_default  
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'user_activity'
-- ORDER BY ordinal_position;

-- MIGRATION COMPLETE!
-- This migration is safe to run multiple times and won't conflict with existing data.