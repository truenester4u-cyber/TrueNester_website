import { supabase } from "@/integrations/supabase/client";
import type {
  AnalyticsSnapshot,
  ChatMessage,
  Conversation,
  ConversationSummary,
  IntentType,
  FollowUpTask,
  NotificationItem,
  SearchFilters,
} from "@/types/conversations";

const API_BASE_URL = (import.meta.env.VITE_ADMIN_API_URL ?? "/api").replace(/\/$/, "");
const hasAdminApi = Boolean(import.meta.env.VITE_ADMIN_API_URL);
const ADMIN_API_KEY = "TrueNester2025_AdminAPI_SecureKey_Dubai_Development_Production_v1";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "x-admin-api-key": ADMIN_API_KEY,
});

const mapMessage = (payload: any): ChatMessage => ({
  id: payload.id,
  conversationId: payload.conversationId ?? payload.conversation_id,
  sender: payload.sender,
  messageText: payload.messageText ?? payload.message_text,
  messageType: payload.messageType ?? payload.message_type ?? "text",
  timestamp: payload.timestamp,
  isRead: Boolean(payload.isRead ?? payload.is_read ?? payload.metadata?.is_read ?? false),
  metadata: payload.metadata ?? undefined,
});

const mapConversation = (payload: any): Conversation => ({
  id: payload.id,
  customerId: payload.customerId ?? payload.customer_id,
  customerName: payload.customerName ?? payload.customer_name,
  customerPhone: payload.customerPhone ?? payload.customer_phone,
  customerEmail: payload.customerEmail ?? payload.customer_email,
  avatarUrl: payload.avatarUrl ?? payload.avatar_url ?? undefined,
  startTime: payload.startTime ?? payload.start_time,
  endTime: payload.endTime ?? payload.end_time ?? undefined,
  durationMinutes: payload.durationMinutes ?? payload.duration_minutes ?? undefined,
  status: payload.status,
  leadScore: payload.leadScore ?? payload.lead_score ?? 0,
  leadQuality: payload.leadQuality ?? payload.lead_quality ?? "cold",
  budget: payload.budget ?? undefined,
  propertyType: payload.propertyType ?? payload.property_type ?? undefined,
  preferredArea: payload.preferredArea ?? payload.preferred_area ?? undefined,
  intent: payload.intent ?? undefined,
  assignedAgentId: payload.assignedAgentId ?? payload.assigned_agent_id ?? undefined,
  assignedAgent: payload.assignedAgent ?? undefined,
  tags: payload.tags ?? [],
  notes: payload.notes ?? undefined,
  conversationSummary: payload.conversationSummary ?? payload.conversation_summary ?? undefined,
  followUpDate: payload.followUpDate ?? payload.follow_up_date ?? undefined,
  outcome: payload.outcome ?? undefined,
  conversionValue: payload.conversionValue ?? payload.conversion_value ?? undefined,
  messages: Array.isArray(payload.messages) ? payload.messages.map(mapMessage) : [],
  lastMessage: payload.lastMessage ? mapMessage(payload.lastMessage) : undefined,
  lastMessageSnippet: payload.lastMessageSnippet ?? payload.last_message_snippet ?? undefined,
  lastMessageAt: payload.lastMessageAt ?? payload.last_message_at ?? undefined,
  unreadCount: payload.unreadCount ?? payload.unread_count ?? undefined,
  leadScoreBreakdown: payload.leadScoreBreakdown ?? payload.lead_score_breakdown ?? undefined,
});

const mapFollowUpTask = (payload: any): FollowUpTask => ({
  id: payload.id,
  conversationId: payload.conversationId ?? payload.conversation_id,
  followUpDate: payload.followUpDate ?? payload.follow_up_date,
  reminderType: payload.reminderType ?? payload.reminder_type,
  reminderText: payload.reminderText ?? payload.reminder_text ?? "",
  priority: payload.priority ?? "high",
  assignedAgentId: payload.assignedAgentId ?? payload.assigned_agent_id ?? "",
  status: payload.status ?? "scheduled",
});

