// Test RLS and image access - run this in browser console
async function testImageAccess() {
  console.log('🔍 Testing image access with current RLS settings...');
  
  try {
    // Test storage listing
    const { data: files, error: listError } = await supabase.storage
      .from('property-images')
      .list('sell-properties', { limit: 3 });
      
    if (listError) {
      console.error('❌ Storage listing failed (RLS may be blocking):', listError);
      return;
    }
    
    console.log('✅ Storage listing successful:', files?.length, 'files found');
    
    if (files && files.length > 0) {
      const testFile = files[0];
      console.log('📋 Testing with file:', testFile.name);
      
      // Test public URL access
      const { data: publicData } = supabase.storage
        .from('property-images')
        .getPublicUrl(`sell-properties/${testFile.name}`);
        
      console.log('🌐 Public URL:', publicData.publicUrl);
      
      // Test signed URL access
      const { data: signedData, error: signedError } = await supabase.storage
        .from('property-images')
        .createSignedUrl(`sell-properties/${testFile.name}`, 3600);
        
      if (signedError) {
        console.error('❌ Signed URL failed (RLS restriction):', signedError);
      } else {
        console.log('✅ Signed URL successful:', signedData.signedUrl);
        
        // Test if the URL actually works
        try {
          const response = await fetch(signedData.signedUrl, { method: 'HEAD' });
          console.log('📡 URL accessibility:', response.ok ? 'SUCCESS' : `FAILED (${response.status})`);
        } catch (fetchError) {
          console.error('❌ URL fetch failed:', fetchError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Auto-run if supabase is available
if (typeof supabase !== 'undefined') {
  testImageAccess();
} else {
  console.log('⚠️  Run this in browser console on the admin page where supabase is loaded');
}