import "express-async-errors";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Parser as Json2CsvParser } from "json2csv";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { ParsedQs } from "qs";

type QueryValue = string | ParsedQs | (string | ParsedQs)[];
import {
  type ConversationDTO,
  type ConversationFilters,
  type AssignmentPayload,
  type FollowUpPayload,
  type ChatMessageDTO,
  type ConversationAnalyticsResponse,
  type LeadQuality,
} from "./types";
import { notificationService, type NotificationPayload } from "./services/notification-service";
import { logger, requestIdMiddleware, generateRequestId } from "./lib/logger";
import { leadEventEmitter } from "./lib/event-emitter";
import { rateLimiters } from "./lib/rate-limiter";
import { integrationManager, featureFlags } from "./lib/integrations";
import { notificationWorker } from "./workers/notification-worker";

dotenv.config();

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const PORT = Number(process.env.PORT ?? 4000);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const app = express();

// Allow multiple origins including localhost and production
const allowedOrigins = [
  // Localhost development
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "http://localhost:8084",
  "http://localhost:5173",
  // Production custom domain
  "https://truenester.com",
  "https://www.truenester.com",
  "https://api.truenester.com",
  // Vercel deployments
  "https://dubai-nest-hub-f3c99d5902f9f02eb444.vercel.app",
  "https://dubai-nest-hub-f3c99d5902f9f02eb444a8cf6bae253c0a7b8ead.vercel.app",
  // Vercel domains - regex patterns
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/dubai-nest-hub.*\.vercel\.app$/,
  // Netlify legacy (if any)
  "https://bright-torte-7f50cf.netlify.app",
  "https://dubai-nest-hub.netlify.app",
  "https://spectacular-cat-ffb517.netlify.app",
  // Dynamic from env
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check regex patterns (for Vercel domains)
    for (const pattern of allowedOrigins) {
      if (pattern instanceof RegExp && pattern.test(origin)) {
        return callback(null, true);
      }
    }
    
    // Allow if FRONTEND_URL matches
    if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-admin-api-key", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(requestIdMiddleware);

// Start notification worker in background (polls for events)
const ENABLE_NOTIFICATION_WORKER = process.env.ENABLE_NOTIFICATION_WORKER !== "false";
if (ENABLE_NOTIFICATION_WORKER) {
  notificationWorker.start();
  logger.info("Notification worker started", { channel: "server" });
}

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});

