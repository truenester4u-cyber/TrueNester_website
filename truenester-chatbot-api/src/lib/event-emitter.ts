/**
 * Event Emitter Layer for Lead Lifecycle Events
 * 
 * WHY: Decouples lead capture from notification delivery.
 * - API saves lead → emits event → returns immediately
 * - Workers process events asynchronously
 * - If notifications fail, lead is never lost
 * - Events can be replayed for debugging/recovery
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger, type LogContext } from "./logger";
import { randomUUID } from "node:crypto";

// Event types matching the database enum
export type LeadEventType =
  | "lead.created"
  | "lead.updated"
  | "lead.qualified"
  | "lead.assigned"
  | "lead.contacted"
  | "lead.follow_up_scheduled"
  | "lead.follow_up_completed"
  | "lead.converted"
  | "lead.lost"
  | "notification.sent"
  | "notification.failed"
  | "notification.delivered"
  | "sla.warning"
  | "sla.breached";

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

export interface LeadEventPayload {
  conversationId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  intent?: string;
  budget?: string;
  propertyType?: string;
  preferredArea?: string;
  leadScore?: number;
  leadQuality?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TimelineEntry {
  conversationId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  actorType?: "system" | "agent" | "customer" | "bot";
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
}

export interface EmittedEvent {
  id: string;
  eventType: LeadEventType;
  conversationId: string;
  payload: LeadEventPayload;
  idempotencyKey?: string;
  createdAt: string;
}

class LeadEventEmitter {
  private supabase: SupabaseClient;
  private logContext: LogContext;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials for event emitter");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    this.logContext = { channel: "event-emitter" };
  }

  /**
   * Emit a lead lifecycle event
   * This is non-blocking - the event is saved to the database
   * and will be processed asynchronously by workers
   */
  async emit(
    eventType: LeadEventType,
    payload: LeadEventPayload,
    idempotencyKey?: string
  ): Promise<EmittedEvent | null> {
    const requestId = randomUUID();
    const ctx: LogContext = {
      ...this.logContext,
      requestId,
      eventType,
      conversationId: payload.conversationId,
    };

    try {
      logger.info(`Emitting event: ${eventType}`, ctx);

      // Check for duplicate if idempotency key provided
      if (idempotencyKey) {
        const { data: existing } = await this.supabase
          .from("lead_events")
          .select("id, event_type, conversation_id, payload, created_at")
          .eq("idempotency_key", idempotencyKey)
          .single();

        if (existing) {
          logger.info(`Duplicate event detected, returning existing`, {
            ...ctx,
            existingEventId: existing.id,
          });
          return {
            id: existing.id,
            eventType: existing.event_type,
            conversationId: existing.conversation_id,
            payload: existing.payload,
            idempotencyKey,
            createdAt: existing.created_at,
          };
        }
      }

      // Insert new event
      const { data, error } = await this.supabase
        .from("lead_events")
        .insert({
          event_type: eventType,
          conversation_id: payload.conversationId,
          payload,
          idempotency_key: idempotencyKey || null,
          processed: false,
          retry_count: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error(`Failed to emit event: ${error.message}`, new Error(error.message), ctx);
        return null;
      }

      logger.info(`Event emitted successfully`, { ...ctx, eventId: data.id });

      return {
        id: data.id,
        eventType: data.event_type,
        conversationId: data.conversation_id,
        payload: data.payload,
        idempotencyKey: data.idempotency_key,
        createdAt: data.created_at,
      };
    } catch (error) {
      logger.error(
        `Exception emitting event`,
        error instanceof Error ? error : new Error(String(error)),
        ctx
      );
      return null;
    }
  }

  /**
   * Add an entry to the conversation timeline
   * This provides visibility in the admin panel
   */
  async addTimelineEntry(entry: TimelineEntry): Promise<string | null> {
    const ctx: LogContext = {
      ...this.logContext,
      conversationId: entry.conversationId,
      eventType: entry.eventType,
    };

    try {
      const { data, error } = await this.supabase
        .from("conversation_timeline")
        .insert({
          conversation_id: entry.conversationId,
          event_type: entry.eventType,
          title: entry.title,
          description: entry.description || null,
          actor_type: entry.actorType || "system",
          actor_id: entry.actorId || null,
          actor_name: entry.actorName || null,
          metadata: entry.metadata || {},
        })
        .select("id")
        .single();

      if (error) {
        logger.error(`Failed to add timeline entry: ${error.message}`, new Error(error.message), ctx);
        return null;
      }

      logger.debug(`Timeline entry added`, { ...ctx, entryId: data.id });
      return data.id;
    } catch (error) {
      logger.error(
        `Exception adding timeline entry`,
        error instanceof Error ? error : new Error(String(error)),
        ctx
      );
      return null;
    }
  }

  /**
   * Convenience method: Emit lead.created and add timeline entry
   */
  async emitLeadCreated(
    payload: LeadEventPayload,
    idempotencyKey?: string
  ): Promise<EmittedEvent | null> {
    const event = await this.emit("lead.created", payload, idempotencyKey);

    if (event) {
      await this.addTimelineEntry({
        conversationId: payload.conversationId,
        eventType: "created",
        title: "Lead Created",
        description: `New lead from ${payload.source || "website"}`,
        actorType: "system",
        metadata: {
          customerName: payload.customerName,
          leadScore: payload.leadScore,
          leadQuality: payload.leadQuality,
          intent: payload.intent,
        },
      });
    }

    return event;
  }

  /**
   * Log notification attempt to database
   */
  async logNotification(
    conversationId: string,
    channel: "slack" | "email" | "telegram" | "whatsapp" | "sms" | "push" | "webhook",
    status: "pending" | "sent" | "delivered" | "failed",
    payload: Record<string, unknown>,
    errorMessage?: string,
    leadEventId?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from("notification_logs")
        .insert({
          lead_event_id: leadEventId || null,
          conversation_id: conversationId,
          channel,
          status,
          payload,
          error_message: errorMessage || null,
          sent_at: status === "sent" || status === "delivered" ? new Date().toISOString() : null,
          delivered_at: status === "delivered" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (error) {
        logger.error(`Failed to log notification: ${error.message}`, new Error(error.message), {
          conversationId,
          channel,
        });
        return null;
      }

      // Add timeline entry for notification
      if (status === "sent" || status === "delivered") {
        await this.addTimelineEntry({
          conversationId,
          eventType: "notification_sent",
          title: `${channel.charAt(0).toUpperCase() + channel.slice(1)} Notification Sent`,
          description: status === "delivered" ? "Delivered successfully" : "Sent",
          actorType: "system",
          metadata: { channel, status },
        });
      }

      return data.id;
    } catch (error) {
      logger.error(
        `Exception logging notification`,
        error instanceof Error ? error : new Error(String(error)),
        { conversationId, channel }
      );
      return null;
    }
  }
}

// Singleton instance
let eventEmitterInstance: LeadEventEmitter | null = null;

export const getEventEmitter = (): LeadEventEmitter => {
  if (!eventEmitterInstance) {
    eventEmitterInstance = new LeadEventEmitter();
  }
  return eventEmitterInstance;
};

export const leadEventEmitter = getEventEmitter();
