/**
 * Admin Timeline & SLA Integration
 * 
 * WHY: Provides visibility into lead lifecycle in the admin panel.
 * - Shows all actions taken on a conversation
 * - Tracks notification delivery status
 * - Monitors SLA compliance
 * - Real-time updates via Supabase subscriptions
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export type TimelineEventType =
  | "created"
  | "status_changed"
  | "assigned"
  | "note_added"
  | "follow_up_scheduled"
  | "follow_up_completed"
  | "notification_sent"
  | "customer_contacted"
  | "property_viewed"
  | "document_shared"
  | "meeting_scheduled"
  | "call_logged"
  | "email_sent"
  | "sla_warning"
  | "sla_breached";

export interface TimelineEntry {
  id: string;
  conversationId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  actorType: "system" | "agent" | "customer" | "bot";
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FollowUpTask {
  id: string;
  conversationId: string;
  assignedAgentId?: string;
  followUpDate: string;
  reminderType: string;
  reminderText?: string;
  priority: "high" | "medium" | "low";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "overdue";
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  slaDeadline?: string;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  leadEventId?: string;
  conversationId: string;
  channel: "slack" | "email" | "telegram" | "whatsapp" | "sms" | "push" | "webhook";
  recipient?: string;
  subject?: string;
  status: "pending" | "sent" | "delivered" | "failed";
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  retryCount: number;
  createdAt: string;
}

export interface SLABreachCandidate {
  conversationId: string;
  customerName: string;
  leadQuality: string;
  createdAt: string;
  slaDeadline: string;
  minutesRemaining: number;
}

// ============================================================================
// MAPPERS
// ============================================================================

const mapTimelineEntry = (row: any): TimelineEntry => ({
  id: row.id,
  conversationId: row.conversation_id,
  eventType: row.event_type,
  title: row.title,
  description: row.description || undefined,
  actorType: row.actor_type,
  actorId: row.actor_id || undefined,
  actorName: row.actor_name || undefined,
  metadata: row.metadata || undefined,
  createdAt: row.created_at,
});

const mapFollowUpTask = (row: any): FollowUpTask => ({
  id: row.id,
  conversationId: row.conversation_id,
  assignedAgentId: row.assigned_agent_id || undefined,
  followUpDate: row.follow_up_date,
  reminderType: row.reminder_type,
  reminderText: row.reminder_text || undefined,
  priority: row.priority,
  status: row.status,
  completedAt: row.completed_at || undefined,
  completedBy: row.completed_by || undefined,
  notes: row.notes || undefined,
  slaDeadline: row.sla_deadline || undefined,
  slaBreached: row.sla_breached,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapNotificationLog = (row: any): NotificationLog => ({
  id: row.id,
  leadEventId: row.lead_event_id || undefined,
  conversationId: row.conversation_id,
  channel: row.channel,
  recipient: row.recipient || undefined,
  subject: row.subject || undefined,
  status: row.status,
  errorMessage: row.error_message || undefined,
  sentAt: row.sent_at || undefined,
  deliveredAt: row.delivered_at || undefined,
  retryCount: row.retry_count,
  createdAt: row.created_at,
});

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const adminTimelineApi = {
  /**
   * Get timeline entries for a conversation
   */
  async getTimeline(conversationId: string, limit = 50): Promise<TimelineEntry[]> {
    const { data, error } = await supabase
      .from("conversation_timeline")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch timeline:", error);
      return [];
    }

    return (data || []).map(mapTimelineEntry);
  },

  /**
   * Get follow-up tasks for a conversation
   */
  async getFollowUpTasks(conversationId: string): Promise<FollowUpTask[]> {
    const { data, error } = await supabase
      .from("follow_up_tasks")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("follow_up_date", { ascending: true });

    if (error) {
      console.error("Failed to fetch follow-up tasks:", error);
      return [];
    }

    return (data || []).map(mapFollowUpTask);
  },

  /**
   * Get all pending/overdue follow-up tasks
   */
  async getPendingFollowUps(): Promise<FollowUpTask[]> {
    const { data, error } = await supabase
      .from("follow_up_tasks")
      .select("*")
      .in("status", ["scheduled", "overdue"])
      .order("follow_up_date", { ascending: true });

    if (error) {
      console.error("Failed to fetch pending follow-ups:", error);
      return [];
    }

    return (data || []).map(mapFollowUpTask);
  },

  /**
   * Get notification logs for a conversation
   */
  async getNotificationLogs(conversationId: string): Promise<NotificationLog[]> {
    const { data, error } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch notification logs:", error);
      return [];
    }

    return (data || []).map(mapNotificationLog);
  },

  /**
   * Create a follow-up task
   */
  async createFollowUp(task: Omit<FollowUpTask, "id" | "createdAt" | "updatedAt" | "slaBreached">): Promise<FollowUpTask | null> {
    const { data, error } = await supabase
      .from("follow_up_tasks")
      .insert({
        conversation_id: task.conversationId,
        assigned_agent_id: task.assignedAgentId || null,
        follow_up_date: task.followUpDate,
        reminder_type: task.reminderType,
        reminder_text: task.reminderText || null,
        priority: task.priority,
        status: task.status,
        sla_deadline: task.slaDeadline || null,
        notes: task.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create follow-up:", error);
      return null;
    }

    return mapFollowUpTask(data);
  },

  /**
   * Update follow-up task status
   */
  async updateFollowUpStatus(
    taskId: string,
    status: FollowUpTask["status"],
    completedBy?: string
  ): Promise<boolean> {
    const updates: Record<string, unknown> = { status };
    
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
      if (completedBy) updates.completed_by = completedBy;
    }

    const { error } = await supabase
      .from("follow_up_tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      console.error("Failed to update follow-up status:", error);
      return false;
    }

    return true;
  },

  /**
   * Get SLA breach candidates (leads approaching or past deadline)
   */
  async getSLABreachCandidates(warningMinutes = 30): Promise<SLABreachCandidate[]> {
    const { data, error } = await supabase.rpc("get_sla_breach_candidates", {
      p_warning_minutes: warningMinutes,
    });

    if (error) {
      console.error("Failed to fetch SLA breach candidates:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      conversationId: row.conversation_id,
      customerName: row.customer_name,
      leadQuality: row.lead_quality,
      createdAt: row.created_at,
      slaDeadline: row.sla_deadline,
      minutesRemaining: row.minutes_remaining,
    }));
  },

  /**
   * Add a timeline entry manually (for agent actions)
   */
  async addTimelineEntry(entry: Omit<TimelineEntry, "id" | "createdAt">): Promise<TimelineEntry | null> {
    const { data, error } = await supabase
      .from("conversation_timeline")
      .insert({
        conversation_id: entry.conversationId,
        event_type: entry.eventType,
        title: entry.title,
        description: entry.description || null,
        actor_type: entry.actorType,
        actor_id: entry.actorId || null,
        actor_name: entry.actorName || null,
        metadata: entry.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add timeline entry:", error);
      return null;
    }

    return mapTimelineEntry(data);
  },

  /**
   * Subscribe to timeline updates for a conversation
   */
  subscribeToTimeline(
    conversationId: string,
    onInsert: (entry: TimelineEntry) => void
  ): () => void {
    const channel = supabase
      .channel(`timeline-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_timeline",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onInsert(mapTimelineEntry(payload.new))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to follow-up task updates
   */
  subscribeToFollowUps(
    onUpdate: (task: FollowUpTask) => void
  ): () => void {
    const channel = supabase
      .channel("follow-up-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follow_up_tasks",
        },
        (payload) => {
          if (payload.new) {
            onUpdate(mapFollowUpTask(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to notification log updates for a conversation
   */
  subscribeToNotifications(
    conversationId: string,
    onInsert: (log: NotificationLog) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_logs",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onInsert(mapNotificationLog(payload.new))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export default adminTimelineApi;
