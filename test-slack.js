// Test script to verify Slack webhook is working
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: './truenester-chatbot-api/.env' });

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

console.log('Testing Slack webhook...');
console.log('Webhook URL:', SLACK_WEBHOOK_URL ? `${SLACK_WEBHOOK_URL.substring(0, 50)}...` : 'NOT CONFIGURED');

if (!SLACK_WEBHOOK_URL) {
  console.error('❌ SLACK_WEBHOOK_URL not configured');
  process.exit(1);
}

const testMessage = {
  text: "🧪 Test message from TRUE NESTER chatbot system",
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🧪 Slack Integration Test",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*This is a test message to verify Slack integration is working.*\n\nIf you see this message, the webhook is configured correctly!"
      }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Status:*\n✅ Connected" },
        { type: "mrkdwn", text: "*Timestamp:*\n" + new Date().toISOString() }
      ]
    }
  ]
};

try {
  console.log('Sending test message...');
  
  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testMessage)
  });

  if (response.ok) {
    console.log('✅ Test message sent successfully!');
    console.log('Status:', response.status);
  } else {
    const errorText = await response.text();
    console.error('❌ Failed to send test message');
    console.error('Status:', response.status);
    console.error('Response:', errorText);
  }
} catch (error) {
  console.error('❌ Error sending test message:', error.message);
}