import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("\n=== Testing Email Configuration ===\n");

console.log("Environment variables:");
console.log("EMAIL_HOST:", process.env.EMAIL_HOST || "NOT SET");
console.log("EMAIL_PORT:", process.env.EMAIL_PORT || "NOT SET");
console.log("EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "***SET***" : "NOT SET");
console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "NOT SET");

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log("\n❌ Email not configured. Add these to .env:");
  console.log("EMAIL_HOST=smtp.gmail.com");
  console.log("EMAIL_PORT=587");
  console.log("EMAIL_SECURE=false");
  console.log("EMAIL_USER=your-email@gmail.com");
  console.log("EMAIL_PASS=your-app-password");
  console.log("EMAIL_FROM=Dubai Nest Hub <noreply@truenester.com>");
  process.exit(1);
}

console.log("\n=== Creating Email Transporter ===\n");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
});

console.log("Testing connection...\n");

try {
  await transporter.verify();
  console.log("✅ SMTP connection successful!\n");
  
  console.log("=== Sending Test Email ===\n");
  
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: "info@truenester.com, truenester4u@gmail.com",
    subject: "🧪 Test Email from Dubai Nest Hub",
    html: `
      <h2>📧 Test Email Notification</h2>
      <p>This is a test email from the notification system.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Test User:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">Direct Email Test</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Source:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">Manual Test Script</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Time:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date().toISOString()}</td></tr>
      </table>
      <p>If you received this email, the email notification system is working correctly!</p>
    `,
    text: `Test Email Notification

This is a test email from the notification system.

Test User: Direct Email Test
Source: Manual Test Script
Time: ${new Date().toISOString()}

If you received this email, the email notification system is working correctly!`,
  });
  
  console.log("✅ Email sent successfully!");
  console.log("\nMessage ID:", info.messageId);
  console.log("Recipients:", "info@truenester.com, truenester4u@gmail.com");
  console.log("\nCheck the inbox for both email addresses.");
  
} catch (error) {
  console.error("\n❌ Email test failed:");
  console.error(error.message);
  
  if (error.message.includes("Invalid login")) {
    console.log("\n💡 Troubleshooting:");
    console.log("1. Make sure 2-Step Verification is enabled in Google Account");
    console.log("2. Generate an App Password (not your regular password)");
    console.log("3. Use the 16-character app password in EMAIL_PASS");
    console.log("4. Remove any spaces from the app password");
  }
}
