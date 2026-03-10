/**
 * Create property-images storage bucket in Supabase
 * Run: node create-bucket.js
 */

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: You need the SERVICE ROLE key for this, not the anon key
// Get it from: Supabase Dashboard → Settings → API → service_role key
const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  console.log('\n🔧 Creating property-images bucket...\n');

  try {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('property-images', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Bucket already exists, updating to make it public...');
        
        // Update bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket('property-images', {
          public: true
        });
        
        if (updateError) {
          console.error('❌ Error updating bucket:', updateError.message);
        } else {
          console.log('✅ Bucket updated to be public!');
        }
      } else {
        console.error('❌ Error creating bucket:', error.message);
        console.log('\n⚠️  You need to use the SERVICE_ROLE key, not the anon key!');
        console.log('   Get it from: Supabase Dashboard → Settings → API → service_role');
        console.log('   Then run: set SUPABASE_SERVICE_ROLE_KEY=your_key_here && node create-bucket.js');
        return;
      }
    } else {
      console.log('✅ Bucket created successfully!');
      console.log('   - Name:', data.name);
      console.log('   - Public:', true);
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Run CREATE_STORAGE_BUCKET.sql in Supabase SQL Editor to set up RLS policies');
    console.log('   2. Re-upload your property images through the admin panel');
    console.log('   3. Run: node check-storage-access.js to verify\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createBucket();
