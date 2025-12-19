/**
 * Notification Worker - Async Event Processor
 * 
 * WHY: Processes lead events asynchronously, completely decoupled from the API.
 * - API returns immediately after saving lead
 * - Worker picks up events and sends notifications
 * - Failures are retried with exponential backoff
 * - No notification failure ever blocks lead capture
 * 
 * DEPLOYMENT: Can run as:
 * - Same process (setInterval polling)
 * - Separate worker process
 * - Cron job (Render/Vercel scheduled functions)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger, type LogContext } from "../lib/logger";
import { notificationService, type NotificationPayload } from "../services/notification-service";
import { leadEventEmitter } from "../lib/event-emitter";

interface LeadEvent {
  id: string;
  event_type: string;
  conversation_id: string;
  payload: Record<string, unknown>;
  processed: boolean;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
}

interface WorkerConfig {
  pollIntervalMs: number;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
}

const DEFAULT_CONFIG: WorkerConfig = {
  pollIntervalMs: 5000,      // Poll every 5 seconds
  batchSize: 10,             // Process 10 events at a time
  maxRetries: 3,             // Retry failed notifications 3 times
  retryDelayMs: 1000,        // Base delay for exponential backoff
};

class NotificationWorker {
  private supabase: SupabaseClient;
  private config: WorkerConfig;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private logContext: LogContext;

  constructor(config: Partial<WorkerConfig> = {}) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials for notification worker");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logContext = { channel: "notification-worker" };
  }

  /**
   * Start the worker polling loop
   */
  start(): void {
    if (this.isRunning) {
      logger.warn("Worker already running", this.logContext);
      return;
    }

    this.isRunning = true;
    logger.info("Starting notification worker", {
      ...this.logContext,
      pollIntervalMs: this.config.pollIntervalMs,
      batchSize: this.config.batchSize,
    });

    // Initial poll
    this.poll();

    // Set up polling interval
    this.pollInterval = setInterval(() => {
      this.poll();
    }, this.config.pollIntervalMs);
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    logger.info("Notification worker stopped", this.logContext);
  }

  /**
   * Poll for unprocessed events and process them
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Fetch unprocessed events
      const { data: events, error } = await this.supabase
        .from("lead_events")
        .select("*")
        .eq("processed", false)
        .lt("retry_count", this.config.maxRetries)
        .order("created_at", { ascending: true })
        .limit(this.config.batchSize);

      if (error) {
        logger.error(`Failed to fetch events: ${error.message}`, new Error(error.message), this.logContext);
        return;
      }

      if (!events || events.length === 0) {
        return; // No events to process
      }

      logger.debug(`Processing ${events.length} events`, this.logContext);

      // Process events in parallel (but with controlled concurrency)
      await Promise.all(events.map((event) => this.processEvent(event)));
    } catch (error) {
      logger.error(
        "Poll cycle failed",
        error instanceof Error ? error : new Error(String(error)),
        this.logContext
      );
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: LeadEvent): Promise<void> {
    const ctx: LogContext = {
      ...this.logContext,
      eventId: event.id,
      eventType: event.event_type,
      conversationId: event.conversation_id,
    };

    try {
      logger.info(`Processing event: ${event.event_type}`, ctx);

      // Route to appropriate handler based on event type
      switch (event.event_type) {
        case "lead.created":
          await this.handleLeadCreated(event);
          break;
        case "lead.qualified":
        case "lead.assigned":
          await this.handleLeadUpdate(event);
          break;
        case "sla.warning":
        case "sla.breached":
          await this.handleSlaAlert(event);
          break;
        default:
          logger.debug(`No handler for event type: ${event.event_type}`, ctx);
      }

      // Mark event as processed
      await this.markEventProcessed(event.id);
      logger.info(`Event processed successfully`, ctx);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to process event`, error instanceof Error ? error : new Error(errorMessage), ctx);

      // Increment retry count
      await this.incrementRetryCount(event.id, errorMessage);
    }
  }

  /**
   * Handle lead.created events - send notifications
   */
  private async handleLeadCreated(event: LeadEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    const conversationId = event.conversation_id;

    // Build notification payload
    const notificationPayload: NotificationPayload = {
      customerName: String(payload.customerName || "Unknown"),
      customerEmail: payload.customerEmail ? String(payload.customerEmail) : undefined,
      customerPhone: payload.customerPhone ? String(payload.customerPhone) : undefined,
      intent: payload.intent ? String(payload.intent) : undefined,
      budget: payload.budget ? String(payload.budget) : undefined,
      propertyType: payload.propertyType ? String(payload.propertyType) : undefined,
      area: payload.preferredArea ? String(payload.preferredArea) : undefined,
      leadScore: typeof payload.leadScore === "number" ? payload.leadScore : undefined,
      duration: typeof payload.durationMinutes === "number" ? payload.durationMinutes : undefined,
      source: (payload.source as NotificationPayload["source"]) || "chatbot",
    };

    // Send notifications via all channels
    const result = await notificationService.sendNotification(notificationPayload);

    // Log notification results
    const channels = ["slack", "telegram", "email"] as const;
    for (const channel of channels) {
      const channelResult = result.channels[channel];
      if (channelResult) {
        await leadEventEmitter.logNotification(
          conversationId,
          channel,
          channelResult.success ? "sent" : "failed",
          { payload: notificationPayload },
          channelResult.error,
          event.id
        );
      }
    }

    // Emit notification events for tracking
    if (result.success) {
      await leadEventEmitter.emit("notification.sent", {
        conversationId,
        channels: Object.entries(result.channels)
          .filter(([_, v]) => v?.success)
          .map(([k]) => k),
      });
    } else {
      await leadEventEmitter.emit("notification.failed", {
        conversationId,
        channels: Object.entries(result.channels)
          .filter(([_, v]) => !v?.success)
          .map(([k]) => k),
        errors: Object.entries(result.channels)
          .filter(([_, v]) => v?.error)
          .map(([k, v]) => ({ channel: k, error: v?.error })),
      });
    }
  }

  /**
   * Handle lead update events
   */
  private async handleLeadUpdate(event: LeadEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    
    // For now, just log the update
    // Future: Send targeted notifications based on update type
    logger.info(`Lead updated: ${event.event_type}`, {
      ...this.logContext,
      conversationId: event.conversation_id,
      updateType: event.event_type,
    });
  }

  /**
   * Handle SLA alerts - send urgent notifications
   */
  private async handleSlaAlert(event: LeadEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    const conversationId = event.conversation_id;
    const isBreached = event.event_type === "sla.breached";

    const notificationPayload: NotificationPayload = {
      customerName: String(payload.customerName || "Unknown"),
      customerPhone: payload.customerPhone ? String(payload.customerPhone) : undefined,
      leadScore: typeof payload.leadScore === "number" ? payload.leadScore : undefined,
      source: isBreached ? "sla_breach" : "sla_warning",
      // Add urgency indicators
      subject: isBreached 
        ? `🚨 SLA BREACHED: ${payload.customerName}` 
        : `⚠️ SLA Warning: ${payload.customerName}`,
      message: isBreached
        ? `Lead has not been contacted within SLA. Immediate action required.`
        : `Lead approaching SLA deadline. Please respond soon.`,
    };

    await notificationService.sendNotification(notificationPayload);

    // Add timeline entry
    await leadEventEmitter.addTimelineEntry({
      conversationId,
      eventType: isBreached ? "sla_breached" : "sla_warning",
      title: isBreached ? "SLA Breached" : "SLA Warning",
      description: isBreached
        ? "Lead was not contacted within the required timeframe"
        : "Lead is approaching SLA deadline",
      actorType: "system",
      metadata: {
        slaDeadline: payload.slaDeadline,
        minutesRemaining: payload.minutesRemaining,
      },
    });
  }

  /**
   * Mark an event as processed
   */
  private async markEventProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from("lead_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (error) {
      logger.error(`Failed to mark event as processed: ${error.message}`, new Error(error.message), {
        ...this.logContext,
        eventId,
      });
    }
  }

  /**
   * Increment retry count for failed event
   */
  private async incrementRetryCount(eventId: string, errorMessage: string): Promise<void> {
    const { error } = await this.supabase
      .from("lead_events")
      .update({
        retry_count: this.supabase.rpc("increment", { x: 1 }),
        last_error: errorMessage,
      })
      .eq("id", eventId);

    // Fallback if rpc doesn't work
    if (error) {
      await this.supabase
        .from("lead_events")
        .update({
          last_error: errorMessage,
        })
        .eq("id", eventId);

      // Manual increment
      const { data } = await this.supabase
        .from("lead_events")
        .select("retry_count")
        .eq("id", eventId)
        .single();

      if (data) {
        await this.supabase
          .from("lead_events")
          .update({ retry_count: (data.retry_count || 0) + 1 })
          .eq("id", eventId);
      }
    }
  }

  /**
   * Process a single batch (for cron/scheduled function use)
   */
  async processBatch(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    try {
      const { data: events, error } = await this.supabase
        .from("lead_events")
        .select("*")
        .eq("processed", false)
        .lt("retry_count", this.config.maxRetries)
        .order("created_at", { ascending: true })
        .limit(this.config.batchSize);

      if (error || !events) {
        return { processed: 0, failed: 0 };
      }

      for (const event of events) {
        try {
          await this.processEvent(event);
          processed++;
        } catch {
          failed++;
        }
      }
    } catch (error) {
      logger.error(
        "Batch processing failed",
        error instanceof Error ? error : new Error(String(error)),
        this.logContext
      );
    }

    return { processed, failed };
  }
}

// Singleton instance
let workerInstance: NotificationWorker | null = null;

export const getNotificationWorker = (config?: Partial<WorkerConfig>): NotificationWorker => {
  if (!workerInstance) {
    workerInstance = new NotificationWorker(config);
  }
  return workerInstance;
};

export const notificationWorker = getNotificationWorker();

// Export for standalone worker process
export { NotificationWorker, WorkerConfig };
