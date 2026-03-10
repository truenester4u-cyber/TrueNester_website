/**
 * Diagnostic Script - Check Supabase Storage Access
 * Run: node check-storage-access.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStorageAccess() {
  console.log('\n🔍 Checking Supabase Storage Access...\n');

  try {
    // 1. Check if bucket exists
    console.log('1️⃣ Checking if property-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    const bucket = buckets.find(b => b.id === 'property-images');
    
    if (!bucket) {
      console.error('❌ property-images bucket does NOT exist');
      console.log('\n📝 Solution: Create the bucket in Supabase Dashboard → Storage');
      return;
    }

    console.log('✅ Bucket exists');
    console.log(`   - Public: ${bucket.public ? '✅ YES' : '❌ NO (THIS IS THE PROBLEM!)'}`);
    console.log(`   - ID: ${bucket.id}`);
    console.log(`   - Created: ${bucket.created_at}`);

    if (!bucket.public) {
      console.log('\n⚠️  BUCKET IS NOT PUBLIC - Images will not load!');
      console.log('\n📝 To fix:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Run the SQL from: supabase/migrations/20251222000000_make_property_images_bucket_public.sql');
      console.log('   3. OR manually toggle "Public bucket" in Storage settings');
    }

    // 2. List files in bucket
    console.log('\n2️⃣ Checking files in property-images bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('property-images')
      .list('', { limit: 10 });

    if (filesError) {
      console.error('❌ Error listing files:', filesError.message);
    } else {
      console.log(`✅ Found ${files.length} files`);
      
      if (files.length > 0) {
        console.log('\n📁 Sample files:');
        files.slice(0, 5).forEach((file, i) => {
          console.log(`   ${i + 1}. ${file.name}`);
          
          // Test public URL
          const { data: urlData } = supabase.storage
            .from('property-images')
            .getPublicUrl(file.name);
          
          console.log(`      URL: ${urlData.publicUrl}`);
        });
      } else {
        console.log('   ℹ️  No files uploaded yet');
      }
    }

    // 3. Test a sample property
    console.log('\n3️⃣ Checking sample property images...');
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, images, featured_image')
      .limit(3);

    if (propertiesError) {
      console.error('❌ Error fetching properties:', propertiesError.message);
    } else {
      console.log(`✅ Found ${properties.length} properties`);
      
      properties.forEach((prop, i) => {
        console.log(`\n   Property ${i + 1}: ${prop.title}`);
        console.log(`   - ID: ${prop.id}`);
        console.log(`   - Featured: ${prop.featured_image || 'None'}`);
        console.log(`   - Images: ${Array.isArray(prop.images) ? prop.images.length : 0}`);
        
        if (prop.featured_image) {
          const { data } = supabase.storage
            .from('property-images')
            .getPublicUrl(prop.featured_image);
          console.log(`   - Public URL: ${data.publicUrl}`);
        }
      });
    }

    console.log('\n✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkStorageAccess();
