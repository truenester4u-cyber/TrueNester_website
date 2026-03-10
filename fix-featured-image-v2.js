import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixPropertyImage() {
  console.log('🔄 Fetching property...');
  
  // 1. Get the property
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .ilike('title', '%BHK Apartment in Burj Khalifa%')
    .limit(1);

  if (error || !properties || properties.length === 0) {
    console.error('❌ Error fetching property:', error);
    return;
  }

  const property = properties[0];
  console.log(`\nFound property: ${property.title}`);
  console.log(`Current featured_image: ${property.featured_image}`);
  console.log(`Images array:`, property.images);

  // 2. Identify the correct image (first one in the images array)
  if (!property.images || property.images.length === 0) {
    console.error('❌ No images available in the array to set as featured.');
    return;
  }

  const correctImage = property.images[0];
  console.log(`\n🎯 Selecting first image as new featured_image: ${correctImage}`);

  // 3. Update the property
  const { data: updatedData, error: updateError } = await supabase
    .from('properties')
    .update({ featured_image: correctImage })
    .eq('id', property.id)
    .select();

  if (updateError) {
    console.error('❌ Update failed:', updateError);
  } else {
    console.log('✅ Update successful!');
    if (updatedData && updatedData.length > 0) {
        console.log('New featured_image:', updatedData[0].featured_image);
    }
  }
}

fixPropertyImage();
