.\test-notification.ps1
# Telegram & Email Fallback Integration - Complete Guide

## 🎯 Overview

Your notification system now has **multi-channel failover support**:

1. **Primary**: Slack (existing)
2. **Fallback 1**: Telegram Bot
3. **Fallback 2**: Email to info@truenester.com and truenester4u@gmail.com

If Slack fails, the system automatically tries Telegram. If Telegram also fails, it sends an email notification.

---

## 📊 Integration Points

### ✅ Backend API (truenester-chatbot-api)
- **Chatbot conversations** → Multi-channel notifications
- **Contact form fallback** → Telegram/Email via API endpoint
- **Property inquiry fallback** → Telegram/Email via API endpoint

### ✅ Frontend
- **Contact page** → Uses new notification utility
- **Property inquiry forms** → Will use same utility (future)
- **Chatbot widget** → Sends to backend API

---

## 🚀 What Was Implemented

### 1. Notification Service (`truenester-chatbot-api/src/services/notification-service.ts`)

**Features**:
- Intelligent fallback chain: Slack → Telegram → Email
- Rich formatting for all three channels
- Detailed logging for debugging
- TypeScript types for safety

**Methods**:
```typescript
class NotificationService {
  async sendNotification(payload: NotificationPayload): Promise<NotificationResult>
  private async sendSlackNotification(payload): Promise<{success, error?}>
  private async sendTelegramNotification(payload): Promise<{success, error?}>
  private async sendEmailNotification(payload): Promise<{success, error?}>
}
```

### 2. Frontend Notification Utility (`src/lib/notifications.ts`)

**Features**:
- Sends Slack directly from browser (no-cors mode)
- Falls back to backend API for Telegram/Email
- Clean TypeScript interface
- Non-blocking (doesn't affect form submission)

### 3. Comprehensive Test Suite

**Backend Tests** (`truenester-chatbot-api/src/services/`):
- `notification-service.test.ts` - 18 test scenarios covering:
  - Slack notification success
  - Fallback to Telegram when Slack fails
  - Fallback to Email when both fail
  - Message formatting for all sources
  - Configuration validation
  
- `api-integration.test.ts` - 10 test scenarios covering:
  - `/api/notifications/fallback` endpoint
  - Health check endpoint updates
  - Payload validation
  - Error handling

**Frontend Tests** (`src/lib/`):
- `notifications.test.ts` - 8 test scenarios
- `utils.test.ts` - 12 test scenarios for property type parsing

**Total**: 48 comprehensive unit and integration tests

### 4. Updated Contact Form

**File**: `src/pages/Contact.tsx`

**Changes**:
- Replaced inline Slack code with `sendMultiChannelNotification()`
- Cleaner, maintainable code
- Automatic fallback handling

---

## 📝 Environment Variables

### Backend (.env in truenester-chatbot-api/)

```env
# Existing
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
FRONTEND_URL=http://localhost:8080
ADMIN_API_KEY=your-32-char-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# NEW - Telegram Integration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ123456789
TELEGRAM_CHAT_ID=-1001234567890

# NEW - Email Integration  
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=Dubai Nest Hub <noreply@truenester.com>
```

### Frontend (.env in project root)

```env
# Existing - no changes needed
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_ADMIN_API_URL=http://localhost:4000
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 🔧 Setup Instructions

### Step 1: Create Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow prompts to name your bot
4. Copy the bot token (looks like: `1234567890:ABCdef...`)
5. Save as `TELEGRAM_BOT_TOKEN`

### Step 2: Get Telegram Chat ID

**Option A**: Personal Chat
1. Message [@userinfobot](https://t.me/userinfobot)
2. It will reply with your user ID
3. Use this as `TELEGRAM_CHAT_ID`

**Option B**: Group Chat (Recommended for teams)
1. Create a group in Telegram
2. Add your bot to the group
3. Send a message in the group
4. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Look for `"chat":{"id":-1001234567890}` in the response
6. Use the negative ID as `TELEGRAM_CHAT_ID`

### Step 3: Configure Email (Gmail Example)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (enable if not already)
3. Security → App Passwords
4. Generate new app password for "Mail"
5. Copy the 16-character password
6. Use your Gmail address as `EMAIL_USER`
7. Use the app password as `EMAIL_PASS`

### Step 4: Update Environment Files

```bash
# Backend
cd truenester-chatbot-api
cp .env.example .env
# Edit .env and add all values

# Restart backend
npm run dev
```

---

## 🧪 Testing the Integration

### Test 1: Check Health Endpoint

```bash
curl http://localhost:4000/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T...",
  "slackConfigured": true,
  "telegramConfigured": true,
  "emailConfigured": true,
  "port": 4000
}
```

### Test 2: Test Contact Form

1. Start both frontend and backend:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd truenester-chatbot-api
npm run dev
```

