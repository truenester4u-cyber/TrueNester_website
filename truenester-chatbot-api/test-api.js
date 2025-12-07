// Quick test script to verify the API is working
// Run: node test-api.js

const testConversation = {
  customerName: "Test User",
  customerPhone: "+971501234567",
  customerEmail: "test@example.com",
  intent: "buy",
  budget: "1M-2M AED",
  preferredArea: "Dubai Marina",
  leadScore: 75,
  leadQuality: "warm",
  tags: ["buy", "dubai-marina"],
  notes: "Test conversation from API test script",
  messages: [
    {
      id: crypto.randomUUID(),
      sender: "bot",
      messageText: "Hello! Welcome to Dubai Nest Hub. How can I help you today?",
      messageType: "text",
      timestamp: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      sender: "customer",
      messageText: "I'm looking to buy a property in Dubai Marina",
      messageType: "text",
      timestamp: new Date().toISOString()
    }
  ]
};

async function testAPI() {
  try {
    console.log('Testing chatbot lead endpoint...');
    const response = await fetch('http://localhost:4000/api/chatbot/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConversation)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Success! Conversation saved with ID:', result.id);
    console.log('Full response:', JSON.stringify(result, null, 2));
    console.log('\nNow check:');
    console.log('1. Supabase Table Editor → conversations table');
    console.log('2. Admin panel: http://localhost:5173/admin/conversations');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Is the API running? (npm run dev in truenester-chatbot-api)');
    console.log('2. Did you run the database migration in Supabase?');
    console.log('3. Check the API terminal for errors');
  }
}

testAPI();
