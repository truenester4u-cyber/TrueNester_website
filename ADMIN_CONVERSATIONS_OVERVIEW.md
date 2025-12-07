# TrueNester Conversation Intelligence Admin

## System Goals
- Centralize chatbot conversations for Dubai Nest Hub admins.
- Provide lead qualification, follow-up workflows, analytics, and exports in one surface.
- Integrate with Supabase (storage/auth) plus optional downstream CRM connectors.

## High-Level Architecture
```
┌─────────────────────┐     ┌───────────────────────────┐
│  React Admin Panel  │◄────►│ Supabase REST + Realtime  │
│  (src/pages/admin)  │     │  conversations/messages   │
└─────────────────────┘     └───────────────────────────┘
          ▲                            ▲
          │                            │
          │ Webhooks / background sync │
          │                            │
          ▼                            ▼
  CRM Connectors (HubSpot, Zoho)   File exports (PDF/CSV/XLSX)
```

- **Data layer**: `supabase` schema with `conversations`, `chat_messages`, `lead_tags`, and materialized analytics views. Row-Level Security enforces per-role access.
- **API layer**: Vite frontend calls Supabase via `@/integrations/supabase/adminConversations.ts`. Additional Express (truenester-chatbot-api) endpoints exposed for summaries/exports.
- **UI layer**: New React route `/admin/conversations` using AdminLayout, React Query, and component modules under `src/components/admin/conversations`.
- **Real-time**: Supabase Realtime channels push new messages/conversations to dashboard.
- **Automation**: Lead scoring + summary builder run in browser (fallback) and via scheduled edge function for persistence.

## Frontend Modules
- **ConversationDashboardPage** (`src/pages/admin/Conversations.tsx`): Orchestrates filters, analytics, list/detail split panes.
- **SearchBar**: Global filters (query, status, tags, date range, agent, intent) with controlled inputs and badge summary.
- **ConversationList**: Virtualized list with cards showing contact info, status chips, interest summary, quick actions (view, assign, follow-up, notes).
- **ConversationDetail**: Two-column layout showing header metadata, ChatHistory, ConversationSummary, Sidebar actions.
- **ChatHistory**: Message grouping with sender styling, metadata badges (buttons, forms), quick jump to time.
- **ConversationSummary**: Auto-generated summary module including action checklist and lead score breakdown.
- **AgentAssignmentDrawer**: Drawer modal for assigning agents, setting priority/follow-up, templated reminders (email/SMS/WhatsApp) with supabase updates.
- **NotificationCenter**: Bell dropdown with live alerts (new chat, hot lead, overdue follow-up, lost lead, review) and preference toggles.
- **AnalyticsOverview**: Metric cards + charts (line, pie, funnel, bar, heatmap) with date range selection and export.
- **ExportMenu**: Buttons to trigger PDF/CSV/XLSX exports via API and print modal.

## Data Contracts (TypeScript Interfaces)
- `Conversation`, `ConversationSummary`, `ChatMessage`, `LeadScoreBreakdown`, `FollowUpTask`, `Notification`, `Agent`, `AnalyticsSnapshot` stored in `src/types/conversations.ts`.
- `messages` nested array includes button/form metadata for replaying flows.

## API Contracts
- REST endpoints hosted under `/api/admin/...` (see `ADMIN_APIS.md`) wrapping Supabase RPC:
  - GET `/api/admin/conversations` with filters, pagination, and sorting.
  - GET `/api/admin/conversations/:id`, PUT for updates, POST follow-up, GET summary, POST export.
  - GET `/api/admin/analytics`, `/api/admin/search` for advanced queries.
- Webhooks notify NotificationCenter via SSE or Supabase realtime.
- Authentication enforced via Supabase access token; server verifies role (admin/agent/manager) before returning filtered results.

## Lead Scoring Engine
- Deterministic scoring util `calculateLeadScore(conversation)` adds points for budget, property type, viewed property count, scheduling, etc.
- Score buckets: Hot (>80, red), Warm (50-80, yellow), Cold (<50, green). Stored on conversation row plus recalculated client-side for resiliency.

## Follow-up + Assignment Flow
1. Select conversation ⇒ open detail.
2. Use AgentAssignment component to choose agent, priority, follow-up date, reminder type.
3. Action triggers Supabase update + Notification to agent via email/SMS webhooks.
4. Follow-up tasks appear in Overdue/Due Today filters and NotificationCenter.

## Analytics & Reporting
- React Query fetches `/api/admin/analytics` returning metrics + datasets.
- Charts built with `@/components/ui/chart` primitives.
- Export buttons call `/api/admin/conversations/export` streaming requested format.

## Security & Compliance
- AdminLayout already enforces login; new route adds role guard + audit logging (per API endpoint writes to `audit_logs`).
- Sensitive fields (phone/email) encrypted at rest via Supabase pgcrypto; UI decrypts via Edge Function when authorized.
- GDPR utilities to anonymize conversation after retention period (90 days default, configurable).

## File/Folder Additions (Plan)
```
src/
  types/conversations.ts
  integrations/supabase/adminConversations.ts
  hooks/useConversationFilters.ts
  components/admin/conversations/
    ConversationDashboard.tsx
    ConversationList.tsx
    ConversationCard.tsx
    ConversationDetail.tsx
    ConversationSummary.tsx
    ChatHistory.tsx
    AgentAssignmentDrawer.tsx
    SearchFilters.tsx
    AnalyticsOverview.tsx
    NotificationCenter.tsx
    ExportMenu.tsx
pages/admin/Conversations.tsx
```

## Database & Infrastructure
- Migration script `database-migrations/202511290001_create_chat_admin_tables.sql` defines tables, indexes, RLS policies, sample data.
- Additional SQL view for analytics (daily conversation counts, lead buckets, response times).
- Background job to roll up stats hourly (Supabase cron).

This architecture blueprint drives the implementation work tracked in the remaining TODO items.
