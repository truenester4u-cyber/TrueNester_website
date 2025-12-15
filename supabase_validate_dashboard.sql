-- Quick validation script to check if dashboard tables exist
-- Run this in Supabase SQL Editor to verify setup

SELECT 
  'Table Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status
FROM (
  VALUES 
    ('saved_properties'),
    ('customer_inquiries'), 
    ('reviews'),
    ('user_activity'),
    ('properties')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t 
  ON t.table_name = required_tables.table_name 
  AND t.table_schema = 'public'
ORDER BY required_tables.table_name;

-- Check RLS policies
SELECT 
  'RLS Policy Check' as check_type,
  tablename as table_name,
  policyname as policy_name
FROM pg_policies 
WHERE tablename IN ('saved_properties', 'customer_inquiries', 'reviews', 'user_activity')
ORDER BY tablename;

-- Check if user has any data
SELECT 
  'Data Check' as check_type,
  'saved_properties' as table_name,
  count(*) as record_count
FROM saved_properties
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Data Check',
  'customer_inquiries',
  count(*)
FROM customer_inquiries  
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Data Check', 
  'reviews',
  count(*)
FROM reviews
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Data Check',
  'user_activity', 
  count(*)
FROM user_activity
WHERE user_id = auth.uid();