const chatbotMessageSchema = z.object({
  id: z.string().min(1),
  sender: z.enum(["bot", "user", "customer", "agent"]).default("user"),
  messageText: z.string().min(1),
  messageType: z.string().min(1).default("text"),
  timestamp: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const chatbotLeadSchema = z.object({
  conversationId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(5),
  customerEmail: z.coerce.string().email().optional().or(z.literal("")),
  intent: z.enum(["buy", "rent", "sell", "invest", "browse"]).optional(),
  budget: z.string().optional(),
  propertyType: z.string().optional(),
  preferredArea: z.string().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  leadQuality: z.enum(["hot", "warm", "cold"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  leadScoreBreakdown: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  messages: z.array(chatbotMessageSchema).optional(),
});

const fallbackLeadQuality = (score?: number): LeadQuality => {
  if (typeof score !== "number") return "cold";
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cold";
};

const coerceTimestamp = (value?: string) => {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

const flattenQueryValue = (input: QueryValue): string[] => {
  if (Array.isArray(input)) {
    return input.flatMap((entry) => flattenQueryValue(entry as QueryValue));
  }
  if (typeof input === "object" && input !== null) {
    return Object.values(input).flatMap((entry) => flattenQueryValue(entry as QueryValue));
  }
  return String(input)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseArrayParam = (value: QueryValue | undefined): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const normalized = flattenQueryValue(value);
  return normalized.length ? normalized : undefined;
};

const parseConversationFilters = (query: Request["query"]): ConversationFilters => {
  const filters: ConversationFilters = {};

  if (typeof query.query === "string" && query.query.trim().length > 0) {
    filters.query = query.query.trim();
  }

  filters.status = parseArrayParam(query.status) as ConversationFilters["status"];
  filters.leadQuality = parseArrayParam(query.leadQuality) as ConversationFilters["leadQuality"];
  filters.intent = parseArrayParam(query.intent) as ConversationFilters["intent"];
  filters.areas = parseArrayParam(query.areas);
  filters.assignedAgentIds = parseArrayParam(query.assignedAgentIds);
  filters.tags = parseArrayParam(query.tags);
  filters.followUpStatus = parseArrayParam(query.followUpStatus) as ConversationFilters["followUpStatus"];

  if (typeof query.scoreRange === "string") {
    const [min, max] = query.scoreRange.split(":").map((value: string) => Number(value));
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      filters.scoreRange = [min, max];
    }
  }

  const dateFrom = typeof query.dateFrom === "string" ? query.dateFrom : undefined;
  const dateTo = typeof query.dateTo === "string" ? query.dateTo : undefined;
  if (dateFrom && dateTo) {
    filters.dateRange = { from: dateFrom, to: dateTo };
  }

  if (typeof query.sort === "string") {
    filters.sort = query.sort;
  }

  return filters;
};

const applyFilters = (queryBuilder: any, filters: ConversationFilters) => {
  let query = queryBuilder;

  if (filters.status?.length) {
    query = query.in("status", filters.status);
  }
  if (filters.leadQuality?.length) {
    query = query.in("lead_quality", filters.leadQuality);
  }
  if (filters.intent?.length) {
    query = query.in("intent", filters.intent);
  }
  if (filters.areas?.length) {
    query = query.in("preferred_area", filters.areas);
  }
  if (filters.assignedAgentIds?.length) {
    query = query.in("assigned_agent_id", filters.assignedAgentIds);
  }
  if (filters.tags?.length) {
    query = query.contains("tags", filters.tags);
  }
  if (filters.followUpStatus?.length) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    if (filters.followUpStatus.includes("due-today")) {
      query = query.gte("follow_up_date", startOfDay.toISOString()).lte("follow_up_date", endOfDay.toISOString());
    }
    if (filters.followUpStatus.includes("overdue")) {
      query = query.lt("follow_up_date", now.toISOString());
    }
  }
  if (filters.scoreRange) {
    query = query.gte("lead_score", filters.scoreRange[0]).lte("lead_score", filters.scoreRange[1]);
  }
  if (filters.dateRange) {
    query = query.gte("created_at", filters.dateRange.from).lte("created_at", filters.dateRange.to);
  }
  if (filters.query) {
    const escaped = filters.query.replace(/,/g, "");
    query = query.or(
      `customer_name.ilike.%${escaped}%,customer_phone.ilike.%${escaped}%,customer_email.ilike.%${escaped}%,tags.cs.{${escaped}}`
    );
  }

  switch (filters.sort) {
    case "hot":
      query = query.order("lead_score", { ascending: false });
      break;
    case "warm":
      query = query.order("lead_score", { ascending: false }).lte("lead_score", 80);
      break;
    case "cold":
      query = query.order("lead_score", { ascending: true });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "highest-budget":
      query = query.order("conversion_value", { ascending: false });
      break;
    case "lowest-budget":
      query = query.order("conversion_value", { ascending: true });
      break;
    case "follow-up":
      query = query.order("follow_up_date", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  return query;
};

const mapMessageRecord = (record: any): ChatMessageDTO => ({
  id: record.id,
  conversationId: record.conversation_id,
  sender: record.sender,
  messageText: record.message_text,
  messageType: record.message_type,
  timestamp: record.timestamp,
  isRead: record.is_read ?? true,
  metadata: record.metadata ?? null,
});

const mapConversationRecord = (record: any): ConversationDTO => {
  const messages: ChatMessageDTO[] = Array.isArray(record.chat_messages) ? record.chat_messages.map(mapMessageRecord) : [];
  const lastMessage = messages[messages.length - 1];
  const unreadCount = messages.filter((message) => message.isRead === false).length;

  return {
    id: record.id,
    customerId: record.customer_id,
    customerName: record.customer_name,
    customerPhone: record.customer_phone,
    customerEmail: record.customer_email,
    startTime: record.start_time,
    endTime: record.end_time,
    durationMinutes: record.duration_minutes,
    status: record.status,
    leadScore: record.lead_score ?? 0,
    leadQuality: record.lead_quality ?? "cold",
    budget: record.budget,
    propertyType: record.property_type,
    preferredArea: record.preferred_area,
    intent: record.intent,
    assignedAgentId: record.assigned_agent_id,
    tags: record.tags ?? [],
    notes: record.notes,
    followUpDate: record.follow_up_date,
    outcome: record.outcome,
    conversionValue: record.conversion_value,
    leadScoreBreakdown: record.lead_score_breakdown,
    lastMessageSnippet: lastMessage?.messageText?.slice(0, 120) ?? null,
    lastMessageAt: lastMessage?.timestamp ?? null,
    unreadCount: typeof record.unread_count === "number" ? record.unread_count : unreadCount,
    messages,
  };
};

const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
  if (!ADMIN_API_KEY) return next();
  const providedKey = req.header("x-admin-api-key") ?? req.header("authorization")?.replace("Bearer ", "");
  if (providedKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
};

// In-memory store for tracking customer conversation threads (reset on server restart)
const customerThreads = new Map<string, { threadTs: string; conversationCount: number; lastUpdate: number }>();

// Cleanup old thread data (older than 24 hours)
setInterval(() => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  for (const [key, data] of customerThreads.entries()) {
    if (data.lastUpdate < oneDayAgo) {
      customerThreads.delete(key);
      console.log(`[SLACK] Cleaned up old thread data for customer: ${key}`);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour

// Enhanced helper function to send Slack notifications with threading support
const sendSlackNotification = async (payload: any, source: "chatbot" | "property_inquiry" | "contact_form") => {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  console.log(`[SLACK] Attempting to send ${source} notification for: ${payload.customerName}`);
  console.log(`[SLACK] Webhook URL configured: ${!!slackWebhookUrl}`);
  
  if (!slackWebhookUrl) {
    console.warn('[SLACK] No webhook URL configured - skipping notification');
    return;
  }

  try {
    const message: any = {
      text: `🔔 New Lead: ${payload.customerName || "Unknown"}`,
    };
    
    console.log(`[SLACK] Building message for source: ${source}`);

    if (source === "chatbot") {
      // Create customer correlation like admin panel system
      const customerPhone = payload.customerPhone || 'no-phone';
      const customerEmail = payload.customerEmail || 'no-email';
      const customerId = `${payload.customerName.replace(/\s+/g, '-').toLowerCase()}-${customerPhone.slice(-4) || customerEmail.slice(-4) || '0000'}`;
      
      const existingThread = customerThreads.get(customerId);
      
      let conversationCount = 1;
      if (existingThread) {
        conversationCount = existingThread.conversationCount + 1;
        console.log(`[SLACK] Customer ${payload.customerName} (${customerId}) - Conversation #${conversationCount}`);
      } else {
        console.log(`[SLACK] New customer ${payload.customerName} - Creating customer ID: ${customerId}`);
      }
      
      const isFirstConversation = conversationCount === 1;
      const maxSubmissions = 5;
      const isFinalSubmission = conversationCount >= maxSubmissions;
      const previousConversations = conversationCount - 1;
      
      // Create admin panel compatible message format
      message.text = `${isFirstConversation ? '🤖 NEW CUSTOMER' : '🔄 RETURNING CUSTOMER'} - ${payload.customerName} (Conversation #${conversationCount}/${maxSubmissions})`;
      message.blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${isFirstConversation ? '🤖 NEW CUSTOMER' : '🔄 RETURNING CUSTOMER'} - ${payload.customerName} (${conversationCount}/${maxSubmissions})`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Customer ID:* \`${customerId}\`\n*Status:* ${isFirstConversation ? 'New Lead' : `Returning Customer (${previousConversations} previous conversations)`}`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Contact:*\n📜Name: ${payload.customerName}\n📱 ${customerPhone}\n📧 ${customerEmail}` },
            { type: "mrkdwn", text: `*This Inquiry:*\n🎯 Intent: ${payload.intent || "general"}\n💰 Budget: ${payload.budget || "Not specified"}\n📍 Areas: ${payload.preferredArea || "Any"}` },
            { type: "mrkdwn", text: `*Analytics:*\n⭐ Lead Score: ${payload.leadScore || 0}/100\n🕰️ Duration: ${payload.durationMinutes || 0} min\n📊 Progress: ${conversationCount}/${maxSubmissions}` },
          ],
        }
      ];
      
      // Add property images if available
      const propertyImages = payload.leadScoreBreakdown?.images || [];
      const propertyDetails = payload.leadScoreBreakdown?.propertyDetails || [];
      
      // Helper to ensure proper image URLs for Slack (use signed URLs if needed)
      const getSlackImageUrl = async (imagePath: string) => {
        if (!imagePath) return "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=60";
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        
        try {
          // Try to create a signed URL for Slack (since images might be private)
          const cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes
          const { data, error } = await supabase.storage
            .from('property-images')
            .createSignedUrl(cleanPath, 60 * 60 * 24); // 24 hours for Slack
            
          if (!error && data?.signedUrl) {
            console.log(`[SLACK] Generated signed URL for ${cleanPath}: ${data.signedUrl}`);
            return data.signedUrl;
          }
          
          // Fallback to public URL
          const supabaseUrl = process.env.SUPABASE_URL || "https://jwmbxpqpjxqclfcahwcf.supabase.co";
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/property-images/${cleanPath}`;
          console.log(`[SLACK] Using public URL for ${cleanPath}: ${publicUrl}`);
          return publicUrl;
        } catch (error) {
          console.error(`[SLACK] Error generating image URL for ${imagePath}:`, error);
          return "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=60";
        }
      };
      
      if (propertyImages.length > 0 && propertyDetails.length > 0) {
        // Add image blocks (Slack supports up to 10 images per message)
        const imageBlocks = await Promise.all(
          propertyDetails.slice(0, 3).map(async (property: any) => ({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🏠 *${property.title}*\n📍 ${property.area} | 💰 ${property.price}`
            },
            accessory: {
              type: "image",
              image_url: await getSlackImageUrl(property.image),
              alt_text: property.title
            }
          }))
        );
        
        message.blocks.splice(2, 0, ...imageBlocks);
        
        if (propertyImages.length > 3) {
          message.blocks.push({
            type: "context",
            elements: [{
              type: "mrkdwn",
              text: `_+${propertyImages.length - 3} more properties viewed by customer_`
            }]
          });
        }
      }
      
      // Add admin panel context
      if (!isFirstConversation) {
        message.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📝 *Conversation History:*\n• This customer has ${previousConversations} previous conversation(s)\n• Search admin panel with Customer ID: \`${customerId}\`\n• All conversations linked in admin dashboard`
          }
        });
      } else {
        message.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🔍 *Admin Panel:*\nCustomer ID: \`${customerId}\`\nUse this ID to track all future conversations from ${payload.customerName}`
          }
        });
      }
      
      // Add completion notice for final submission
      if (isFinalSubmission) {
        message.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *MAXIMUM CONVERSATIONS REACHED*\n${payload.customerName} has completed all ${maxSubmissions} conversations!\n\n🎯 **Action Required:** Immediate follow-up recommended\n📊 **Total Lead Value:** ${payload.leadScore || 0}/100 across ${maxSubmissions} conversations`
          }
        });
      }
      
      // Add admin panel action buttons
      const adminActions = [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View All Conversations",
            emoji: true,
          },
          url: `${process.env.FRONTEND_URL || "http://localhost:8080"}/admin/conversations?customer=${encodeURIComponent(customerId)}`,
          style: "primary",
        }
      ];
      
      if (isFinalSubmission) {
        adminActions.push({
          type: "button",
          text: {
            type: "plain_text",
            text: "Schedule Follow-up",
            emoji: true,
          },
          url: `${process.env.FRONTEND_URL || "http://localhost:8080"}/admin/conversations?action=schedule&customer=${encodeURIComponent(customerId)}`,
          style: "danger",
        });
      }
      
      message.blocks.push({
        type: "actions",
        elements: adminActions
      });
    } else if (source === "property_inquiry") {
      message.blocks = [
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
            { type: "mrkdwn", text: `*Property:*\n${payload.propertyTitle || "Unknown"}` },
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
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Property",
                emoji: true,
              },
              url: payload.propertyUrl || `${process.env.FRONTEND_URL || "http://localhost:8080"}/admin/conversations`,
              style: "primary",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in Admin",
              },
              url: `${process.env.FRONTEND_URL || "http://localhost:8080"}/admin/conversations`,
            },
          ],
        },
      ];
    }

    console.log(`[SLACK] Sending to webhook: ${slackWebhookUrl.substring(0, 50)}...`);
    console.log(`[SLACK] Message payload:`, JSON.stringify(message, null, 2));
    
    const response = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SLACK] Webhook failed with status ${response.status}: ${errorText}`);
      throw new Error(`Slack webhook failed: ${response.status} ${errorText}`);
    }
    
    console.log(`[SLACK] ✅ Successfully sent ${source} notification`);
    
    // For chatbot messages, update conversation tracking with admin panel customer ID
    if (source === "chatbot") {
      const customerPhone = payload.customerPhone || 'no-phone';
      const customerEmail = payload.customerEmail || 'no-email';
      const customerId = `${payload.customerName.replace(/\s+/g, '-').toLowerCase()}-${customerPhone.slice(-4) || customerEmail.slice(-4) || '0000'}`;
      
      const existingData = customerThreads.get(customerId);
      
      if (!existingData) {
        customerThreads.set(customerId, {
          threadTs: `${Date.now()}-${customerId}`,
          conversationCount: 1,
          lastUpdate: Date.now()
        });
        console.log(`[SLACK] 📊 New customer tracking: ${payload.customerName} -> ${customerId}`);
      } else {
        customerThreads.set(customerId, {
          ...existingData,
          conversationCount: existingData.conversationCount + 1,
          lastUpdate: Date.now()
        });
        console.log(`[SLACK] 🔄 Customer ${customerId}: conversation #${existingData.conversationCount + 1}`);
      }
    }
  } catch (error) {
    console.error(`[SLACK] ❌ Failed to send ${source} notification:`, error);
    // Don't throw - silently fail Slack notifications to not block main request
  }
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    slackConfigured: !!process.env.SLACK_WEBHOOK_URL,
    telegramConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    emailConfigured: !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS),
    port: PORT
  });
});

