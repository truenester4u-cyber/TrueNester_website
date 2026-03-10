// Check the specific property from the URL in Image 2
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProperty() {
  console.log('STARTING CHECK...');
  
  try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .ilike('title', '%BHK Apartment in Burj Khalifa%')
        .limit(1);

      if (error) {
        console.error('ERROR fetching:', error);
        return;
      }

      if (!properties || properties.length === 0) {
        console.log('NO PROPERTY FOUND');
        return;
      }

      const property = properties[0];
      
      console.log('PROPERTY FOUND:', property.title);
      console.log('FEATURED_IMAGE:', property.featured_image);
      console.log('IMAGES ARRAY:', JSON.stringify(property.images));
      
  } catch (err) {
      console.error('EXCEPTION:', err);
  }
}

checkProperty();
