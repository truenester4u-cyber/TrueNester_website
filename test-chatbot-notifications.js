/**
 * Test script for chatbot notification integration
 * This script sends a test chatbot lead to verify Slack and Email notifications work
 */

const API_URL = "http://localhost:4000/api/chatbot/leads";

const testPayload = {
  conversationId: crypto.randomUUID(),
  customerId: crypto.randomUUID(),
  customerName: "John Doe",
  customerPhone: "+971501234567",
  customerEmail: "john.doe@example.com",
  intent: "buy",
  budget: "AED 1.5M - 2M",
  propertyType: "Apartment",
  preferredArea: "Dubai Marina",
  leadScore: 85,
  leadQuality: "hot",
  tags: ["chatbot", "high-priority"],
  notes: "Interested in 2-bedroom apartments with sea view",
  leadScoreBreakdown: {
    intent: 30,
    engagement: 25,
    actions: 20,
    contactInfo: 10,
  },
  messages: [
    {
      id: crypto.randomUUID(),
      sender: "bot",
      messageText: "Hello! Welcome to Dubai Nest Hub. How can I help you today?",
      messageType: "text",
      timestamp: new Date().toISOString(),
      metadata: {},
    },
    {
      id: crypto.randomUUID(),
      sender: "user",
      messageText: "I'm looking to buy a 2-bedroom apartment in Dubai Marina",
      messageType: "text",
      timestamp: new Date(Date.now() + 5000).toISOString(),
      metadata: {},
    },
    {
      id: crypto.randomUUID(),
      sender: "bot",
      messageText: "Great! What's your budget range?",
      messageType: "text",
      timestamp: new Date(Date.now() + 10000).toISOString(),
      metadata: {},
    },
    {
      id: crypto.randomUUID(),
      sender: "user",
      messageText: "Between 1.5 to 2 million AED",
      messageType: "text",
      timestamp: new Date(Date.now() + 15000).toISOString(),
      metadata: {},
    },
  ],
};

async function testChatbotNotification() {
  console.log("🧪 Testing Chatbot Notification Integration");
  console.log("=" .repeat(60));
  console.log(`📍 API Endpoint: ${API_URL}`);
  console.log(`👤 Test Customer: ${testPayload.customerName}`);
  console.log(`📧 Email: ${testPayload.customerEmail}`);
  console.log(`📱 Phone: ${testPayload.customerPhone}`);
  console.log(`🎯 Intent: ${testPayload.intent}`);
  console.log(`💰 Budget: ${testPayload.budget}`);
  console.log(`⭐ Lead Score: ${testPayload.leadScore}/100 (${testPayload.leadQuality})`);
  console.log("=" .repeat(60));

  try {
    console.log("\n🚀 Sending test payload...");
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("\n✅ SUCCESS! Lead submitted successfully");
    console.log("📋 Conversation ID:", result.id);
    console.log("\n📬 NOTIFICATIONS:");
    console.log("   ✓ Slack notification should appear in your configured channel");
    console.log("   ✓ Email notification should be sent to: info@truenester.com, truenester4u@gmail.com");
    console.log("\n💡 Check your:");
    console.log("   1. Slack workspace for the notification");
    console.log("   2. Email inbox (info@truenester.com or truenester4u@gmail.com)");
    console.log("   3. Admin panel at http://localhost:8080/admin/conversations");
    console.log("\n" + "=".repeat(60));
    console.log("✨ Test completed successfully!");
    
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.log("\n🔍 Troubleshooting steps:");
    console.log("   1. Ensure backend API is running: cd truenester-chatbot-api && npm run dev");
    console.log("   2. Check backend .env has correct credentials:");
    console.log("      - SLACK_WEBHOOK_URL");
    console.log("      - EMAIL_HOST, EMAIL_USER, EMAIL_PASS");
    console.log("   3. Verify backend is listening on port 4000");
    console.log("   4. Check backend console logs for detailed errors");
  }
}

testChatbotNotification();
