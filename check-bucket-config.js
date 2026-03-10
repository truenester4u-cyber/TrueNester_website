import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBucketConfig() {
  console.log('\n🔍 Checking bucket configuration...\n');

  // Test getting a public URL for a known file
  const testFilename = '0.7201752007756113.png';
  const { data } = supabase.storage.from('property-images').getPublicUrl(testFilename);
  
  console.log('📁 Test filename:', testFilename);
  console.log('🔗 Generated public URL:', data.publicUrl);
  
  // Test if the URL is accessible
  try {
    const response = await fetch(data.publicUrl);
    console.log('\n✅ Public URL Status:', response.status, response.statusText);
    console.log('✅ Content-Type:', response.headers.get('content-type'));
    
    if (response.ok) {
      console.log('\n✅ BUCKET IS PUBLIC - Images should work!');
    } else {
      console.log('\n❌ BUCKET MAY NOT BE PUBLIC - Check permissions');
      console.log('   Go to Supabase Dashboard → Storage → property-images');
      console.log('   Make sure "Public bucket" is enabled');
    }
  } catch (error) {
    console.error('\n❌ Error fetching public URL:', error.message);
  }
  
  // List a few files to verify bucket access
  console.log('\n📋 Listing files in bucket...');
  const { data: files, error } = await supabase.storage
    .from('property-images')
    .list('', { limit: 5 });
  
  if (error) {
    console.error('❌ Error listing files:', error.message);
  } else {
    console.log(`✅ Found ${files.length} files (showing first 5):`);
    files.forEach(file => {
      console.log(`   - ${file.name}`);
    });
  }
}

checkBucketConfig();
