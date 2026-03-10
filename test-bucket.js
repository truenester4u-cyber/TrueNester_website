import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jwmbxpqpjxqclfcahwcf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo'
);

console.log('Testing bucket access...\n');

// Test 1: List files in bucket
const { data, error } = await supabase.storage.from('property-images').list('');

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ Bucket accessible!');
  console.log('📁 Files in bucket:', data.length);
  if (data.length > 0) {
    console.log('\nSample files:');
    data.slice(0, 3).forEach(f => {
      const url = supabase.storage.from('property-images').getPublicUrl(f.name);
      console.log(`  - ${f.name}`);
      console.log(`    URL: ${url.data.publicUrl}`);
    });
  }
}

// Test 2: Check properties with images
const { data: props } = await supabase.from('properties').select('id, title, images').limit(1);
if (props && props.length > 0) {
  console.log('\n📋 Sample property:');
  console.log(`  Title: ${props[0].title}`);
  console.log(`  Images:`, props[0].images);
}
