import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";

export interface NotificationPayload {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  intent?: string;
  budget?: string;
  propertyType?: string;
  area?: string;
  leadScore?: number;
  duration?: number;
  source: "chatbot" | "property_inquiry" | "contact_form" | "sla_warning" | "sla_breach" | "system";
  subject?: string;
  message?: string;
  department?: string;
  propertyTitle?: string;
  propertyUrl?: string;
}

export interface NotificationResult {
  success: boolean;
  channels: {
    slack?: { success: boolean; error?: string };
    telegram?: { success: boolean; error?: string };
    email?: { success: boolean; error?: string };
  };
}

class NotificationService {
  private telegramBot: TelegramBot | null = null;
  private emailTransporter: Transporter | null = null;
  private resend: Resend | null = null;
  private slackWebhookUrl: string | undefined;
  private telegramChatId: string | undefined;
  private frontendUrl: string;
  private useResend: boolean = false;

  constructor() {
    // Log all notification-related env vars at startup for debugging
    console.log("[NOTIFICATION-SERVICE] ========== INITIALIZATION ==========");
    console.log(`[NOTIFICATION-SERVICE] SLACK_WEBHOOK_URL: ${process.env.SLACK_WEBHOOK_URL ? "SET (" + process.env.SLACK_WEBHOOK_URL.substring(0, 40) + "...)" : "NOT SET"}`);
    console.log(`[NOTIFICATION-SERVICE] EMAIL_HOST: ${process.env.EMAIL_HOST || "NOT SET"}`);
    console.log(`[NOTIFICATION-SERVICE] EMAIL_USER: ${process.env.EMAIL_USER || "NOT SET"}`);
    console.log(`[NOTIFICATION-SERVICE] EMAIL_PASS: ${process.env.EMAIL_PASS ? "SET (hidden)" : "NOT SET"}`);
    console.log(`[NOTIFICATION-SERVICE] EMAIL_PORT: ${process.env.EMAIL_PORT || "NOT SET (default 587)"}`);
    console.log(`[NOTIFICATION-SERVICE] EMAIL_SECURE: ${process.env.EMAIL_SECURE || "NOT SET (default false)"}`);
    console.log(`[NOTIFICATION-SERVICE] EMAIL_FROM: ${process.env.EMAIL_FROM || "NOT SET"}`);
    console.log(`[NOTIFICATION-SERVICE] TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? "SET" : "NOT SET"}`);
    console.log(`[NOTIFICATION-SERVICE] TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID || "NOT SET"}`);
    console.log(`[NOTIFICATION-SERVICE] RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "SET" : "NOT SET"}`);
    console.log("[NOTIFICATION-SERVICE] ====================================");

    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      this.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
      this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
      console.log("[TELEGRAM] Telegram bot initialized successfully");
    } else {
      console.log("[TELEGRAM] Telegram not configured - missing BOT_TOKEN or CHAT_ID");
    }

