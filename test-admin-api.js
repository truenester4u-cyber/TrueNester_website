#!/usr/bin/env node

// Test script to verify admin API authentication
const ADMIN_API_KEY = "TrueNester2025_AdminAPI_SecureKey_Dubai_Development_Production_v1";
const API_BASE = "https://truenester-api.onrender.com/api";

async function testEndpoints() {
  console.log("🔍 Testing admin API endpoints...\n");
  
  // Test 1: Admin conversations (should work with API key)
  console.log("1️⃣ Testing admin conversations endpoint:");
  try {
    const response = await fetch(`${API_BASE}/admin/conversations?page=1&limit=5`, {
      headers: {
        "Content-Type": "application/json",
        "x-admin-api-key": ADMIN_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS: Got ${data.total || 0} conversations`);
    } else {
      console.log(`❌ FAILED: ${response.status} - ${await response.text()}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log();
  
  // Test 2: Admin conversations without API key (should fail)
  console.log("2️⃣ Testing admin endpoint without API key (should fail):");
  try {
    const response = await fetch(`${API_BASE}/admin/conversations?page=1&limit=1`, {
      headers: { "Content-Type": "application/json" }
    });
    
    if (response.status === 401) {
      console.log("✅ EXPECTED: 401 Unauthorized (correct behavior)");
    } else {
      console.log(`❌ UNEXPECTED: ${response.status} - Expected 401`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log();
  
  // Test 3: Chatbot endpoint (should work without API key)
  console.log("3️⃣ Testing chatbot endpoint (no auth required):");
  try {
    const testPayload = {
      customerName: "Test User",
      customerPhone: "+971501234567",
      messages: [{
        id: "test-1", 
        sender: "user", 
        messageText: "Test message", 
        timestamp: new Date().toISOString()
      }]
    };
    
    const response = await fetch(`${API_BASE}/chatbot/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS: Chatbot lead created with ID: ${data.id || 'unknown'}`);
    } else {
      console.log(`❌ FAILED: ${response.status} - ${await response.text()}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log("\n🎯 Test Summary:");
  console.log("- If admin endpoints work WITH API key: ✅ Backend is fixed");
  console.log("- If admin endpoints fail WITHOUT API key: ✅ Security is working"); 
  console.log("- If chatbot endpoint works without auth: ✅ Public API is working");
}

testEndpoints().catch(console.error);