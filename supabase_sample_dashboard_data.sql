-- Sample Data for Dashboard Testing
-- Run after the main migration to populate dashboard with test data
-- This will show data in saved properties, inquiries, and reviews

-- First, let's create a test property if it doesn't exist
INSERT INTO properties (
  id,
  title,
  description,
  price,
  location,
  property_type,
  bedrooms,
  bathrooms,
  area,
  featured_image,
  images,
  amenities,
  published,
  created_at
) VALUES (
  'test-property-1',
  'Luxury Penthouse in Dubai Marina',
  'Stunning 3-bedroom penthouse with panoramic views of Dubai Marina and the Arabian Gulf. Features modern amenities, private elevator access, and premium finishes throughout.',
  8500000,
  'Dubai Marina',
  'penthouse',
  3,
  4,
  3500,
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
  ARRAY['Swimming Pool', 'Gym', 'Parking', 'Security', 'Balcony', 'Sea View'],
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create another test property
INSERT INTO properties (
  id,
  title,
  description,
  price,
  location,
  property_type,
  bedrooms,
  bathrooms,
  area,
  featured_image,
  images,
  amenities,
  published,
  created_at
) VALUES (
  'test-property-2',
  'Modern Villa in Emirates Hills',
  'Exceptional 5-bedroom villa in the prestigious Emirates Hills community. Private pool, landscaped garden, and world-class amenities.',
  15000000,
  'Emirates Hills',
  'villa',
  5,
  6,
  6000,
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
  ARRAY['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'],
  ARRAY['Private Pool', 'Garden', 'Gym', 'Parking', 'Security', 'Maid Room'],
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Function to create sample data for a user
-- Replace 'USER_ID_HERE' with actual user ID from auth.users
CREATE OR REPLACE FUNCTION create_sample_dashboard_data(p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  -- Add saved properties
  INSERT INTO saved_properties (user_id, property_id, notes, created_at)
  VALUES 
    (p_user_id, 'test-property-1', 'Interested in this penthouse for investment', NOW() - INTERVAL '2 days'),
    (p_user_id, 'test-property-2', 'Perfect for family, need more information about schools nearby', NOW() - INTERVAL '1 day')
  ON CONFLICT (user_id, property_id) DO NOTHING;

  -- Add customer inquiries
  INSERT INTO customer_inquiries (
    user_id, property_id, customer_name, customer_email, customer_phone,
    message, inquiry_type, status, created_at
  )
  VALUES 
    (
      p_user_id, 'test-property-1', 'John Doe', 'john@example.com', '+971 50 123 4567',
      'I am interested in viewing this penthouse. Could we schedule a viewing for this weekend?',
      'viewing', 'new', NOW() - INTERVAL '3 days'
    ),
    (
      p_user_id, 'test-property-2', 'John Doe', 'john@example.com', '+971 50 123 4567',
      'I would like more information about the financing options available for this villa.',
      'purchase', 'in-progress', NOW() - INTERVAL '1 day'
    ),
    (
      p_user_id, NULL, 'John Doe', 'john@example.com', '+971 50 123 4567',
      'I am looking for a 2-bedroom apartment in Dubai Marina under AED 3M. Can you help me find suitable options?',
      'general', 'new', NOW() - INTERVAL '5 hours'
    )
  ON CONFLICT DO NOTHING;

  -- Add reviews
  INSERT INTO reviews (
    property_id, user_id, reviewer_name, reviewer_email, rating, title, comment, status, created_at
  )
  VALUES 
    (
      'test-property-1', p_user_id, 'John Doe', 'john@example.com', 5,
      'Amazing Property with Great Views',
      'I recently viewed this penthouse and was blown away by the quality and the stunning marina views. The location is perfect and the amenities are top-notch.',
      'approved', NOW() - INTERVAL '1 day'
    ),
    (
      'test-property-2', p_user_id, 'John Doe', 'john@example.com', 4,
      'Beautiful Villa but Expensive',
      'The villa is absolutely gorgeous and the Emirates Hills location is prestigious. However, the price point is quite high. Overall, great property for those who can afford it.',
      'pending', NOW() - INTERVAL '2 hours'
    )
  ON CONFLICT DO NOTHING;

  -- Add user activity
  INSERT INTO user_activity (
    user_id, activity_type, reference_id, reference_type, metadata, created_at
  )
  VALUES 
    (
      p_user_id, 'property_saved', 'test-property-1', 'property',
      '{"property_title": "Luxury Penthouse in Dubai Marina", "property_price": "AED 8,500,000"}',
      NOW() - INTERVAL '2 days'
    ),
    (
      p_user_id, 'property_saved', 'test-property-2', 'property',
      '{"property_title": "Modern Villa in Emirates Hills", "property_price": "AED 15,000,000"}',
      NOW() - INTERVAL '1 day'
    ),
    (
      p_user_id, 'inquiry_submitted', (SELECT id FROM customer_inquiries WHERE user_id = p_user_id LIMIT 1), 'inquiry',
      '{"property_title": "Luxury Penthouse in Dubai Marina"}',
      NOW() - INTERVAL '3 days'
    ),
    (
      p_user_id, 'review_submitted', (SELECT id FROM reviews WHERE user_id = p_user_id LIMIT 1), 'review',
      '{"property_title": "Luxury Penthouse in Dubai Marina", "review_rating": 5}',
      NOW() - INTERVAL '1 day'
    )
  ON CONFLICT DO NOTHING;

  RETURN 'Sample data created successfully for user: ' || p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Instructions for use:
-- 1. First run the main migration (supabase_migration_complete_dashboard.sql)
-- 2. Find your user ID by running: SELECT id, email FROM auth.users;
-- 3. Replace 'YOUR_USER_ID' below with your actual user ID and run:

-- SELECT create_sample_dashboard_data('YOUR_USER_ID'::UUID);

-- To clean up test data later:
-- DELETE FROM user_activity WHERE user_id = 'YOUR_USER_ID';
-- DELETE FROM reviews WHERE user_id = 'YOUR_USER_ID';  
-- DELETE FROM customer_inquiries WHERE user_id = 'YOUR_USER_ID';
-- DELETE FROM saved_properties WHERE user_id = 'YOUR_USER_ID';

COMMENT ON FUNCTION create_sample_dashboard_data IS 'Creates sample data for dashboard testing - saved properties, inquiries, reviews, and activity';