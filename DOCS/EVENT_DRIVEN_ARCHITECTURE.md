# Event-Driven Lead Architecture

## Overview

This document describes the upgraded event-driven lead management architecture for TrueNester. The system decouples lead capture from notification delivery, ensuring **no lead is ever lost** even if external services (Slack, Email, Telegram) fail.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Vercel)                               │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   Chatbot UI    │  Contact Form   │ Property Inquiry│    Admin Panel        │
│ TrueNesterChat  │   ContactPage   │  PropertyDetail │  AdminConversations   │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                     │
         │ POST /api/chatbot/leads          │                     │
         │                 │ POST /api/submit-contact             │
         │                 │                 │ POST /api/property-inquiry
         ▼                 ▼                 ▼                     │
┌─────────────────────────────────────────────────────────────────┐│
│                     EXPRESS API (Render)                        ││
│  ┌─────────────────────────────────────────────────────────┐   ││
│  │                    API LAYER                             │   ││
│  │  1. Validate payload (Zod schema)                       │   ││
│  │  2. Save to conversations table                         │   ││
│  │  3. Save to chat_messages table                         │   ││
│  │  4. Emit lead.created event ──────────────────────┐     │   ││
│  │  5. Return 201 immediately                        │     │   ││
│  └───────────────────────────────────────────────────│─────┘   ││
│                                                      │         ││
│  ┌───────────────────────────────────────────────────▼─────┐   ││
│  │              EVENT EMITTER LAYER                        │   ││
│  │  - Writes to lead_events table                          │   ││
│  │  - Writes to conversation_timeline                      │   ││
│  │  - Idempotency key prevents duplicates                  │   ││
│  └───────────────────────────────────────────────────┬─────┘   ││
│                                                      │         ││
│  ┌───────────────────────────────────────────────────▼─────┐   ││
│  │           NOTIFICATION WORKER (Background)              │   ││
│  │  - Polls lead_events every 5 seconds                    │   ││
│  │  - Processes unprocessed events                         │   ││
│  │  - Sends to Slack, Email, Telegram                      │   ││
│  │  - Logs to notification_logs table                      │   ││
│  │  - Retries failed notifications (3x)                    │   ││
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
         │                                                   │
         ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Database)                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  conversations  │  chat_messages  │  lead_events (NEW)          │
│  (existing)     │  (existing)     │  conversation_timeline (NEW)│
│                 │                 │  follow_up_tasks (NEW)      │
│                 │                 │  notification_logs (NEW)    │
└─────────────────┴─────────────────┴─────────────────────────────┘
         │
         │ Real-time subscriptions
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL (Frontend)                       │
│  - Real-time conversation updates                               │
│  - Timeline view (all actions on a lead)                        │
│  - SLA monitoring alerts                                        │
│  - Notification delivery status                                 │
│  - Follow-up task management                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Database Tables

### 1. `lead_events`
Event sourcing table for async processing.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_type | ENUM | lead.created, lead.updated, notification.sent, etc. |
| conversation_id | UUID | FK to conversations |
| payload | JSONB | Event data |
| processed | BOOLEAN | Has worker processed this? |
| processed_at | TIMESTAMP | When processed |
| retry_count | INTEGER | Number of retry attempts |
| idempotency_key | TEXT | Prevents duplicate events |

### 2. `conversation_timeline`
Audit trail for admin visibility.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to conversations |
| event_type | ENUM | created, status_changed, notification_sent, etc. |
| title | TEXT | Human-readable title |
| description | TEXT | Details |
| actor_type | TEXT | system, agent, customer, bot |
| actor_id | TEXT | Who performed the action |
| metadata | JSONB | Additional context |

### 3. `follow_up_tasks`
Scheduled follow-ups with SLA tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to conversations |
| follow_up_date | TIMESTAMP | When to follow up |
| status | ENUM | scheduled, completed, overdue |
| sla_deadline | TIMESTAMP | SLA deadline |
| sla_breached | BOOLEAN | Has SLA been breached? |

