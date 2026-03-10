import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jwmbxpqpjxqclfcahwcf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo'
);

console.log('🔍 Checking RAW database values...\n');

// Get latest 3 properties
const { data } = await supabase
  .from('properties')
  .select('id, title, images, featured_image, created_at')
  .order('created_at', { ascending: false })
  .limit(3);

data.forEach((prop, i) => {
  console.log(`\n=== Property ${i + 1}: ${prop.title} ===`);
  console.log(`Created: ${prop.created_at}`);
  console.log(`\nFeatured Image (RAW):`);
  console.log(prop.featured_image);
  console.log(`\nImages Array (RAW):`);
  console.log(JSON.stringify(prop.images, null, 2));
});
