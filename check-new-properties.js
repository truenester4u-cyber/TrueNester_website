import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jwmbxpqpjxqclfcahwcf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo'
);

console.log('🔍 Checking latest properties...\n');

const { data: properties } = await supabase
  .from('properties')
  .select('id, title, images, featured_image, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

properties.forEach((prop, i) => {
  console.log(`\n${i + 1}. ${prop.title}`);
  console.log(`   Created: ${prop.created_at}`);
  console.log(`   Featured: ${prop.featured_image || 'None'}`);
  console.log(`   Images (${Array.isArray(prop.images) ? prop.images.length : 0}):`);
  
  if (Array.isArray(prop.images) && prop.images.length > 0) {
    prop.images.slice(0, 2).forEach((img, idx) => {
      console.log(`      ${idx + 1}. ${img}`);
    });
  }
});
