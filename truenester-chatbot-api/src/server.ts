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
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "x-admin-api-key", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

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

// Helper function to send Slack notifications
const sendSlackNotification = async (payload: any, source: "chatbot" | "property_inquiry" | "contact_form") => {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    return;
  }

  try {
    let message: any = {
      text: `🔔 New Lead: ${payload.customerName || "Unknown"}`,
    };

    if (source === "chatbot") {
      message.blocks = [
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
            { type: "mrkdwn", text: `*Intent:*\n${payload.intent || "general"}` },
            { type: "mrkdwn", text: `*Email:*\n${payload.customerEmail || "N/A"}` },
            { type: "mrkdwn", text: `*Phone:*\n${payload.customerPhone || "N/A"}` },
            { type: "mrkdwn", text: `*Budget:*\n${payload.budget || "Not specified"}` },
            { type: "mrkdwn", text: `*Property Type:*\n${payload.propertyType || "Any"}` },
            { type: "mrkdwn", text: `*Area:*\n${payload.preferredArea || "Any"}` },
            { type: "mrkdwn", text: `*Lead Score:*\n${payload.leadScore || 0}/100` },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Duration:*\n${payload.durationMinutes || 0} minutes`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in Admin Panel",
                emoji: true,
              },
              url: `${process.env.FRONTEND_URL || "http://localhost:8080"}/admin/conversations`,
              style: "primary",
            },
          ],
        },
      ];
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

    await fetch(slackWebhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (error) {
    // Silently fail Slack notifications to not block main request
  }
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/chatbot/leads", async (req: Request, res: Response) => {
  const payload = chatbotLeadSchema.parse(req.body);
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
      await supabase.from("conversations").delete().eq("id", conversationId);
      return res.status(500).json({ error: messagesError.message });
    }
  }

  // Send Slack notification asynchronously (don't wait for it)
  sendSlackNotification({
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    intent: payload.intent,
    budget: payload.budget,
    propertyType: payload.propertyType,
    preferredArea: payload.preferredArea,
    leadScore: leadScoreValue,
    durationMinutes: durationMinutes,
  }, "chatbot").catch(() => {});
  
  return res.status(201).json({ id: conversationId, conversation: conversationData });
});

app.use("/api", authenticateRequest);

app.get("/api/admin/conversations", async (req: Request, res: Response) => {
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

app.get("/api/admin/conversations/:id", async (req: Request, res: Response) => {
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

app.get("/api/admin/conversations/:id/messages", async (req: Request, res: Response) => {
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

app.post("/api/admin/conversations/:id/assign", async (req: Request, res: Response) => {
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

app.post("/api/admin/conversations/:id/follow-ups", async (req: Request, res: Response) => {
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

app.get("/api/admin/analytics", async (req: Request, res: Response) => {
  const dateFrom = typeof req.query.from === "string" ? req.query.from : undefined;
  const dateTo = typeof req.query.to === "string" ? req.query.to : undefined;

  const { data, error } = await supabase.rpc("fetch_conversation_analytics", {
    date_from: dateFrom,
    date_to: dateTo,
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json((data ?? {}) as ConversationAnalyticsResponse);
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

app.post("/api/admin/conversations/export", async (req: Request, res: Response) => {
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

app.get("/api/admin/search", async (req: Request, res: Response) => {
  const q = typeof req.query.query === "string" ? req.query.query.trim() : undefined;
  if (!q) {
    return res.status(400).json({ error: "Query string is required" });
  }

  let filters: ConversationFilters = { query: q };
  if (typeof req.query.filters === "string") {
    try {
      const parsed = JSON.parse(req.query.filters); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

app.listen(PORT);
