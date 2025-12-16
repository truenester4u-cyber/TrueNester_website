// Test the image loading functionality
import { supabase } from './src/integrations/supabase/client.js';

async function testImageLoading() {
  console.log('🔍 Testing Supabase connection and image loading...');
  
  try {
    // Test 1: Check Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('properties')
      .select('id, title, featured_image')
      .limit(3);
      
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('📋 Sample properties:', testData);
    
    // Test 2: Check storage access
    const { data: storageData, error: storageError } = await supabase.storage
      .from('property-images')
      .list('', { limit: 10 });
      
    if (storageError) {
      console.error('❌ Storage access failed:', storageError);
    } else {
      console.log('✅ Storage access successful');
      console.log('📁 Available files:', storageData.map(f => f.name));
    }
    
    // Test 3: Try to create signed URL for a sample image
    if (testData && testData.length > 0) {
      const sampleImage = testData[0].featured_image;
      if (sampleImage) {
        console.log(`🖼️ Testing signed URL for: ${sampleImage}`);
        
        const { data: signedData, error: signedError } = await supabase.storage
          .from('property-images')
          .createSignedUrl(sampleImage, 3600);
          
        if (signedError) {
          console.error('❌ Signed URL failed:', signedError);
        } else {
          console.log('✅ Signed URL created:', signedData.signedUrl);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
  }
}

// Run the test
testImageLoading();