const mapAnalyticsSnapshot = (payload: any): AnalyticsSnapshot => ({
  totalConversations: payload.totalConversations ?? 0,
  hotLeads: payload.hotLeads ?? 0,
  warmLeads: payload.warmLeads ?? 0,
  coldLeads: payload.coldLeads ?? 0,
  conversionRate: payload.conversionRate ?? 0,
  averageDuration: payload.averageDuration ?? 0,
  averageResponseTime: payload.averageResponseTime ?? 0,
  satisfactionScore: payload.satisfactionScore ?? 0,
  leadSourceBreakdown: payload.leadSourceBreakdown ?? [],
  conversationVolumeTrend: payload.conversationVolumeTrend ?? [],
  leadQualityDistribution: payload.leadQualityDistribution ?? [],
  conversionFunnel:
    payload.conversionFunnel ?? [
      { stage: "New", value: payload.totalConversations ?? 0 },
      { stage: "Qualified", value: payload.hotLeads ?? 0 },
      { stage: "Won", value: payload.conversionRate ?? 0 },
    ],
  agentPerformance: payload.agentPerformance ?? [],
  peakHours: payload.peakHours ?? [],
});

const mapConversationSummaryRecord = (payload: any): ConversationSummary => ({
  id: payload.id,
  conversationId: payload.conversation_id,
  durationMinutes: payload.duration_minutes ?? 0,
  totalMessages: payload.total_messages ?? 0,
  customerIntent: (payload.customer_intent ?? "buy") as IntentType,
  preferredArea: payload.preferred_area ?? "",
  budget: payload.budget ?? "",
  propertyType: payload.property_type ?? "",
  actionsTaken: payload.actions_taken ?? [],
  missingSteps: payload.missing_steps ?? [],
  suggestedFollowUp: payload.suggested_follow_up ?? "",
  leadScoreBreakdown: payload.lead_score_breakdown ?? {
    intent: 0,
    engagement: 0,
    actions: 0,
    contactInfo: 0,
    total: 0,
    quality: "cold",
  },
  generatedAt: payload.generated_at ?? payload.created_at,
});

const buildFilterParams = (filters?: SearchFilters) => {
  const params = new URLSearchParams();
  if (!filters) return params;

  if (filters.query) params.set("query", filters.query);
  filters.status?.forEach((status) => params.append("status", status));
  filters.leadQuality?.forEach((quality) => params.append("leadQuality", quality));
  filters.intent?.forEach((intent) => params.append("intent", intent));
  filters.areas?.forEach((area) => params.append("areas", area));
  filters.assignedAgentIds?.forEach((id) => params.append("assignedAgentIds", id));
  filters.tags?.forEach((tag) => params.append("tags", tag));
  filters.followUpStatus?.forEach((status) => params.append("followUpStatus", status));
  if (filters.scoreRange) params.set("scoreRange", `${filters.scoreRange[0]}:${filters.scoreRange[1]}`);
  if (filters.dateRange) {
    params.set("dateFrom", filters.dateRange.from);
    params.set("dateTo", filters.dateRange.to);
  }
  if (filters.sort) params.set("sort", filters.sort);
  return params;
};

const buildUrl = (path: string, params?: URLSearchParams) => {
  const queryString = params && Array.from(params.keys()).length ? `?${params.toString()}` : "";
  return `${API_BASE_URL}${path}${queryString}`;
};

const applySupabaseFilters = (query: any, filters?: SearchFilters) => {
  if (!filters) return query;

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
    query = query.or(
      `customer_name.ilike.%${filters.query}%,customer_phone.ilike.%${filters.query}%,customer_email.ilike.%${filters.query}%,tags.cs.{${filters.query}}`
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
      query = query.order("follow_up_date", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  return query;
};

const fetchConversationsFromSupabase = async (filters?: SearchFilters, page = 1, limit = 25) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("conversations")
    .select("*, chat_messages(*), lead_tags(*), assigned_agent:agents(*)", { count: "exact" })
    .range(from, to);

  query = applySupabaseFilters(query, filters);
  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data?.map(mapConversation) ?? [],
    total: count ?? 0,
  };
};

const fetchConversationByIdFromSupabase = async (id: string) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, chat_messages(*), lead_tags(*), assigned_agent:agents(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return mapConversation(data);
};

