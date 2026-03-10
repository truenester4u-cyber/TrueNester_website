import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testImageUrls() {
  console.log('\n🔍 Testing image URLs...\n');

  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, title, images, featured_image')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  for (const prop of properties) {
    console.log(`\n📋 Property: ${prop.title}`);
    console.log(`   ID: ${prop.id}`);
    
    if (Array.isArray(prop.images) && prop.images.length > 0) {
      console.log(`   Images (${prop.images.length}):`);
      prop.images.forEach((img, i) => {
        console.log(`     ${i + 1}. ${img}`);
        
        if (typeof img === 'string' && img.includes('?token=')) {
          console.log(`        ⚠️ SIGNED URL (will expire!)`);
        } else if (typeof img === 'string' && img.includes('supabase.co')) {
          console.log(`        ✅ Full URL`);
        } else {
          console.log(`        📁 Filename only`);
        }
      });
    }
    
    if (prop.featured_image) {
      console.log(`   Featured: ${prop.featured_image}`);
    }
  }
}

testImageUrls();
