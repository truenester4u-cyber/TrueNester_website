-- ============================================================================
-- EVENT-DRIVEN LEAD ARCHITECTURE MIGRATION
-- Version: 1.0.0
-- Date: 2025-12-19
-- Description: Adds event-driven tables and enhancements for modern SaaS lead management
-- SAFE: All operations are additive - no existing tables are modified destructively
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE ENUM TYPES
-- ============================================================================

-- Event types for lead lifecycle
DO $$ BEGIN
  CREATE TYPE public.lead_event_type AS ENUM (
    'lead.created',
    'lead.updated',
    'lead.qualified',
    'lead.assigned',
    'lead.contacted',
    'lead.follow_up_scheduled',
    'lead.follow_up_completed',
    'lead.converted',
    'lead.lost',
    'notification.sent',
    'notification.failed',
    'notification.delivered',
    'sla.warning',
    'sla.breached'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Notification channel types
DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM (
    'slack',
    'email',
    'telegram',
    'whatsapp',
    'sms',
    'push',
    'webhook'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Timeline event types for conversation history
DO $$ BEGIN
  CREATE TYPE public.timeline_event_type AS ENUM (
    'created',
    'status_changed',
    'assigned',
    'note_added',
    'follow_up_scheduled',
    'follow_up_completed',
    'notification_sent',
    'customer_contacted',
    'property_viewed',
    'document_shared',
    'meeting_scheduled',
    'call_logged',
    'email_sent',
    'sla_warning',
    'sla_breached'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Follow-up task status
DO $$ BEGIN
  CREATE TYPE public.follow_up_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
    'overdue'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 2: CREATE NEW TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Table: lead_events
-- Purpose: Event sourcing table for async processing of lead lifecycle events
-- WHY: Decouples lead capture from notification delivery. If Slack/Email fails,
--      the lead is never lost. Events can be replayed for debugging/analytics.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.lead_event_type NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for efficient event processing
CREATE INDEX IF NOT EXISTS idx_lead_events_unprocessed 
  ON public.lead_events(processed, created_at) 
  WHERE processed = FALSE;

CREATE INDEX IF NOT EXISTS idx_lead_events_conversation 
  ON public.lead_events(conversation_id);

CREATE INDEX IF NOT EXISTS idx_lead_events_type 
  ON public.lead_events(event_type);

CREATE INDEX IF NOT EXISTS idx_lead_events_idempotency 
  ON public.lead_events(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Table: conversation_timeline
-- Purpose: Audit trail of all actions on a conversation for admin panel
-- WHY: Provides complete visibility into lead lifecycle. Admin can see exactly
--      what happened and when, including notification delivery status.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  event_type public.timeline_event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system', -- 'system', 'agent', 'customer', 'bot'
  actor_id TEXT,
  actor_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for timeline queries
CREATE INDEX IF NOT EXISTS idx_timeline_conversation 
  ON public.conversation_timeline(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_event_type 
  ON public.conversation_timeline(event_type);

-- -----------------------------------------------------------------------------
-- Table: follow_up_tasks
-- Purpose: Scheduled follow-up reminders with SLA tracking
-- WHY: Ensures no lead falls through the cracks. Enables SLA monitoring
--      and automated alerts when follow-ups are overdue.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  assigned_agent_id UUID,
  follow_up_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'email', -- 'email', 'sms', 'whatsapp', 'call'
  reminder_text TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  status public.follow_up_status NOT NULL DEFAULT 'scheduled',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  sla_deadline TIMESTAMP WITH TIME ZONE,
  sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for follow-up queries
CREATE INDEX IF NOT EXISTS idx_follow_up_conversation 
  ON public.follow_up_tasks(conversation_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_due 
  ON public.follow_up_tasks(follow_up_date, status) 
  WHERE status IN ('scheduled', 'overdue');

CREATE INDEX IF NOT EXISTS idx_follow_up_agent 
  ON public.follow_up_tasks(assigned_agent_id) 
  WHERE assigned_agent_id IS NOT NULL;

-- Add missing columns if they don't exist (for existing tables from partial migrations)
DO $$ BEGIN
  ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_follow_up_sla 
  ON public.follow_up_tasks(sla_deadline, sla_breached) 
  WHERE sla_breached = FALSE;

-- -----------------------------------------------------------------------------
-- Table: notification_logs
-- Purpose: Track all notification attempts and their delivery status
-- WHY: Provides visibility into notification delivery. Admin can see if
--      Slack/Email/Telegram notifications were sent successfully.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_event_id UUID REFERENCES public.lead_events(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  recipient TEXT,
  subject TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_conversation 
  ON public.notification_logs(conversation_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_status 
  ON public.notification_logs(status, created_at);

CREATE INDEX IF NOT EXISTS idx_notification_logs_channel 
  ON public.notification_logs(channel);

-- ============================================================================
-- PART 3: ENHANCE EXISTING CONVERSATIONS TABLE (ADDITIVE ONLY)
-- ============================================================================

-- Add metadata column for tracking attribution
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add idempotency_key to prevent duplicate submissions
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Add source tracking
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

-- Add SLA tracking fields
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS sla_response_deadline TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;

-- Add device/location info
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';

-- Create index for idempotency lookups
CREATE INDEX IF NOT EXISTS idx_conversations_idempotency 
  ON public.conversations(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Create index for SLA queries
CREATE INDEX IF NOT EXISTS idx_conversations_sla 
  ON public.conversations(sla_response_deadline, sla_breached) 
  WHERE sla_breached = FALSE AND first_response_at IS NULL;

-- Create index for source analytics
CREATE INDEX IF NOT EXISTS idx_conversations_source 
  ON public.conversations(source);

-- ============================================================================
-- PART 4: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to new tables
DROP TRIGGER IF EXISTS update_lead_events_updated_at ON public.lead_events;
CREATE TRIGGER update_lead_events_updated_at
  BEFORE UPDATE ON public.lead_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_follow_up_tasks_updated_at ON public.follow_up_tasks;
CREATE TRIGGER update_follow_up_tasks_updated_at
  BEFORE UPDATE ON public.follow_up_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to emit lead event (called by API)
CREATE OR REPLACE FUNCTION public.emit_lead_event(
  p_event_type public.lead_event_type,
  p_conversation_id UUID,
  p_payload JSONB DEFAULT '{}',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Check for duplicate if idempotency_key provided
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_event_id 
    FROM public.lead_events 
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_event_id IS NOT NULL THEN
      RETURN v_event_id; -- Return existing event ID
    END IF;
  END IF;

  -- Insert new event
  INSERT INTO public.lead_events (
    event_type,
    conversation_id,
    payload,
    idempotency_key
  ) VALUES (
    p_event_type,
    p_conversation_id,
    p_payload,
    p_idempotency_key
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Function to add timeline entry
CREATE OR REPLACE FUNCTION public.add_timeline_entry(
  p_conversation_id UUID,
  p_event_type public.timeline_event_type,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_actor_type TEXT DEFAULT 'system',
  p_actor_id TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  INSERT INTO public.conversation_timeline (
    conversation_id,
    event_type,
    title,
    description,
    actor_type,
    actor_id,
    actor_name,
    metadata
  ) VALUES (
    p_conversation_id,
    p_event_type,
    p_title,
    p_description,
    p_actor_type,
    p_actor_id,
    p_actor_name,
    p_metadata
  )
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- Function to check and update overdue follow-ups
CREATE OR REPLACE FUNCTION public.update_overdue_follow_ups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.follow_up_tasks
  SET 
    status = 'overdue',
    updated_at = now()
  WHERE 
    status = 'scheduled'
    AND follow_up_date < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to get SLA breach candidates (for alerting)
CREATE OR REPLACE FUNCTION public.get_sla_breach_candidates(
  p_warning_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  conversation_id UUID,
  customer_name TEXT,
  lead_quality TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  sla_deadline TIMESTAMP WITH TIME ZONE,
  minutes_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.customer_name,
    c.lead_quality::TEXT,
    c.created_at,
    c.sla_response_deadline,
    EXTRACT(EPOCH FROM (c.sla_response_deadline - now()) / 60)::INTEGER AS minutes_remaining
  FROM public.conversations c
  WHERE 
    c.sla_breached = FALSE
    AND c.first_response_at IS NULL
    AND c.sla_response_deadline IS NOT NULL
    AND c.sla_response_deadline <= (now() + (p_warning_minutes || ' minutes')::INTERVAL)
  ORDER BY c.sla_response_deadline ASC;
END;
$$;

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies for lead_events (admin only)
CREATE POLICY "Admins can view all lead events"
  ON public.lead_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage lead events"
  ON public.lead_events FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for conversation_timeline (admin only)
CREATE POLICY "Admins can view all timeline entries"
  ON public.conversation_timeline FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage timeline entries"
  ON public.conversation_timeline FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for follow_up_tasks (admin only)
CREATE POLICY "Admins can view all follow-up tasks"
  ON public.follow_up_tasks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage follow-up tasks"
  ON public.follow_up_tasks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage follow-up tasks"
  ON public.follow_up_tasks FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for notification_logs (admin only)
CREATE POLICY "Admins can view notification logs"
  ON public.notification_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage notification logs"
  ON public.notification_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 6: REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for new tables (admin panel updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_up_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.lead_events IS 'Event sourcing table for async lead processing. Decouples capture from notifications.';
COMMENT ON TABLE public.conversation_timeline IS 'Audit trail of all conversation actions for admin visibility.';
COMMENT ON TABLE public.follow_up_tasks IS 'Scheduled follow-ups with SLA tracking.';
COMMENT ON TABLE public.notification_logs IS 'Track notification delivery across all channels.';