    // Priority 1: Use Resend if API key is available (recommended for cloud providers)
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.useResend = true;
      console.log("[EMAIL] ✅ Resend email service initialized (recommended for cloud)");
    }
    // Priority 2: Fall back to SMTP if Resend not configured
    else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const cleanHost = process.env.EMAIL_HOST.trim().replace(/['"]/g, '');
      const cleanUser = process.env.EMAIL_USER.trim().replace(/['"]/g, '');
      const cleanPass = process.env.EMAIL_PASS.trim();
      
      this.emailTransporter = nodemailer.createTransport({
        host: cleanHost,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      });
      
      console.log("[EMAIL] ✅ SMTP email transporter initialized (fallback)");
      console.log(`[EMAIL] Config: Host=${cleanHost}, Port=${process.env.EMAIL_PORT || 587}, User=${cleanUser}`);
    } else {
      console.log("[EMAIL] ❌ Email not configured - set RESEND_API_KEY (recommended) or SMTP credentials");
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      channels: {},
    };

    console.log("[NOTIFICATION] Sending to all channels: Slack, Telegram, and Email");

    const slackResult = await this.sendSlackNotification(payload);
    result.channels.slack = slackResult;

    const telegramResult = await this.sendTelegramNotification(payload);
    result.channels.telegram = telegramResult;

    const emailResult = await this.sendEmailNotification(payload);
    result.channels.email = emailResult;

    result.success = slackResult.success || telegramResult.success || emailResult.success;

    const successfulChannels = [
      slackResult.success ? "Slack" : null,
      telegramResult.success ? "Telegram" : null,
      emailResult.success ? "Email" : null,
    ].filter(Boolean);

    console.log(`[NOTIFICATION] ✅ Sent via: ${successfulChannels.join(", ")}`);

    return result;
  }

  private async sendSlackNotification(
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.slackWebhookUrl) {
      return { success: false, error: "No Slack webhook URL configured" };
    }

    try {
      const message = this.buildSlackMessage(payload);
      
      const response = await fetch(this.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        console.log("[SLACK] Notification sent successfully");
        return { success: true };
      }

      const errorText = await response.text();
      console.error("[SLACK] Failed to send:", errorText);
      return { success: false, error: errorText };
    } catch (error: any) {
      console.error("[SLACK] Error:", error);
      return { success: false, error: error.message };
    }
  }

  private async sendTelegramNotification(
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.telegramBot || !this.telegramChatId) {
      return { success: false, error: "Telegram not configured" };
    }

    try {
      const message = this.buildTelegramMessage(payload);
      
      await this.telegramBot.sendMessage(this.telegramChatId, message, {
        parse_mode: "HTML",
        disable_web_page_preview: false,
      });

      console.log("[TELEGRAM] Notification sent successfully");
      return { success: true };
    } catch (error: any) {
      console.error("[TELEGRAM] Error:", error);
      return { success: false, error: error.message };
    }
  }

  private async sendEmailNotification(
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    // Use Resend if available (recommended for cloud providers like Render)
    if (this.useResend && this.resend) {
      return this.sendEmailViaResend(payload);
    }
    
    // Fall back to SMTP
    if (!this.emailTransporter) {
      console.error("[EMAIL] Cannot send - no email provider configured");
      return { success: false, error: "Email not configured - set RESEND_API_KEY or SMTP credentials" };
    }

    try {
      console.log(`[EMAIL] Attempting to send email via SMTP for ${payload.source}`);
      const { subject, html, text } = this.buildEmailMessage(payload);
      
      const info = await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: "info@truenester.com, truenester4u@gmail.com",
        subject,
        html,
        text,
      });

      console.log("[EMAIL] ✅ Email sent successfully via SMTP!");
      console.log(`[EMAIL] Message ID: ${info.messageId}`);
      return { success: true };
    } catch (error: any) {
      console.error("[EMAIL] ❌ Failed to send email via SMTP:", error.message);
      return { success: false, error: error.message };
    }
  }

  private async sendEmailViaResend(
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      return { success: false, error: "Resend not initialized" };
    }

    try {
      console.log(`[EMAIL] Attempting to send email via Resend for ${payload.source}`);
      const { subject, html, text } = this.buildEmailMessage(payload);
      
      // Resend requires a verified domain or use onboarding@resend.dev for testing
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      const toEmails = ["info@truenester.com", "truenester4u@gmail.com"];
      
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: toEmails,
        subject,
        html,
        text,
      });

      if (error) {
        console.error("[EMAIL] ❌ Resend error:", error);
        return { success: false, error: error.message };
      }

      console.log("[EMAIL] ✅ Email sent successfully via Resend!");
      console.log(`[EMAIL] Resend ID: ${data?.id}`);
      console.log(`[EMAIL] Recipients: ${toEmails.join(", ")}`);
      return { success: true };
    } catch (error: any) {
      console.error("[EMAIL] ❌ Failed to send email via Resend:", error.message);
      return { success: false, error: error.message };
    }
  }

  private buildSlackMessage(payload: NotificationPayload): any {
    const { source } = payload;
    const adminUrl = `${this.frontendUrl}/admin/conversations`;

    const baseMessage = {
      text: `🔔 New Lead: ${payload.customerName || "Unknown"}`,
    };

    if (source === "chatbot") {
      return {
        ...baseMessage,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🤖 New Chatbot Conversation",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Name:*\n${payload.customerName}` },
              { type: "mrkdwn", text: `*Intent:*\n${payload.intent || "N/A"}` },
              { type: "mrkdwn", text: `*Email:*\n${payload.customerEmail || "N/A"}` },
              { type: "mrkdwn", text: `*Phone:*\n${payload.customerPhone || "N/A"}` },
              { type: "mrkdwn", text: `*Budget:*\n${payload.budget || "N/A"}` },
              { type: "mrkdwn", text: `*Property Type:*\n${payload.propertyType || "N/A"}` },
              { type: "mrkdwn", text: `*Area:*\n${payload.area || "N/A"}` },
              { type: "mrkdwn", text: `*Lead Score:*\n${payload.leadScore || 0}/100` },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Duration:* ${payload.duration || 0} minutes`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "View in Admin Panel" },
                url: adminUrl,
                style: "primary",
              },
            ],
          },
        ],
      };
    }

    if (source === "contact_form") {
      return {
        ...baseMessage,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "📬 New Contact Form Message",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Name:*\n${payload.customerName}` },
              { type: "mrkdwn", text: `*Department:*\n${payload.department || "N/A"}` },
              { type: "mrkdwn", text: `*Email:*\n${payload.customerEmail || "N/A"}` },
              { type: "mrkdwn", text: `*Phone:*\n${payload.customerPhone || "N/A"}` },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Subject:* ${payload.subject}\n\n*Message:*\n${payload.message}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "View in Admin Panel" },
                url: adminUrl,
                style: "primary",
              },
            ],
          },
        ],
      };
    }

    if (source === "property_inquiry") {
      return {
        ...baseMessage,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🏠 New Property Inquiry",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Name:*\n${payload.customerName}` },
              { type: "mrkdwn", text: `*Property:*\n${payload.propertyTitle || "N/A"}` },
              { type: "mrkdwn", text: `*Email:*\n${payload.customerEmail || "N/A"}` },
              { type: "mrkdwn", text: `*Phone:*\n${payload.customerPhone || "N/A"}` },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Message:*\n${payload.message || "No message provided"}`,
            },
          },
          {
            type: "actions",
            elements: [
              ...(payload.propertyUrl
                ? [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "View Property" },
                      url: payload.propertyUrl,
                    },
                  ]
                : []),
              {
                type: "button",
                text: { type: "plain_text", text: "View in Admin" },
                url: adminUrl,
                style: "primary",
              },
            ],
          },
        ],
      };
    }

    return baseMessage;
  }

  private buildTelegramMessage(payload: NotificationPayload): string {
    const { source } = payload;
    const adminUrl = `${this.frontendUrl}/admin/conversations`;

    if (source === "chatbot") {
      return `
🤖 <b>New Chatbot Conversation</b>

<b>Name:</b> ${payload.customerName}
<b>Intent:</b> ${payload.intent || "N/A"}
<b>Email:</b> ${payload.customerEmail || "N/A"}
<b>Phone:</b> ${payload.customerPhone || "N/A"}
<b>Budget:</b> ${payload.budget || "N/A"}
<b>Property Type:</b> ${payload.propertyType || "N/A"}
<b>Area:</b> ${payload.area || "N/A"}
<b>Lead Score:</b> ${payload.leadScore || 0}/100
<b>Duration:</b> ${payload.duration || 0} minutes

<a href="${adminUrl}">View in Admin Panel</a>
`.trim();
    }

    if (source === "contact_form") {
      return `
📬 <b>New Contact Form Message</b>

<b>Name:</b> ${payload.customerName}
<b>Department:</b> ${payload.department || "N/A"}
<b>Email:</b> ${payload.customerEmail || "N/A"}
<b>Phone:</b> ${payload.customerPhone || "N/A"}

<b>Subject:</b> ${payload.subject}
<b>Message:</b>
${payload.message}

<a href="${adminUrl}">View in Admin Panel</a>
`.trim();
    }

    if (source === "property_inquiry") {
      return `
🏠 <b>New Property Inquiry</b>

<b>Name:</b> ${payload.customerName}
<b>Property:</b> ${payload.propertyTitle || "N/A"}
<b>Email:</b> ${payload.customerEmail || "N/A"}
<b>Phone:</b> ${payload.customerPhone || "N/A"}

<b>Message:</b>
${payload.message || "No message provided"}

${payload.propertyUrl ? `<a href="${payload.propertyUrl}">View Property</a> | ` : ""}<a href="${adminUrl}">View in Admin</a>
`.trim();
    }

    return `🔔 New Lead: ${payload.customerName}`;
  }

  private buildEmailMessage(payload: NotificationPayload): {
    subject: string;
    html: string;
    text: string;
  } {
    const { source } = payload;
    const adminUrl = `${this.frontendUrl}/admin/conversations`;

    if (source === "chatbot") {
      return {
        subject: `🤖 New Chatbot Lead: ${payload.customerName}`,
        html: `
          <h2>🤖 New Chatbot Conversation</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Intent:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.intent || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerEmail || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerPhone || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Budget:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.budget || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Property Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.propertyType || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Area:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.area || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Lead Score:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.leadScore || 0}/100</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Duration:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.duration || 0} minutes</td></tr>
          </table>
          <p><a href="${adminUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
        `,
        text: `New Chatbot Conversation\n\nName: ${payload.customerName}\nIntent: ${payload.intent || "N/A"}\nEmail: ${payload.customerEmail || "N/A"}\nPhone: ${payload.customerPhone || "N/A"}\nBudget: ${payload.budget || "N/A"}\nProperty Type: ${payload.propertyType || "N/A"}\nArea: ${payload.area || "N/A"}\nLead Score: ${payload.leadScore || 0}/100\nDuration: ${payload.duration || 0} minutes\n\nView in Admin Panel: ${adminUrl}`,
      };
    }

    if (source === "contact_form") {
      return {
        subject: `📬 New Contact Form: ${payload.subject}`,
        html: `
          <h2>📬 New Contact Form Message</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Department:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.department || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerEmail || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerPhone || "N/A"}</td></tr>
          </table>
          <h3>Subject: ${payload.subject}</h3>
          <p style="white-space: pre-wrap; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #007bff;">${payload.message}</p>
          <p><a href="${adminUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
        `,
        text: `New Contact Form Message\n\nName: ${payload.customerName}\nDepartment: ${payload.department || "N/A"}\nEmail: ${payload.customerEmail || "N/A"}\nPhone: ${payload.customerPhone || "N/A"}\n\nSubject: ${payload.subject}\n\nMessage:\n${payload.message}\n\nView in Admin Panel: ${adminUrl}`,
      };
    }

    if (source === "property_inquiry") {
      return {
        subject: `🏠 New Property Inquiry: ${payload.propertyTitle}`,
        html: `
          <h2>🏠 New Property Inquiry</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Property:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.propertyTitle || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerEmail || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payload.customerPhone || "N/A"}</td></tr>
          </table>
          <h3>Message:</h3>
          <p style="white-space: pre-wrap; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #007bff;">${payload.message || "No message provided"}</p>
          <p>
            ${payload.propertyUrl ? `<a href="${payload.propertyUrl}" style="display: inline-block; margin-top: 20px; margin-right: 10px; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">View Property</a>` : ""}
            <a href="${adminUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
          </p>
        `,
        text: `New Property Inquiry\n\nName: ${payload.customerName}\nProperty: ${payload.propertyTitle || "N/A"}\nEmail: ${payload.customerEmail || "N/A"}\nPhone: ${payload.customerPhone || "N/A"}\n\nMessage:\n${payload.message || "No message provided"}\n\n${payload.propertyUrl ? `View Property: ${payload.propertyUrl}\n` : ""}View in Admin Panel: ${adminUrl}`,
      };
    }

    return {
      subject: `New Lead: ${payload.customerName}`,
      html: `<p>New lead received from ${payload.customerName}</p>`,
      text: `New lead received from ${payload.customerName}`,
    };
  }
}

export const notificationService = new NotificationService();
