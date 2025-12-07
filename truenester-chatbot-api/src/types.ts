export type ConversationStatus = "new" | "in-progress" | "completed" | "lost";
export type LeadQuality = "hot" | "warm" | "cold";
export type IntentType = "buy" | "rent" | "sell" | "invest" | "browse";

export interface ConversationRecord {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  start_time: string;
  end_time: string | null;
  status: ConversationStatus;
  lead_score: number;
  lead_quality: LeadQuality;
  budget: string | null;
  property_type: string | null;
  preferred_area: string | null;
  intent: IntentType | null;
  assigned_agent_id: string | null;
  tags: string[] | null;
  notes: string | null;
  follow_up_date: string | null;
  outcome: string | null;
  conversion_value: number | null;
  lead_score_breakdown: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender: string;
  message_text: string;
  message_type: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface LeadScoreBreakdown {
  intent: number;
  engagement: number;
  actions: number;
  contactInfo: number;
  total: number;
}

export interface ExportFilters {
  status?: ConversationStatus[];
  leadQuality?: LeadQuality[];
  intent?: IntentType[];
  query?: string;
  dateRange?: { from: string; to: string };
}

export interface ConversationFilters {
  query?: string;
  status?: ConversationStatus[];
  leadQuality?: LeadQuality[];
  intent?: IntentType[];
  areas?: string[];
  assignedAgentIds?: string[];
  tags?: string[];
  followUpStatus?: Array<"due-today" | "overdue" | "scheduled">;
  scoreRange?: [number, number];
  dateRange?: { from: string; to: string };
  sort?: string;
}

export interface ConversationDTO {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes?: number | null;
  status: ConversationStatus;
  leadScore: number;
  leadQuality: LeadQuality;
  budget?: string | null;
  propertyType?: string | null;
  preferredArea?: string | null;
  intent?: IntentType | null;
  assignedAgentId?: string | null;
  tags: string[];
  notes?: string | null;
  followUpDate?: string | null;
  outcome?: string | null;
  conversionValue?: number | null;
  leadScoreBreakdown?: LeadScoreBreakdown | Record<string, number> | null;
  lastMessageSnippet?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number | null;
  messages?: ChatMessageDTO[];
}

export interface AssignmentPayload {
  agentId: string;
  priority: "high" | "medium" | "low";
  notes?: string;
}

export interface FollowUpPayload {
  followUpDate: string;
  reminderType: "email" | "sms" | "whatsapp";
  reminderText?: string;
  priority: "high" | "medium" | "low";
  assignedAgentId?: string;
  notifyCustomer?: boolean;
}

export interface ConversationAnalyticsResponse {
  totalConversations: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  averageDuration: number;
  averageResponseTime: number;
  conversationVolumeTrend: Array<{ date: string; count: number }>;
  leadQualityDistribution: Array<{ quality: string; value: number }>;
}

export interface ChatMessageDTO {
  id: string;
  conversationId: string;
  sender: string;
  messageText: string;
  messageType: string;
  timestamp: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface FollowUpTaskRecord {
  id: string;
  conversationId: string;
  followUpDate: string;
  reminderType: string;
  reminderText: string | null;
  priority: string;
  status: string;
}
