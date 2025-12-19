# Deployment Checklist - Event-Driven Lead Architecture

## Pre-Deployment

### 1. Database Migration

Run the SQL migration in Supabase:

```bash
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Via Supabase Dashboard
# Go to SQL Editor → New Query → Paste migration → Run
```

**Migration file:** `supabase/migrations/20251219000001_event_driven_lead_architecture.sql`

**Verify tables created:**
- [ ] `lead_events` table exists
- [ ] `conversation_timeline` table exists
- [ ] `follow_up_tasks` table exists
- [ ] `notification_logs` table exists
- [ ] `conversations` table has new columns (metadata, idempotency_key, source, etc.)

### 2. Environment Variables

#### Render (Backend API)

Add/verify these environment variables:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-100123456789
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@truenester.com
EMAIL_PASS=your-app-password
EMAIL_FROM=TrueNester <notifications@truenester.com>

# Configuration
FRONTEND_URL=https://truenester.com
ADMIN_API_KEY=TrueNester2025_AdminAPI_SecureKey_Dubai_Development_Production_v1
LOG_LEVEL=info
ENABLE_NOTIFICATION_WORKER=true

# Feature Flags (all disabled by default)
FEATURE_WHATSAPP_ENABLED=false
FEATURE_CRM_ENABLED=false
FEATURE_SMS_ENABLED=false
```

#### Vercel (Frontend)

Verify these environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_BASE_URL=https://your-api.onrender.com
```

### 3. Code Deployment

#### Backend (Render)

```bash
# Push to main branch triggers auto-deploy
git push origin main

# Or manual deploy via Render dashboard
```

**Verify deployment:**
- [ ] Build succeeds
- [ ] Server starts without errors
- [ ] Health check endpoint responds: `GET /health`
- [ ] Notification worker logs: "Notification worker started"

#### Frontend (Vercel)

```bash
# Push to main branch triggers auto-deploy
git push origin main

# Or manual deploy via Vercel dashboard
```

**Verify deployment:**
- [ ] Build succeeds
- [ ] Site loads correctly
- [ ] Admin panel accessible

---

## Post-Deployment Verification

### 1. Lead Capture Flow

Test the complete flow:

1. [ ] Submit a test lead via chatbot
2. [ ] Verify conversation appears in database
3. [ ] Verify `lead_events` table has `lead.created` event
4. [ ] Verify `conversation_timeline` has "Lead Created" entry
5. [ ] Verify Slack notification received
6. [ ] Verify Email notification received (if configured)
7. [ ] Verify Telegram notification received (if configured)
8. [ ] Verify `notification_logs` table has entries

### 2. Admin Panel

1. [ ] Login to admin panel
2. [ ] Verify new leads appear in real-time
3. [ ] Open a conversation and check timeline tab
4. [ ] Verify SLA alert banner appears for old leads

### 3. API Endpoints

Test these endpoints:

```bash
# Health check
curl https://your-api.onrender.com/health

# Submit test lead
curl -X POST https://your-api.onrender.com/api/chatbot/leads \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "+971501234567",
    "customerEmail": "test@example.com",
    "intent": "buy"
  }'
```

---

## Rollback Plan

If issues occur, rollback is safe because:

1. **Database changes are additive** - no existing tables modified
2. **API is backward compatible** - old endpoints still work
3. **Event system is optional** - legacy notification path still active

### Quick Rollback Steps

1. **Disable notification worker:**
   ```env
   ENABLE_NOTIFICATION_WORKER=false
   ```

2. **Revert to previous commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database cleanup (if needed):**
   ```sql
   -- Only if you need to remove new tables
   DROP TABLE IF EXISTS notification_logs;
   DROP TABLE IF EXISTS follow_up_tasks;
   DROP TABLE IF EXISTS conversation_timeline;
   DROP TABLE IF EXISTS lead_events;
   ```

---

## Failure Scenarios & Handling

| Scenario | Detection | Impact | Resolution |
|----------|-----------|--------|------------|
| Slack webhook down | notification_logs shows "failed" | No Slack alerts | Leads still saved, check Email/Telegram |
| Email SMTP down | notification_logs shows "failed" | No email alerts | Leads still saved, check Slack/Telegram |
| Worker crashes | No events processed | Notifications delayed | Worker auto-restarts, events queue up |
| Database down | API returns 500 | Lead capture fails | Frontend shows error, user retries |
| High load | Events queue up | Notifications delayed | Worker catches up, no data loss |

---

## Monitoring

### Logs to Watch

**Render logs:**
```
[INFO] Notification worker started
[INFO] Successfully created conversation xxx
[INFO] Event emitted: lead.created
[INFO] Notifications sent via: slack, email
```

**Error patterns:**
```
[ERROR] Failed to emit lead.created event
[WARN] All notification channels failed
[ERROR] Conversation insert error
```

### Database Queries

**Unprocessed events:**
```sql
SELECT COUNT(*) FROM lead_events WHERE processed = FALSE;
```

**Failed notifications:**
```sql
SELECT * FROM notification_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
```

**SLA breaches:**
```sql
SELECT * FROM conversations WHERE sla_breached = TRUE ORDER BY created_at DESC;
```

---

## Performance Considerations

1. **Worker polling interval:** 5 seconds (configurable)
2. **Batch size:** 10 events per poll
3. **Rate limits:**
   - Lead submission: 10/minute
   - Contact form: 5/minute
   - Admin API: 120/minute
   - Export: 5/minute

---

## Security Checklist

- [ ] All secrets in environment variables (not hardcoded)
- [ ] CORS restricted to allowed origins
- [ ] Admin API key required for admin endpoints
- [ ] Rate limiting enabled
- [ ] RLS policies active on all new tables
- [ ] Service role key only used server-side

---

## Next Steps (Future)

1. **Enable WhatsApp integration:**
   - Set `FEATURE_WHATSAPP_ENABLED=true`
   - Implement Twilio/MessageBird provider
   - Configure WhatsApp Business API

2. **Enable CRM integration:**
   - Set `FEATURE_CRM_ENABLED=true`
   - Implement HubSpot/Salesforce provider
   - Configure API credentials

3. **SLA automation:**
   - Set up cron job to check SLA breaches
   - Auto-assign overdue leads to available agents
   - Send escalation notifications
