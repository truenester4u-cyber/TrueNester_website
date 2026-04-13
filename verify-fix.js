import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://jwmbxpqpjxqclfcahwcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo';

// Mocking the "fixed" client (no global content-type header)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyFix() {
  console.log('🚀 Verifying fix with a fresh upload...');
  
  const testFileName = `fix_verification_${Date.now()}.png`;
  // Create a small 1x1 transparent PNG buffer
  const testFileBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789ccb6060600000000500010d652db40000000049454e44ae426082', 'hex');

  console.log(`Uploading ${testFileName}...`);
  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(testFileName, testFileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('❌ Upload failed:', error);
    return;
  }

  console.log('✅ Upload successful. Fetching file content back to verify...');
  
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from('property-images')
    .download(testFileName);

  if (downloadError) {
    console.error('❌ Download failed:', downloadError);
    return;
  }

  const arrayBuffer = await downloadData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentStart = buffer.toString('utf8', 0, 100);

  if (contentStart.includes('WebKitFormBoundary')) {
    console.error('❌ CORRUPTION DETECTED! File still contains multipart headers.');
    console.log('Content start:', contentStart);
  } else {
    console.log('✨ SUCCESS! File content is clean binary (no multipart headers).');
    console.log('First 8 bytes (hex):', buffer.toString('hex', 0, 8));
  }

  // Cleanup
  await supabase.storage.from('property-images').remove([testFileName]);
}

verifyFix();