### 4. `notification_logs`
Track notification delivery.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to conversations |
| channel | ENUM | slack, email, telegram, whatsapp |
| status | TEXT | pending, sent, delivered, failed |
| error_message | TEXT | Error details if failed |

---

## Conversations Table Enhancements

New columns added (non-destructive):

| Column | Type | Description |
|--------|------|-------------|
| metadata | JSONB | UTM params, referrer, device, country |
| idempotency_key | TEXT | Prevents duplicate submissions |
| source | TEXT | website, chatbot, api, etc. |
| first_response_at | TIMESTAMP | When agent first responded |
| sla_response_deadline | TIMESTAMP | SLA deadline |
| sla_breached | BOOLEAN | Has SLA been breached? |
| device_info | JSONB | Browser, OS, device type |

---

## Backend Folder Structure

```
truenester-chatbot-api/src/
├── server.ts              # Express app, routes
├── types.ts               # TypeScript types
├── lib/
│   ├── logger.ts          # Centralized logger with request ID
│   ├── event-emitter.ts   # Lead event emitter layer
│   ├── rate-limiter.ts    # Rate limiting middleware
│   └── integrations.ts    # WhatsApp/CRM interfaces (feature-flagged)
├── workers/
│   └── notification-worker.ts  # Async event processor
└── services/
    └── notification-service.ts # Slack/Email/Telegram sender
```

---

## Data Flow

### Lead Capture Flow

```
1. User submits form/chatbot
2. API validates payload
3. API saves to conversations + chat_messages
4. API emits lead.created event (async, non-blocking)
5. API returns 201 immediately
6. Worker picks up event (within 5 seconds)
7. Worker sends notifications
8. Worker logs results to notification_logs
9. Worker marks event as processed
```

### Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| Slack down | Lead saved, event logged, retry 3x, admin sees in timeline |
| Email down | Lead saved, event logged, retry 3x, admin sees in timeline |
| Worker down | Lead saved, events queue up, processed when worker restarts |
| Database down | API returns 500, frontend shows error, user can retry |

---

## SLA Monitoring

### Configuration

SLA deadlines are set based on lead quality:
- **HOT leads**: 15 minutes
- **WARM leads**: 1 hour
- **COLD leads**: 24 hours

### Alerts

1. **SLA Warning**: Triggered when lead is within 30 minutes of deadline
2. **SLA Breached**: Triggered when deadline passes without response

Admin panel shows:
- Real-time SLA alert banner
- List of leads approaching deadline
- Quick action buttons to contact leads

---

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| FEATURE_WHATSAPP_ENABLED | false | Enable WhatsApp integration |
| FEATURE_CRM_ENABLED | false | Enable CRM sync |
| FEATURE_SMS_ENABLED | false | Enable SMS notifications |
| ENABLE_NOTIFICATION_WORKER | true | Run background worker |

---

## Environment Variables

### Required

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Notifications

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-100123456789
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@truenester.com
EMAIL_PASS=xxx
EMAIL_FROM=TrueNester <notifications@truenester.com>
```

### Optional

```env
FRONTEND_URL=https://truenester.com
ADMIN_API_KEY=your-secure-key
LOG_LEVEL=info
ENABLE_NOTIFICATION_WORKER=true
FEATURE_WHATSAPP_ENABLED=false
FEATURE_CRM_ENABLED=false
```

---

## Why This Architecture?

### 1. Reliability
- Lead capture and notification delivery are decoupled
- If Slack/Email fails, lead is never lost
- Events can be replayed for recovery

### 2. Visibility
- Complete audit trail in conversation_timeline
- Notification delivery status visible in admin
- SLA monitoring with proactive alerts

### 3. Scalability
- Worker can be scaled independently
- Events queue up during high load
- Rate limiting prevents abuse

### 4. Future-Ready
- WhatsApp/CRM interfaces ready (feature-flagged)
- Easy to add new notification channels
- No refactoring needed for new integrations

### 5. Deployment Safety
- All changes are additive (no breaking changes)
- Works in local, Vercel, and Render
- Environment-based configuration
