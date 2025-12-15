-- CORRECTED DASHBOARD MIGRATION
-- Compatible with existing Supabase schema WITHOUT property_id foreign key issues
-- Adds property ID generation based on purpose: B (Buy), R (Rent), S (Sell)
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
-- STEP 2: ADD PROPERTY_CODE TO PROPERTIES TABLE
-- ===============================================
-- Add property_code column to generate readable IDs based on purpose
DO $$ 
BEGIN
    -- Add property_code if it doesn't exist
    BEGIN
        ALTER TABLE public.properties ADD COLUMN property_code TEXT UNIQUE;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
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

-- Create index for property_code
CREATE INDEX IF NOT EXISTS idx_properties_property_code ON public.properties(property_code);

-- ===============================================
-- STEP 3: CREATE FUNCTION TO GENERATE PROPERTY CODES
-- ===============================================
CREATE OR REPLACE FUNCTION public.generate_property_code(purpose_type TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    counter INTEGER;
    new_code TEXT;
BEGIN
    -- Set prefix based on purpose
    CASE LOWER(purpose_type)
        WHEN 'buy', 'sale', 'for sale' THEN prefix := 'B';
        WHEN 'rent', 'rental', 'for rent' THEN prefix := 'R';
        WHEN 'sell' THEN prefix := 'S';
        ELSE prefix := 'P'; -- Default for properties
    END CASE;
    
    -- Get next counter for this prefix
    SELECT COALESCE(MAX(CAST(SUBSTRING(property_code FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO counter
    FROM public.properties 
    WHERE property_code LIKE prefix || '%'
    AND property_code ~ ('^' || prefix || '[0-9]+$');
    
    -- Generate new code with zero padding
    new_code := prefix || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.generate_property_code(TEXT) TO authenticated, anon;

-- ===============================================
-- STEP 4: UPDATE EXISTING PROPERTIES WITH CODES
-- ===============================================
-- Generate property codes for existing properties without them
UPDATE public.properties 
SET property_code = public.generate_property_code(COALESCE(purpose, 'buy'))
WHERE property_code IS NULL;

-- ===============================================
-- STEP 5: CREATE TRIGGER FOR NEW PROPERTIES
-- ===============================================
CREATE OR REPLACE FUNCTION public.set_property_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set property_code if it's not already set
    IF NEW.property_code IS NULL THEN
        NEW.property_code := public.generate_property_code(COALESCE(NEW.purpose, 'buy'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_property_code ON public.properties;
CREATE TRIGGER trigger_set_property_code
    BEFORE INSERT ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.set_property_code();

-- ===============================================
-- STEP 6: ENSURE SAVED_PROPERTIES TABLE EXISTS
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
-- STEP 7: FIX CUSTOMER_INQUIRIES TABLE
-- ===============================================
-- Create the table structure that matches your existing schema
-- Remove property_id foreign key constraint that's causing issues

-- First, check if table exists and handle accordingly
DO $$
BEGIN
    -- If table doesn't exist, create it without foreign key constraint
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_inquiries' AND table_schema = 'public') THEN
        CREATE TABLE public.customer_inquiries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            property_code TEXT, -- Use property_code instead of property_id foreign key
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
    END IF;
END
$$;

-- Add missing columns safely to existing table
DO $$ 
BEGIN
    -- Add property_code if it doesn't exist (instead of property_id foreign key)
    BEGIN
        ALTER TABLE public.customer_inquiries ADD COLUMN property_code TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
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
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_property_code ON public.customer_inquiries(property_code);
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
-- STEP 8: ENSURE REVIEWS TABLE EXISTS AND UPDATED
-- ===============================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_code TEXT, -- Use property_code instead of property_id foreign key
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
    -- Add property_code if it doesn't exist (instead of property_id foreign key)
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN property_code TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
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
CREATE INDEX IF NOT EXISTS idx_reviews_property_code ON public.reviews(property_code);
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
-- STEP 9: CREATE USER_ACTIVITY TABLE (SIMPLIFIED)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);

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
-- STEP 10: CREATE HELPER FUNCTIONS
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

-- Function to get property by code
CREATE OR REPLACE FUNCTION public.get_property_by_code(code TEXT)
RETURNS TABLE(
    id UUID,
    property_code TEXT,
    title TEXT,
    purpose TEXT,
    price DECIMAL,
    location TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.property_code,
        p.title,
        p.purpose,
        p.price,
        p.location
    FROM public.properties p
    WHERE p.property_code = code
    AND p.published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_by_code(TEXT) TO authenticated, anon;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Uncomment these to test after migration:

-- Check property codes generated correctly
-- SELECT property_code, purpose, title FROM public.properties ORDER BY property_code;

-- Check table structure
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('properties', 'saved_properties', 'customer_inquiries', 'reviews', 'user_activity')
-- ORDER BY table_name;

-- Test property code generation
-- SELECT public.generate_property_code('buy') as buy_code,
--        public.generate_property_code('rent') as rent_code,
--        public.generate_property_code('sell') as sell_code;

-- MIGRATION COMPLETE!
-- This migration creates property codes and avoids foreign key constraint issues