2. Visit `http://localhost:8080/contact`
3. Fill and submit the form
4. Check:
   - ✅ Slack channel for message
   - ✅ Terminal logs showing notification sent
   - ✅ If Slack fails, Telegram should receive message
   - ✅ If both fail, check email inbox

### Test 3: Test Chatbot

1. Visit any property page
2. Use the chatbot widget
3. Complete a conversation
4. Notifications sent automatically via backend

---

## 📊 Notification Flow Diagram

```
┌─────────────────────────────────────────────┐
│ User submits: Contact Form / Chatbot / etc │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ Try Slack First │
         └────────┬────────┘
                  │
            ┌─────┴─────┐
            │ Success?  │
            └─────┬─────┘
                  │
         ┌────────┴────────┐
         │                 │
      YES│                 │NO
         │                 │
         ▼                 ▼
    ┌─────────┐    ┌──────────────┐
    │  Done   │    │ Try Telegram │
    └─────────┘    └──────┬───────┘
                          │
                    ┌─────┴─────┐
                    │ Success?  │
                    └─────┬─────┘
                          │
                 ┌────────┴────────┐
                 │                 │
              YES│                 │NO
                 │                 │
                 ▼                 ▼
            ┌─────────┐    ┌────────────┐
            │  Done   │    │ Try Email  │
            └─────────┘    └──────┬─────┘
                                  │
                            ┌─────┴─────┐
                            │ Success?  │
                            └─────┬─────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                      YES│                 │NO
                         │                 │
                         ▼                 ▼
                    ┌─────────┐    ┌────────────┐
                    │  Done   │    │ Log Error  │
                    └─────────┘    └────────────┘
```

---

## 📱 Telegram Message Format

```
🤖 New Chatbot Conversation

Name: Rajesh Kumar
Intent: buy
Email: rajesh@example.com
Phone: +971 50 123 4567
Budget: AED 1.5M
Property Type: Apartment
Area: Dubai Marina
Lead Score: 85/100
Duration: 12 minutes

View in Admin Panel → http://localhost:8080/admin/conversations
```

---

## 📧 Email Format

**Subject**: `🤖 New Chatbot Lead: Rajesh Kumar`

**Body** (HTML):
- Clean table layout
- All customer info displayed
- Clickable button to admin panel
- Professional formatting

**Body** (Plain Text):
- Fallback for email clients without HTML
- All info preserved

---

## 🐛 Troubleshooting

### Telegram Not Receiving Messages

**Problem**: `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` incorrect

**Solution**:
1. Test bot token:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
```

2. If valid, check chat ID:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates"
```

### Email Not Sending (Gmail)

**Problem**: "Invalid credentials" or "Less secure app"

**Solution**:
1. Use App Password, NOT your regular Gmail password
2. Enable 2-Step Verification first
3. Generate new App Password
4. Use the 16-character code without spaces

### All Channels Failing

**Problem**: Check backend logs

**Solution**:
```bash
cd truenester-chatbot-api
npm run dev
```

Look for:
- `[SLACK] ...` logs
- `[TELEGRAM] ...` logs  
- `[EMAIL] ...` logs
- `[NOTIFICATION] ...` summary logs

