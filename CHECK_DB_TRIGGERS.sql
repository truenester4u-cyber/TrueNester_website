-- Check for triggers on properties table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'properties';

-- Check for functions that might be converting URLs
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE prosrc ILIKE '%sign%' 
   OR prosrc ILIKE '%createSignedUrl%'
   OR prosrc ILIKE '%property%image%';
