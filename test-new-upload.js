import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testNewUploads() {
  console.log('\n🔍 Testing recently uploaded images...\n');

  // Test the specific files from the console
  const testFiles = [
    '0.9210053290134576.webp',
    '0.28714676638322279.webp'
  ];

  for (const filename of testFiles) {
    console.log(`\n📁 Testing: ${filename}`);
    
    // Generate public URL
    const { data } = supabase.storage.from('property-images').getPublicUrl(filename);
    console.log(`   Generated URL: ${data.publicUrl}`);
    
    // Test if accessible
    try {
      const response = await fetch(data.publicUrl);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ ACCESSIBLE`);
      } else {
        console.log(`   ❌ NOT ACCESSIBLE - Status ${response.status}`);
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ FETCH ERROR: ${error.message}`);
    }
  }

  // Check bucket info
  console.log('\n📋 Checking bucket configuration...');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('❌ Error listing buckets:', error);
  } else {
    const propertyBucket = buckets.find(b => b.id === 'property-images');
    if (propertyBucket) {
      console.log('✅ Bucket found:');
      console.log(`   Name: ${propertyBucket.name}`);
      console.log(`   Public: ${propertyBucket.public}`);
      console.log(`   Created: ${propertyBucket.created_at}`);
    } else {
      console.log('❌ property-images bucket NOT found!');
    }
  }
}

testNewUploads();
