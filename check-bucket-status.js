import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBucket() {
  console.log('Checking bucket "property-images"...');
  const { data, error } = await supabase.storage.getBucket('property-images');
  
  if (error) {
    console.error('❌ Error getting bucket:', error);
  } else {
    console.log('✅ Bucket data:', JSON.stringify(data, null, 2));
  }

  console.log('\nTesting public URL access for a sample filename (if any exists)...');
  const { data: files, error: listError } = await supabase.storage.from('property-images').list('', { limit: 1 });
  
  if (listError) {
    console.error('❌ Error listing files:', listError);
  } else if (files && files.length > 0) {
    const filename = files[0].name;
    console.log(`✅ Found file: ${filename}`);
    const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(filename);
    console.log(`Public URL: ${publicUrl}`);
    
    // In Node.js environment, we use global fetch (available in Node 18+)
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      console.log(`HTTP Status: ${response.status} ${response.statusText}`);
      if (response.status === 406) {
        console.log('⚠️ Status 406 detected - bucket or file might not be public or has unexpected content type.');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err.message);
    }
  } else {
    console.log('⚠️ No files found in bucket.');
  }
}

checkBucket();
