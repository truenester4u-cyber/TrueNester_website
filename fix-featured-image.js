// Fix the featured image for the Burj Khalifa property
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixFeaturedImage() {
  console.log('🛠️ Fixing featured image for "1 BHK Apartment in Burj Khalifa"...');

  // 1. Get the property
  const { data: properties, error: fetchError } = await supabase
    .from('properties')
    .select('*')
    .ilike('title', '%BHK Apartment in Burj Khalifa%')
    .limit(1);

  if (fetchError || !properties || properties.length === 0) {
    console.error('❌ Could not find property:', fetchError);
    return;
  }

  const property = properties[0];
  console.log(`Found property: ${property.title}`);
  console.log(`Current Featured: ${property.featured_image}`);
  console.log(`Images Array: ${JSON.stringify(property.images)}`);

  // 2. Check if we have images
  if (!property.images || property.images.length === 0) {
    console.error('❌ No images in the images array to promote to featured.');
    return;
  }

  // 3. Update featured_image to the first image in the array
  const newFeatured = property.images[0];
  console.log(`\n🔄 Updating featured_image to: ${newFeatured}`);

  const { data: updated, error: updateError } = await supabase
    .from('properties')
    .update({ featured_image: newFeatured })
    .eq('id', property.id)
    .select();

  if (updateError) {
    console.error('❌ Update failed:', updateError);
  } else {
    console.log('✅ Success! Featured image updated.');
    console.log('New Featured:', updated[0].featured_image);
  }
}

fixFeaturedImage().catch(console.error);
