async function testUrlAccess() {
  const testUrls = [
    'https://jwmbxpqpjxqclfcahwcf.supabase.co/storage/v1/object/public/property-images/0.7201752007756113.png',
    'https://jwmbxpqpjxqclfcahwcf.supabase.co/storage/v1/object/public/property-images/0.880696332490682.jpeg'
  ];

  console.log('🔍 Testing URL accessibility...\n');

  for (const url of testUrls) {
    try {
      const response = await fetch(url);
      console.log(`${url}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   ${response.ok ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE'}\n`);
    } catch (error) {
      console.log(`${url}`);
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
  }
}

testUrlAccess();