app.post("/api/notifications/fallback", async (req: Request, res: Response) => {
  try {
    console.log('[NOTIFICATION] Fallback endpoint called from frontend');
    
    const payload = req.body as NotificationPayload;
    
    const result = await notificationService.sendNotification(payload);
    
    if (result.success) {
      const channels = Object.entries(result.channels)
        .filter(([_, v]) => v?.success)
        .map(([k]) => k);
      console.log(`[NOTIFICATION] ✅ Fallback sent via: ${channels.join(", ")}`);
      res.json({ success: true, channels });
    } else {
      console.error("[NOTIFICATION] ❌ All fallback channels failed");
      res.status(500).json({ success: false, error: "All notification channels failed" });
    }
  } catch (error) {
    console.error('[NOTIFICATION] Fallback endpoint error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Test endpoint for Slack notifications with images
app.post("/api/test/slack", async (req: Request, res: Response) => {
  try {
    console.log('[TEST] Slack test endpoint called');
    
    await sendSlackNotification({
      customerName: "Test User (API Test)",
      customerEmail: "test@example.com",
      customerPhone: "+971501234567",
      intent: "test",
      budget: "Test Budget",
      propertyType: "Test Property",
      preferredArea: "Test Area",
      leadScore: 100,
      durationMinutes: 1,
      leadScoreBreakdown: {
        images: [
          "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=60",
          "sample-image.jpg"
        ],
        propertyDetails: [
          {
            title: "Test Property 1",
            image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=60",
            price: "AED 2,500,000",
            area: "Dubai Marina"
          },
          {
            title: "Test Property 2", 
            image: "sample-image.jpg",
            price: "AED 1,800,000",
            area: "JBR"
          }
        ]
      }
    }, "chatbot");
    
    res.json({ success: true, message: "Test Slack notification sent with images" });
  } catch (error) {
    console.error('[TEST] Slack test failed:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post("/api/chatbot/leads", async (req: Request, res: Response) => {
  try {
    console.log(`[API] 📥 Received chatbot lead submission from: ${req.ip}`);
    console.log(`[API] Request body keys: ${Object.keys(req.body).join(', ')}`);
    
    const payload = chatbotLeadSchema.parse(req.body);
    console.log(`[API] ✅ Payload validation passed for: ${payload.customerName}`);
    const nowIso = new Date().toISOString();
    const messageTimeline = payload.messages ?? [];
    const firstMessageTimestamp = messageTimeline[0]?.timestamp ? coerceTimestamp(messageTimeline[0].timestamp) : nowIso;
    const lastMessageTimestamp = messageTimeline[messageTimeline.length - 1]?.timestamp
      ? coerceTimestamp(messageTimeline[messageTimeline.length - 1]?.timestamp)
      : firstMessageTimestamp;
    const durationMinutes = Math.max(1, Math.round((new Date(lastMessageTimestamp).getTime() - new Date(firstMessageTimestamp).getTime()) / 60000));

    const conversationId = payload.conversationId ?? randomUUID();
    const customerId = payload.customerId ?? randomUUID();
    const leadScoreValue = typeof payload.leadScore === "number" ? payload.leadScore : 0;
    const leadQualityValue = payload.leadQuality ?? fallbackLeadQuality(payload.leadScore);

    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        id: conversationId,
        customer_id: customerId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_email: payload.customerEmail || null,
        start_time: firstMessageTimestamp,
        end_time: null,
        duration_minutes: durationMinutes,
        status: "new",
        lead_score: leadScoreValue,
        lead_quality: leadQualityValue,
        budget: payload.budget,
        property_type: payload.propertyType,
        preferred_area: payload.preferredArea,
        intent: payload.intent,
        assigned_agent_id: null,
        tags: payload.tags ?? [],
        notes: payload.notes ?? null,
        conversation_summary: null,
        follow_up_date: null,
        outcome: null,
        conversion_value: null,
        lead_score_breakdown: payload.leadScoreBreakdown ?? {
          source: "chatbot",
          score: leadScoreValue,
          quality: leadQualityValue,
        },
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single();

    if (conversationError) {
      console.error("Conversation insert error:", conversationError);
      return res.status(500).json({ error: conversationError.message });
    }

    if (messageTimeline.length) {
      const messageRows = messageTimeline.map((message) => ({
        id: message.id,
        conversation_id: conversationId,
        sender: message.sender === "user" ? "customer" : message.sender,
        message_text: message.messageText,
        message_type: message.messageType ?? "text",
        timestamp: coerceTimestamp(message.timestamp),
        is_read: message.sender !== "customer" && message.sender !== "user",
        metadata: message.metadata ?? null,
        created_at: nowIso,
        updated_at: nowIso,
      }));

      const { error: messagesError } = await supabase.from("chat_messages").insert(messageRows);
      if (messagesError) {
        console.error("Messages insert error:", messagesError);
        await supabase.from("conversations").delete().eq("id", conversationId);
        return res.status(500).json({ error: messagesError.message });
      }
    }

    logger.info(`Successfully created conversation ${conversationId}`, {
      requestId: (req as any).requestId,
      conversationId,
      customerName: payload.customerName,
    });

    // =========================================================================
    // EVENT-DRIVEN ARCHITECTURE: Emit event instead of calling notifications directly
    // WHY: Decouples lead capture from notification delivery
    // - API returns immediately after saving lead
    // - Notification worker processes events asynchronously
    // - If Slack/Email fails, lead is never lost
    // =========================================================================
    
    const idempotencyKey = `lead-${conversationId}`;
    const eventPayload = {
      conversationId,
      customerId,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      intent: payload.intent,
      budget: payload.budget,
      propertyType: payload.propertyType,
      preferredArea: payload.preferredArea,
      leadScore: leadScoreValue,
      leadQuality: leadQualityValue,
      durationMinutes,
      source: "chatbot",
      metadata: payload.metadata,
    };

    // Emit lead.created event (async - doesn't block response)
    leadEventEmitter.emitLeadCreated(eventPayload, idempotencyKey)
      .then((event) => {
        if (event) {
          logger.info(`Event emitted: lead.created`, {
            requestId: (req as any).requestId,
            eventId: event.id,
            conversationId,
          });
        }
      })
      .catch((err) => {
        logger.error(`Failed to emit lead.created event`, err, {
          requestId: (req as any).requestId,
          conversationId,
        });
      });

    // LEGACY: Also send notifications directly for backward compatibility
    // This ensures notifications work even if event worker isn't running
    // Can be removed once event-driven system is fully validated
    const notificationPayload: NotificationPayload = {
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      intent: payload.intent,
      budget: payload.budget,
      propertyType: payload.propertyType,
      area: payload.preferredArea,
      leadScore: leadScoreValue,
      duration: durationMinutes,
      source: "chatbot",
    };
    
    notificationService.sendNotification(notificationPayload).then((result) => {
      if (result.success) {
        const channels = Object.entries(result.channels)
          .filter(([_, v]) => v?.success)
          .map(([k]) => k);
        logger.info(`Notifications sent via: ${channels.join(", ")}`, {
          requestId: (req as any).requestId,
          conversationId,
        });
      } else {
        logger.warn(`All notification channels failed`, {
          requestId: (req as any).requestId,
          conversationId,
        });
      }
    }).catch((err) => {
      logger.error(`Notification error`, err, {
        requestId: (req as any).requestId,
        conversationId,
      });
    });

    // Future integrations (feature-flagged, currently disabled)
    if (featureFlags.whatsappEnabled || featureFlags.crmEnabled) {
      const leadData = {
        conversationId,
        customerId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerEmail: payload.customerEmail,
        intent: payload.intent,
        budget: payload.budget,
        propertyType: payload.propertyType,
        preferredArea: payload.preferredArea,
        leadScore: leadScoreValue,
        leadQuality: leadQualityValue,
        source: "chatbot",
        tags: payload.tags,
      };

      // These are no-ops unless feature flags are enabled
      integrationManager.sendWhatsApp(leadData).catch(() => {});
      integrationManager.pushToCRM(leadData).catch(() => {});
    }
    
    return res.status(201).json({ id: conversationId, conversation: conversationData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Chatbot leads endpoint error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

// Property Inquiry Form endpoint
const propertyInquirySchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  propertyTitle: z.string().optional(),
  propertyUrl: z.string().url().optional(),
  message: z.string().optional(),
  budget: z.string().optional(),
  propertyType: z.string().optional(),
});

app.post("/api/property-inquiry", async (req: Request, res: Response) => {
  try {
    console.log(`[API] 📥 Received property inquiry from: ${req.ip}`);
    
    const payload = propertyInquirySchema.parse(req.body);
    console.log(`[API] ✅ Property inquiry validation passed for: ${payload.customerName}`);
    
    const inquiryId = randomUUID();
    const nowIso = new Date().toISOString();
    
    // Store inquiry in database (you can create a property_inquiries table if needed)
    console.log(`[API] 📝 Processing property inquiry ${inquiryId} for ${payload.customerName}`);
    
    // Send notification
    const notificationPayload: NotificationPayload = {
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      propertyTitle: payload.propertyTitle,
      propertyUrl: payload.propertyUrl,
      message: payload.message,
      budget: payload.budget,
      propertyType: payload.propertyType,
      source: "property_inquiry",
    };
    
    notificationService.sendNotification(notificationPayload).then((result) => {
      if (result.success) {
        console.log(`[API] ✅ Notification sent successfully for property inquiry ${inquiryId}`);
      } else {
        console.error(`[API] ❌ Failed to send notification for property inquiry ${inquiryId}`);
      }
    }).catch((error) => {
      console.error(`[API] ❌ Notification error for property inquiry ${inquiryId}:`, error);
    });
    
    return res.status(201).json({ 
      success: true, 
      id: inquiryId,
      message: "Property inquiry submitted successfully" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Property inquiry validation error:", error.errors);
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Property inquiry endpoint error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

// Contact Form endpoint
const contactFormSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
  department: z.string().optional(),
});

app.post("/api/contact", async (req: Request, res: Response) => {
  try {
    console.log(`[API] 📥 Received contact form submission from: ${req.ip}`);
    
    const payload = contactFormSchema.parse(req.body);
    console.log(`[API] ✅ Contact form validation passed for: ${payload.customerName}`);
    
    const contactId = randomUUID();
    const nowIso = new Date().toISOString();
    
    // Send notification
    const notificationPayload: NotificationPayload = {
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      subject: payload.subject,
      message: payload.message,
      department: payload.department,
      source: "contact_form",
    };
    
    notificationService.sendNotification(notificationPayload).then((result) => {
      if (result.success) {
        console.log(`[API] ✅ Notification sent successfully for contact form ${contactId}`);
      } else {
        console.error(`[API] ❌ Failed to send notification for contact form ${contactId}`);
      }
    }).catch((error) => {
      console.error(`[API] ❌ Notification error for contact form ${contactId}:`, error);
    });
    
    return res.status(201).json({ 
      success: true, 
      id: contactId,
      message: "Contact form submitted successfully" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Contact form validation error:", error.errors);
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Contact form endpoint error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

// Sell Submission endpoint  
const sellSubmissionSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  propertyType: z.string().optional(),
  propertyAddress: z.string().optional(),
  expectedPrice: z.string().optional(),
  propertyDescription: z.string().optional(),
  urgency: z.string().optional(),
});

app.post("/api/sell-submission", async (req: Request, res: Response) => {
  try {
    console.log(`[API] 📥 Received sell submission from: ${req.ip}`);
    
    const payload = sellSubmissionSchema.parse(req.body);
    console.log(`[API] ✅ Sell submission validation passed for: ${payload.customerName}`);
    
    const submissionId = randomUUID();
    const nowIso = new Date().toISOString();
    
    // Send notification
    const notificationPayload: NotificationPayload = {
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      propertyType: payload.propertyType,
      message: `Property Address: ${payload.propertyAddress}\nExpected Price: ${payload.expectedPrice}\nDescription: ${payload.propertyDescription}\nUrgency: ${payload.urgency}`,
      source: "property_inquiry", // Using property_inquiry as base, but we can extend this
      subject: "Property Sell Submission",
    };
    
    notificationService.sendNotification(notificationPayload).then((result) => {
      if (result.success) {
        console.log(`[API] ✅ Notification sent successfully for sell submission ${submissionId}`);
      } else {
        console.error(`[API] ❌ Failed to send notification for sell submission ${submissionId}`);
      }
    }).catch((error) => {
      console.error(`[API] ❌ Notification error for sell submission ${submissionId}:`, error);
    });
    
    return res.status(201).json({ 
      success: true, 
      id: submissionId,
      message: "Sell submission received successfully" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Sell submission validation error:", error.errors);
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Sell submission endpoint error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

app.get("/api/admin/conversations", authenticateRequest, async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Number(req.query.limit ?? 25), 100);
  const filters = parseConversationFilters(req.query);

  let query = supabase
    .from("conversations")
    .select("*, chat_messages(*), lead_tags(*), assigned_agent:agents(*)", { count: "exact" })
    .range((page - 1) * limit, page * limit - 1);

  query = applyFilters(query, filters);
  const { data, error, count } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ data: data?.map(mapConversationRecord) ?? [], total: count ?? 0, page, limit });
});

app.get("/api/admin/conversations/:id", authenticateRequest, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("conversations")
    .select("*, chat_messages(*), lead_tags(*), assigned_agent:agents(*)")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({ error: error.message });
  }

  return res.json(mapConversationRecord(data));
});

app.get("/api/admin/conversations/:id/messages", authenticateRequest, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("timestamp", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json((data ?? []).map(mapMessageRecord));
});

const assignmentSchema = z.object({
  agentId: z.string().uuid(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  notes: z.string().max(500).optional(),
});

app.post("/api/admin/conversations/:id/assign", authenticateRequest, async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = assignmentSchema.parse(req.body) as AssignmentPayload;

  const { error } = await supabase
    .from("conversations")
    .update({ assigned_agent_id: payload.agentId, notes: payload.notes })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ status: "assigned" });
});

const followUpSchema = z.object({
  followUpDate: z.string().nonempty(),
  reminderType: z.enum(["email", "sms", "whatsapp"]),
  reminderText: z.string().max(500).optional(),
  priority: z.enum(["high", "medium", "low"]).default("high"),
  assignedAgentId: z.string().uuid().optional(),
  notifyCustomer: z.boolean().optional(),
});

const dispatchFollowUpNotification = async (conversationId: string, payload: FollowUpPayload) => {
  // Follow-up notification logic would go here
};

app.post("/api/admin/conversations/:id/follow-ups", authenticateRequest, async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = followUpSchema.parse(req.body) as FollowUpPayload;

  const { data, error } = await supabase
    .from("follow_up_tasks")
    .insert({
      conversation_id: id,
      follow_up_date: payload.followUpDate,
      reminder_type: payload.reminderType,
      reminder_text: payload.reminderText,
      priority: payload.priority,
      assigned_agent_id: payload.assignedAgentId,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (payload.notifyCustomer) {
    await dispatchFollowUpNotification(id, payload);
  }

  return res.status(201).json(data);
});

app.get("/api/admin/analytics", authenticateRequest, async (req: Request, res: Response) => {
  const dateFrom = typeof req.query.from === "string" ? req.query.from : undefined;
  const dateTo = typeof req.query.to === "string" ? req.query.to : undefined;

  try {
    // Try RPC function first
    const { data, error } = await supabase.rpc("fetch_conversation_analytics", {
      date_from: dateFrom,
      date_to: dateTo,
    });

    if (!error && data) {
      return res.json(data as ConversationAnalyticsResponse);
    }
  } catch {
    // RPC function doesn't exist, fall through to manual calculation
  }

  // Fallback: Calculate analytics manually from conversations table
  try {
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, status, lead_score, lead_quality, created_at, conversion_value");

    if (convError) {
      return res.status(500).json({ error: convError.message });
    }

    const convs = conversations ?? [];
    const totalConversations = convs.length;
    const hotLeads = convs.filter((c: any) => c.lead_quality === "hot").length;
    const warmLeads = convs.filter((c: any) => c.lead_quality === "warm").length;
    const coldLeads = convs.filter((c: any) => c.lead_quality === "cold").length;
    const convertedCount = convs.filter((c: any) => c.status === "converted").length;
    const conversionRate = totalConversations > 0 ? (convertedCount / totalConversations) * 100 : 0;

    const analytics: ConversationAnalyticsResponse = {
      totalConversations,
      hotLeads,
      warmLeads,
      coldLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageDuration: 0,
      averageResponseTime: 0,
      satisfactionScore: 0,
      leadSourceBreakdown: [],
      conversationVolumeTrend: [],
      leadQualityDistribution: [
        { quality: "hot", value: hotLeads },
        { quality: "warm", value: warmLeads },
        { quality: "cold", value: coldLeads },
      ],
      conversionFunnel: [
        { stage: "New", value: totalConversations },
        { stage: "Qualified", value: hotLeads + warmLeads },
        { stage: "Won", value: convertedCount },
      ],
      agentPerformance: [],
      peakHours: [],
    };

    return res.json(analytics);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

const exportSchema = z.object({
  format: z.enum(["csv", "xlsx", "pdf"]),
  filters: z.record(z.any()).optional(),
});

const fetchConversationsForExport = async (filters: ConversationFilters) => {
  let query = supabase.from("conversations").select("*, chat_messages(*)");
  query = applyFilters(query, filters);
  return query.limit(1000);
};

const sendCsv = (res: Response, rows: ConversationDTO[]) => {
  const parser = new Json2CsvParser({
    fields: [
      "id",
      "customerName",
      "customerEmail",
      "customerPhone",
      "status",
      "leadScore",
      "leadQuality",
      "preferredArea",
      "intent",
      "conversionValue",
      "followUpDate",
    ],
  });
  const csv = parser.parse(
    rows.map((row) => ({
      ...row,
      tags: row.tags.join("|"),
    }))
  );

  res.header("Content-Type", "text/csv");
  res.attachment(`conversations-${Date.now()}.csv`);
  res.send(csv);
};

const sendXlsx = async (res: Response, rows: ConversationDTO[]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Conversations");
  sheet.columns = [
    { header: "Customer", key: "customerName", width: 24 },
    { header: "Email", key: "customerEmail", width: 28 },
    { header: "Phone", key: "customerPhone", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Lead Score", key: "leadScore", width: 14 },
    { header: "Lead Quality", key: "leadQuality", width: 14 },
    { header: "Intent", key: "intent", width: 14 },
    { header: "Preferred Area", key: "preferredArea", width: 18 },
    { header: "Follow-up", key: "followUpDate", width: 20 },
  ];

  rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.attachment(`conversations-${Date.now()}.xlsx`);
  res.send(Buffer.from(buffer));
};

const sendPdf = (res: Response, rows: ConversationDTO[]) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const filename = `conversations-${Date.now()}.pdf`;
  res.header("Content-Type", "application/pdf");
  res.attachment(filename);
  doc.pipe(res);

  doc.fontSize(18).text("Conversation Export", { align: "left" });
  doc.moveDown();

  rows.forEach((row) => {
    doc.fontSize(12).text(`Customer: ${row.customerName}`);
    doc.text(`Contact: ${row.customerEmail ?? "-"} | ${row.customerPhone ?? "-"}`);
    doc.text(`Status: ${row.status} | Lead Score: ${row.leadScore} (${row.leadQuality})`);
    doc.text(`Intent: ${row.intent ?? "-"} | Area: ${row.preferredArea ?? "-"}`);
    doc.text(`Follow-up: ${row.followUpDate ?? "not scheduled"}`);
    doc.moveDown();
  });

  doc.end();
};

app.post("/api/admin/conversations/export", authenticateRequest, async (req: Request, res: Response) => {
  const { format, filters } = exportSchema.parse(req.body);
  const parsedFilters: ConversationFilters = filters ?? {};

  const { data, error } = await fetchConversationsForExport(parsedFilters);
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const rows = (data ?? []).map(mapConversationRecord);

  if (format === "csv") {
    return sendCsv(res, rows);
  }
  if (format === "xlsx") {
    return sendXlsx(res, rows);
  }
  return sendPdf(res, rows);
});

app.get("/api/admin/search", authenticateRequest, async (req: Request, res: Response) => {
  const q = typeof req.query.query === "string" ? req.query.query.trim() : undefined;
  if (!q) {
    return res.status(400).json({ error: "Query string is required" });
  }

  let filters: ConversationFilters = { query: q };
  if (typeof req.query.filters === "string") {
    try {
      const parsed = JSON.parse(req.query.filters);  
      filters = { ...filters, ...(parsed ?? {}) };
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid filters JSON" });
    }
  }

  let query = supabase
    .from("conversations")
    .select("*, chat_messages(*)")
    .limit(50);
  query = applyFilters(query, filters);

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json((data ?? []).map(mapConversationRecord));
});

// Test endpoint to verify notification configuration
app.get("/api/test-notifications", async (_req: Request, res: Response) => {
  const config = {
    slack: {
      configured: !!process.env.SLACK_WEBHOOK_URL,
      urlPreview: process.env.SLACK_WEBHOOK_URL ? process.env.SLACK_WEBHOOK_URL.substring(0, 50) + "..." : null,
    },
    email: {
      configured: !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS),
      host: process.env.EMAIL_HOST || null,
      user: process.env.EMAIL_USER || null,
      port: process.env.EMAIL_PORT || "587",
      secure: process.env.EMAIL_SECURE || "false",
      from: process.env.EMAIL_FROM || null,
    },
    telegram: {
      configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    },
    frontend: process.env.FRONTEND_URL || "http://localhost:8080",
  };
  
  return res.json({
    status: "ok",
    message: "Notification service configuration",
    config,
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint to send a test notification
app.post("/api/test-notifications/send", async (_req: Request, res: Response) => {
  try {
    const testPayload = {
      customerName: "Test User",
      customerEmail: "test@example.com",
      customerPhone: "+971501234567",
      intent: "buy",
      budget: "1M-2M AED",
      propertyType: "Apartment",
      area: "Dubai Marina",
      leadScore: 85,
      duration: 5,
      source: "chatbot" as const,
    };
    
    console.log("[TEST] Sending test notification...");
    const result = await notificationService.sendNotification(testPayload);
    console.log("[TEST] Notification result:", JSON.stringify(result, null, 2));
    
    return res.json({
      status: result.success ? "success" : "partial_failure",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[TEST] Notification error:", error);
    return res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED REJECTION]", reason, promise);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] TrueNester Admin API listening on port ${PORT} (all interfaces)`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:8080"}`);
  console.log(`Slack webhook configured: ${!!process.env.SLACK_WEBHOOK_URL}`);
  if (process.env.SLACK_WEBHOOK_URL) {
    console.log(`Slack webhook URL: ${process.env.SLACK_WEBHOOK_URL.substring(0, 50)}...`);
  }
  console.log(`Admin API key configured: ${!!ADMIN_API_KEY}`);
  console.log(`Available endpoints:`);
  console.log(`  - POST /api/chatbot/leads (Chatbot lead capture)`);
  console.log(`  - GET /health (Health check)`);
  console.log(`  - GET /api/admin/conversations (Admin conversations)`);
  
  // Test if server can bind properly
  console.log(`Server should be accessible at:`);
  console.log(`  - http://localhost:${PORT}/health`);
  console.log(`  - http://127.0.0.1:${PORT}/health`);
});
