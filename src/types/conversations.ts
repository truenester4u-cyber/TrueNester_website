export type ConversationStatus = "new" | "in-progress" | "completed" | "lost";
export type LeadQuality = "hot" | "warm" | "cold";
export type IntentType = "buy" | "rent" | "sell" | "invest" | "browse";
export type MessageSender = "bot" | "customer" | "agent";
export type MessageType = "text" | "button" | "image" | "form" | "system";
export type ReminderType = "email" | "sms" | "whatsapp";
export type PriorityLevel = "high" | "medium" | "low";

export interface LeadScoreBreakdown {
  intent: number;
  engagement: number;
  actions: number;
  contactInfo: number;
  total: number;
  quality: LeadQuality;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  messageText: string;
  messageType: MessageType;
  timestamp: string;
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface FollowUpTask {
  id: string;
  conversationId: string;
  followUpDate: string;
  reminderType: ReminderType;
  reminderText: string;
  priority: PriorityLevel;
  assignedAgentId: string;
  status: "scheduled" | "completed" | "overdue";
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  department?: string;
  activeConversations?: number;
  maxCapacity?: number;
}

export interface ConversationSummary {
  id: string;
  conversationId: string;
  durationMinutes: number;
  totalMessages: number;
  customerIntent: IntentType;
  preferredArea: string;
  budget: string;
  propertyType: string;
  actionsTaken: string[];
  missingSteps: string[];
  suggestedFollowUp: string;
  leadScoreBreakdown: LeadScoreBreakdown;
  generatedAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  avatarUrl?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: ConversationStatus;
  leadScore: number;
  leadQuality: LeadQuality;
  budget?: string;
  propertyType?: string;
  preferredArea?: string;
  intent?: IntentType;
  assignedAgentId?: string;
  assignedAgent?: Agent;
  tags: string[];
  notes?: string;
  conversationSummary?: string;
  followUpDate?: string;
  outcome?: "lead" | "booking" | "lost" | "pending";
  conversionValue?: number;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  lastMessageSnippet?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  leadScoreBreakdown?: LeadScoreBreakdown;
}

export interface AnalyticsSnapshot {
  totalConversations: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  averageDuration: number;
  averageResponseTime: number;
  satisfactionScore: number;
  leadSourceBreakdown: Array<{ source: string; value: number }>;
  conversationVolumeTrend: Array<{ date: string; count: number }>;
  leadQualityDistribution: Array<{ quality: LeadQuality; value: number }>;
  conversionFunnel: Array<{ stage: string; value: number }>;
  agentPerformance: Array<{ agentId: string; agentName: string; conversations: number; conversionRate: number }>;
  peakHours: Array<{ hour: string; conversations: number }>;
}

export interface SearchFilters {
  query?: string;
  status?: ConversationStatus[];
  leadQuality?: LeadQuality[];
  intent?: IntentType[];
  areas?: string[];
  budgetRange?: string;
  dateRange?: { from: string; to: string };
  assignedAgentIds?: string[];
  followUpStatus?: Array<"due-today" | "overdue" | "scheduled">;
  tags?: string[];
  scoreRange?: [number, number];
  sort?: string;
}

export interface NotificationItem {
  id: string;
  type: "new-conversation" | "hot-lead" | "tour" | "lost-lead" | "overdue" | "rating";
  title: string;
  description: string;
  timestamp: string;
  severity: "info" | "success" | "warning" | "critical";
  conversationId?: string;
  actionLabel?: string;
}

export interface ExportRequest {
  format: "pdf" | "csv" | "xlsx";
  dateRange?: { from: string; to: string };
  filters?: SearchFilters;
}
