import fetch from 'node-fetch';

const testPayload = {
  customerName: "Test Customer",
  customerEmail: "test@example.com",
  customerPhone: "+971 50 123 4567",
  source: "contact_form",
  subject: "Test Notification",
  message: "This is a test message to verify email delivery is working.",
  department: "Sales"
};

async function testNotification() {
  console.log('🧪 Testing notification system...\n');
  
  try {
    const response = await fetch('http://localhost:4000/api/notifications/fallback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Notification sent via:', result.channels?.join(', ') || 'unknown channels');
      console.log('\n📧 Check these email addresses:');
      console.log('   - info@truenester.com');
      console.log('   - truenester4u@gmail.com');
    } else {
      console.error('❌ FAILED:', result.error);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n⚠️  Make sure the backend server is running:');
    console.log('   cd truenester-chatbot-api && npm run dev');
  }
}

testNotification();
