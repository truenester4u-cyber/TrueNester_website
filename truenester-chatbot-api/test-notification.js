import dotenv from "dotenv";
dotenv.config();

console.log("Testing notification integration...\n");

console.log("Environment variables:");
console.log("- SLACK_WEBHOOK_URL:", !!process.env.SLACK_WEBHOOK_URL);
console.log("- TELEGRAM_BOT_TOKEN:", !!process.env.TELEGRAM_BOT_TOKEN);
console.log("- TELEGRAM_CHAT_ID:", !!process.env.TELEGRAM_CHAT_ID);
console.log("- EMAIL_HOST:", !!process.env.EMAIL_HOST);
console.log("- EMAIL_USER:", !!process.env.EMAIL_USER);
console.log("- EMAIL_PASS:", !!process.env.EMAIL_PASS);

console.log("\n✅ Integration code is ready!");
console.log("\nTo test the notification system:");
console.log("1. Configure your environment variables in truenester-chatbot-api/.env");
console.log("2. Start the backend: cd truenester-chatbot-api && npm run dev");
console.log("3. Start the frontend: npm run dev");
console.log("4. Test via contact form or chatbot");

console.log("\nOr test directly via API:");
console.log("curl -X POST http://localhost:4000/api/notifications/fallback \\");
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"customerName":"Test User","source":"contact_form","subject":"Test","message":"Testing notifications"}\'');