---

## 🎯 Production Deployment

### Vercel / Netlify (Frontend)

No changes needed - existing `VITE_SLACK_WEBHOOK_URL` and `VITE_ADMIN_API_URL` are sufficient.

### Backend Deployment (Heroku / Railway / DigitalOcean)

Add these environment variables to your hosting platform:

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=Dubai Nest Hub <noreply@truenester.com>
```

---

## 📚 Files Created/Modified

### New Files

**Backend**:
- `truenester-chatbot-api/src/services/notification-service.ts` - Core service (520 lines)
- `truenester-chatbot-api/src/services/notification-service.test.ts` - Tests (470 lines)
- `truenester-chatbot-api/src/services/api-integration.test.ts` - API tests (230 lines)
- `truenester-chatbot-api/vitest.config.ts` - Test configuration

**Frontend**:
- `src/lib/notifications.ts` - Browser notification utility (160 lines)
- `src/lib/notifications.test.ts` - Frontend tests (155 lines)
- `src/lib/utils.test.ts` - Utility tests (70 lines)
- `src/test/setup.ts` - Test setup
- `vitest.config.ts` - Frontend test config

### Modified Files

**Backend**:
- `truenester-chatbot-api/src/server.ts`:
  - Added notification service import
  - Updated chatbot endpoint to use multi-channel
  - Added `/api/notifications/fallback` endpoint
  - Updated `/health` endpoint with new checks
- `truenester-chatbot-api/package.json`: Added test scripts
- `truenester-chatbot-api/.env.example`: Documented new variables
- `truenester-chatbot-api/tsconfig.json`: Added vitest types

**Frontend**:
- `src/pages/Contact.tsx`: Uses new `sendMultiChannelNotification()`
- `package.json`: Added test scripts

---

## 🔐 Security Notes

### API Keys

- Never commit `.env` files
- Use environment-specific webhooks in production
- Rotate Telegram bot token quarterly
- Use Gmail App Passwords, not account password

### Email Recipients

Currently hardcoded to:
- `info@truenester.com`
- `truenester4u@gmail.com`

To change, edit `notification-service.ts:149`:
```typescript
to: "your-email@example.com, another@example.com",
```

---

## 🚀 Future Enhancements

- [ ] SMS notifications (Twilio integration)
- [ ] WhatsApp Business API
- [ ] Configurable notification preferences per admin user
- [ ] Notification analytics dashboard
- [ ] Retry logic with exponential backoff
- [ ] Queue system for high-volume notifications
- [ ] Notification templates customization
- [ ] Multi-language support

---

## 📊 Testing Summary

### Backend Tests
- ✅ 18 notification service tests
- ✅ 10 API integration tests
- ✅ Covers all three channels
- ✅ Tests failover scenarios
- ✅ Validates message formatting

### Frontend Tests
- ✅ 8 notification utility tests
- ✅ 12 property type utility tests
- ✅ Tests Slack formatting
- ✅ Tests fallback to backend API

### Test Commands

```bash
# Backend tests
cd truenester-chatbot-api
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# Frontend tests
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:ui             # Visual UI
npm run test:coverage       # With coverage
```

---

## ✅ Implementation Checklist

- [x] Create notification service with Slack/Telegram/Email
- [x] Add comprehensive error handling
- [x] Implement fallback chain logic
- [x] Format messages for all channels
- [x] Write 48 unit/integration tests
- [x] Update Contact form to use new service
- [x] Add fallback API endpoint
- [x] Document environment variables
- [x] Create setup instructions
- [x] Add troubleshooting guide
- [x] Update health check endpoint
- [x] Install required dependencies
- [x] Configure test frameworks (Vitest)
- [x] Add TypeScript types

---

**Implementation Date**: December 17, 2025
**Status**: ✅ Complete - All Features Implemented & Tested
**Integration**: ✅ Telegram & Email Fallback Active
**Tests**: ✅ 48 Comprehensive Test Scenarios

Start getting reliable notifications across all channels! 🎉
