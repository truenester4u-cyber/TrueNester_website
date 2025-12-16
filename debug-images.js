/**
 * Test script to debug image loading issues
 * Run this in browser console on the admin page
 */

// Test function to check image accessibility
async function testImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`✅ Image accessible: ${url} - Status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`❌ Image failed: ${url} - Error: ${error.message}`);
    return false;
  }
}

// Test both public and signed URL approaches
async function debugImageLoading() {
  console.log('🔍 Starting image debug test...');
  
  // Test a sample image path from your storage
  const testImagePath = 'sell-properties/sample.jpg'; // Replace with actual image path
  
  // 1. Test public URL
  const { data: publicData } = supabase.storage
    .from('property-images')
    .getPublicUrl(testImagePath);
    
  console.log(`🌐 Public URL: ${publicData.publicUrl}`);
  await testImageUrl(publicData.publicUrl);
  
  // 2. Test signed URL
  try {
    const { data: signedData, error } = await supabase.storage
      .from('property-images')
      .createSignedUrl(testImagePath, 60 * 60); // 1 hour
      
    if (error) {
      console.error('❌ Signed URL error:', error);
    } else {
      console.log(`🔐 Signed URL: ${signedData.signedUrl}`);
      await testImageUrl(signedData.signedUrl);
    }
  } catch (error) {
    console.error('❌ Signed URL generation failed:', error);
  }
  
  // 3. List files in storage to see what's available
  try {
    const { data: files, error } = await supabase.storage
      .from('property-images')
      .list('sell-properties', { limit: 10 });
      
    if (error) {
      console.error('❌ Storage listing error:', error);
    } else {
      console.log('📁 Available files in sell-properties folder:', files);
    }
  } catch (error) {
    console.error('❌ Storage listing failed:', error);
  }
}

// Run the debug test
debugImageLoading();