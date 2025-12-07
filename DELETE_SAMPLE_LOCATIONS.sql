-- ============================================
-- DELETE SAMPLE/SEED LOCATIONS
-- ============================================
-- Run this in Supabase SQL Editor to remove
-- the sample locations that were auto-created
-- ============================================

-- Delete the 6 sample locations by their slugs
DELETE FROM locations 
WHERE slug IN (
  'downtown-dubai',
  'palm-jumeirah',
  'dubai-marina',
  'business-bay',
  'jbr',
  'arabian-ranches'
);

-- Verify deletion (should return 0 if all deleted)
SELECT COUNT(*) as remaining_sample_locations 
FROM locations 
WHERE slug IN (
  'downtown-dubai',
  'palm-jumeirah',
  'dubai-marina',
  'business-bay',
  'jbr',
  'arabian-ranches'
);

-- ============================================
-- DONE! Sample locations removed.
-- Only your manually added locations remain.
-- ============================================
