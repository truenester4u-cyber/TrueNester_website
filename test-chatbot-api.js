// Simple test to check chatbot API endpoint
const testChatbotAPI = async () => {
  const API_BASE = 'http://localhost:4000';
  
  console.log('🧪 Testing Chatbot API Integration');
  console.log('API Base:', API_BASE);
  
  // Test 1: Health check
  try {
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check passed:', health);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return;
  }
  
  // Test 2: Chatbot leads endpoint
  try {
    console.log('\n2️⃣ Testing chatbot leads endpoint...');
    
    const testPayload = {
      conversationId: crypto.randomUUID(),
      customerId: crypto.randomUUID(),
      customerName: "Test User",
      customerPhone: "+971501234567",
      customerEmail: "test@example.com",
      intent: "buy",
      budget: "AED 1-2M",
      propertyType: "apartment",
      preferredArea: "Downtown Dubai",
      leadScore: 75,
      leadQuality: "warm",
      tags: ["test", "chatbot"],
      messages: [
        {
          id: crypto.randomUUID(),
          sender: "user",
          messageText: "Hello, I'm interested in buying an apartment",
          messageType: "text",
          timestamp: new Date().toISOString(),
          metadata: {}
        },
        {
          id: crypto.randomUUID(),
          sender: "bot",
          messageText: "Great! I can help you find the perfect property.",
          messageType: "text",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ]
    };
    
    const leadsResponse = await fetch(`${API_BASE}/api/chatbot/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    if (leadsResponse.ok) {
      const result = await leadsResponse.json();
      console.log('✅ Chatbot leads test passed. Conversation ID:', result.id);
      console.log('📧 Check Slack for notification!');
    } else {
      const errorText = await leadsResponse.text();
      console.log('❌ Chatbot leads test failed:', leadsResponse.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ Chatbot leads test error:', error.message);
  }
};

// Run the test
testChatbotAPI();