const scheduleFollowUpViaSupabase = async (
  id: string,
  task: Omit<FollowUpTask, "id" | "status"> & { notifyCustomer?: boolean }
) => {
  const { notifyCustomer, ...record } = task;
  // Note: follow_up_tasks table may not exist - this is a planned feature
  // Using type assertion to bypass TypeScript error for now
  const { data, error } = await (supabase as any)
    .from("follow_up_tasks")
    .insert({
      conversation_id: id,
      follow_up_date: record.followUpDate,
      reminder_type: record.reminderType,
      reminder_text: record.reminderText,
      priority: record.priority,
      assigned_agent_id: record.assignedAgentId,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) throw error;
  return mapFollowUpTask(data);
};

const fetchAnalyticsFromSupabase = async (params?: { range?: { from: string; to: string } }) => {
  // Note: fetch_conversation_analytics RPC may not exist - return default analytics
  // Using type assertion to bypass TypeScript error
  try {
    const { data, error } = await (supabase as any).rpc("fetch_conversation_analytics", {
      date_from: params?.range?.from,
      date_to: params?.range?.to,
    });

    if (error) throw error;
    return mapAnalyticsSnapshot(data);
  } catch {
    // Return default analytics if RPC doesn't exist
    return mapAnalyticsSnapshot({});
  }
};

const searchConversationsViaSupabase = async (query: string, filters?: SearchFilters) => {
  let supabaseQuery = supabase.from("conversations").select("*, chat_messages(*)").limit(50);
  supabaseQuery = applySupabaseFilters(supabaseQuery, { ...filters, query });
  const { data, error } = await supabaseQuery;
  if (error) throw error;
  return (data ?? []).map(mapConversation);
};

export const adminConversationsApi = {
  async fetchConversations(filters?: SearchFilters, page = 1, limit = 25) {
    if (hasAdminApi) {
      try {
        const params = buildFilterParams(filters);
        params.set("page", String(page));
        params.set("limit", String(limit));

        const response = await fetch(buildUrl("/admin/conversations", params), {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const payload = await response.json();
        return {
          data: (payload.data ?? []).map(mapConversation),
          total: payload.total ?? 0,
        };
      } catch (error) {
        console.warn("Falling back to Supabase conversations query", error);
      }
    }

    return fetchConversationsFromSupabase(filters, page, limit);
  },

  async fetchConversationById(id: string) {
    if (hasAdminApi) {
      try {
        const response = await fetch(buildUrl(`/admin/conversations/${id}`), {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch conversation");
        }
        return mapConversation(await response.json());
      } catch (error) {
        console.warn("Falling back to Supabase conversation fetch", error);
      }
    }

    return fetchConversationByIdFromSupabase(id);
  },

  async updateConversation(id: string, payload: Partial<Conversation>) {
    const { error } = await supabase
      .from("conversations")
      .update({
        assigned_agent_id: payload.assignedAgentId,
        status: payload.status,
        notes: payload.notes,
        tags: payload.tags,
        follow_up_date: payload.followUpDate,
        conversation_summary: payload.conversationSummary,
      })
      .eq("id", id);

    if (error) throw error;
  },

  async scheduleFollowUp(id: string, task: Omit<FollowUpTask, "id" | "status"> & { notifyCustomer?: boolean }) {
    if (hasAdminApi) {
      try {
        const response = await fetch(buildUrl(`/admin/conversations/${id}/follow-ups`), {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(task),
        });

        if (!response.ok) {
          throw new Error("Failed to schedule follow-up");
        }

        return mapFollowUpTask(await response.json());
      } catch (error) {
        console.warn("Falling back to Supabase follow-up insertion", error);
      }
    }

    return scheduleFollowUpViaSupabase(id, task);
  },

  async fetchConversationSummary(id: string) {
    // Note: conversation_summaries table may not exist - this is a planned feature
    // Using type assertion to bypass TypeScript error
    try {
      const { data, error } = await (supabase as any)
        .from("conversation_summaries")
        .select("*")
        .eq("conversation_id", id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return mapConversationSummaryRecord(data);
    } catch {
      // Return default summary if table doesn't exist
      return mapConversationSummaryRecord({ id, conversation_id: id });
    }
  },

  async fetchAnalytics(params?: { range?: { from: string; to: string } }) {
    if (hasAdminApi) {
      try {
        const query = new URLSearchParams();
        if (params?.range?.from) query.set("from", params.range.from);
        if (params?.range?.to) query.set("to", params.range.to);

        const response = await fetch(buildUrl("/admin/analytics", query), {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        return mapAnalyticsSnapshot(await response.json());
      } catch (error) {
        console.warn("Falling back to Supabase analytics RPC", error);
      }
    }

    return fetchAnalyticsFromSupabase(params);
  },

  async exportConversations(payload: { format: "pdf" | "csv" | "xlsx"; filters?: SearchFilters }) {
    // Fetch all conversations matching the filters (no pagination for export)
    const { data: conversations } = await this.fetchConversations(payload.filters, 1, 10000);
    
    // Dynamically import export utilities
    const { exportConversationsToExcel, exportConversationsToCSV, exportConversationsToPDF } = await import('@/lib/exportUtils');
    
    // Export based on format
    switch (payload.format) {
      case 'xlsx':
        exportConversationsToExcel(conversations, 'conversations');
        break;
      case 'csv':
        exportConversationsToCSV(conversations, 'conversations');
        break;
      case 'pdf':
        await exportConversationsToPDF(conversations, 'conversations');
        break;
      default:
        throw new Error(`Unsupported export format: ${payload.format}`);
    }
    
    // Return empty blob for compatibility (actual download happens in export functions)
    return new Blob();
  },

  async searchConversations(query: string, filters?: SearchFilters) {
    if (hasAdminApi) {
      try {
        const params = new URLSearchParams({ query });
        if (filters) {
          params.set("filters", JSON.stringify(filters));
        }
        const response = await fetch(buildUrl("/admin/search", params), {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Search failed");
        }
        return ((await response.json()) as any[]).map(mapConversation);
      } catch (error) {
        console.warn("Falling back to Supabase search", error);
      }
    }

    return searchConversationsViaSupabase(query, filters);
  },

  subscribeToRealtime(onInsert: (conversation: Conversation) => void, onUpdate: (conversation: Conversation) => void) {
    const channel = supabase
      .channel("admin-conversation-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => onInsert(mapConversation(payload.new))
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => onUpdate(mapConversation(payload.new))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToNotifications(callback: (notification: NotificationItem) => void) {
    const channel = supabase
      .channel("conversation-notifications")
      .on("broadcast", { event: "admin_alert" }, ({ payload }) => callback(payload as NotificationItem))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async bulkDeleteConversations(ids: string[]) {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .in("id", ids);

    if (error) throw error;
  },

  async bulkUpdateConversations(ids: string[], updates: Partial<Conversation>) {
    const updatePayload: any = {};
    
    if (updates.status) updatePayload.status = updates.status;
    if (updates.leadQuality) updatePayload.lead_quality = updates.leadQuality;
    if (updates.assignedAgentId) updatePayload.assigned_agent_id = updates.assignedAgentId;
    if (updates.tags) updatePayload.tags = updates.tags;
    
    // For notes, append to existing notes instead of replacing
    if (updates.notes) {
      // Fetch existing conversations to append notes
      const { data: existingConvos } = await supabase
        .from("conversations")
        .select("id, notes")
        .in("id", ids);

      if (existingConvos) {
        // Update each conversation individually to append notes
        const updatePromises = existingConvos.map(convo => {
          const existingNotes = convo.notes || "";
          const newNotes = existingNotes 
            ? `${existingNotes}\n\n[Bulk Update ${new Date().toLocaleString()}]\n${updates.notes}`
            : `[Bulk Update ${new Date().toLocaleString()}]\n${updates.notes}`;
          
          return supabase
            .from("conversations")
            .update({ ...updatePayload, notes: newNotes })
            .eq("id", convo.id);
        });

        const results = await Promise.all(updatePromises);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) throw errors[0].error;
        return;
      }
    }

    // If no notes update, do a simple bulk update
    const { error } = await supabase
      .from("conversations")
      .update(updatePayload)
      .in("id", ids);

    if (error) throw error;
  },
};
