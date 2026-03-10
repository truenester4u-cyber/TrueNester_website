// Verify the featured image status
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyProperty() {
  console.log('🔍 Verifying property...');

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .ilike('title', '%BHK Apartment in Burj Khalifa%')
    .limit(1);

  if (error || !properties || properties.length === 0) {
    console.log('❌ Could not fetch property');
    return;
  }

  const property = properties[0];
  console.log('Property:', property.title);
  console.log('Current Featured Image:', property.featured_image);
  console.log('First Gallery Image:', property.images?.[0]);
  
  if (property.featured_image === property.images?.[0]) {
      console.log('✅ Featured image MATCHES the first gallery image.');
  } else {
      console.log('❌ Featured image DOES NOT match. It is likely still the old one.');
  }
}

verifyProperty();
