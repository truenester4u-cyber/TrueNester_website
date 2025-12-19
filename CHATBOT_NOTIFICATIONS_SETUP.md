# Chatbot Notifications Setup Guide

## Overview
Chatbot conversations are automatically sent to **Slack** and **Email** when a lead is captured. This guide shows how to verify and test the integration.

## Current Status ✅

### Backend Integration (Complete)
- ✅ Notification service implemented (`truenester-chatbot-api/src/services/notification-service.ts`)
- ✅ Multi-channel support: Slack, Email, Telegram (optional)
- ✅ `/api/chatbot/leads` endpoint triggers notifications automatically
- ✅ All credentials configured in backend `.env`

### Configuration Files

#### Backend `.env` (truenester-chatbot-api/.env)
```env
# Slack Configuration
SLACK_WEBHOOK_URL=your_slack_webhook_url_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email_here
EMAIL_PASS=your_app_password_here
EMAIL_FROM=True Nester <noreply@truenester.com>

# Recipients (hardcoded in notification-service.ts)
# - info@truenester.com
# - truenester4u@gmail.com
```

#### Frontend `.env`
```env
# NOW UPDATED TO USE LOCAL API
VITE_ADMIN_API_URL="http://localhost:4000/api"
VITE_CHATBOT_API_URL="http://localhost:4000/api"
```

## How It Works

### Flow Diagram
```
Chatbot Widget (Frontend)
    ↓ POST /api/chatbot/leads
Backend API (truenester-chatbot-api)
    ↓ Save to Supabase database
    ↓ Trigger notificationService.sendNotification()
    ├─→ Slack (via webhook)
    ├─→ Email (via nodemailer)
    └─→ Telegram (optional)
```

### Notification Content

**Slack Message Includes:**
- 🤖 New Chatbot Conversation header
- Customer name, email, phone
- Intent (buy/rent/sell/invest)
- Budget and property preferences
- Lead score (0-100)
- Conversation duration
- Link to admin panel

**Email Includes:**
- Same information as Slack
- Formatted HTML email
- Admin panel link
- Professional branding

## Setup & Testing

### Step 1: Start Backend Server
```bash
cd truenester-chatbot-api
npm run dev
```

**Expected output:**
```
🚀 Admin API server started
   Port: 4000
   Slack webhook configured: true
   Email configured: true
```

### Step 2: Test with Script
```bash
# From project root
node test-chatbot-notifications.js
```

This sends a test chatbot lead and verifies:
- ✅ API accepts the payload
- ✅ Conversation saved to database
- ✅ Slack notification sent
- ✅ Email notification sent

### Step 3: Test with Real Chatbot
1. Start frontend: `npm run dev`
2. Open http://localhost:8080
3. Click chatbot widget (bottom-right corner)
4. Complete a conversation flow
5. Submit your details (name, phone, email)

**Check:**
- Slack workspace for notification
- Email inbox (info@truenester.com or truenester4u@gmail.com)
- Admin panel: http://localhost:8080/admin/conversations

## Troubleshooting

### Problem: No Slack Notifications

**Check:**
1. Backend `.env` has `SLACK_WEBHOOK_URL`
2. Webhook URL is valid (test in Slack API docs)
3. Backend logs show: `[SLACK] Notification sent successfully`

**Fix:**
```bash
# Test Slack webhook directly
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test notification from Dubai Nest Hub"}'
```

### Problem: No Email Notifications

**Check:**
1. Backend `.env` has all email credentials:
   - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
2. Gmail "App Password" is correct (not your regular password)
3. Backend logs show: `[EMAIL] ✅ Email sent successfully!`

**Fix:**
1. Generate new Gmail App Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Create App Password for "Mail"
2. Update `EMAIL_PASS` in backend `.env`

### Problem: Chatbot Not Submitting

**Check:**
1. Frontend `.env` has: `VITE_CHATBOT_API_URL="http://localhost:4000/api"`
2. Backend server is running on port 4000
3. Browser console shows successful POST to `/api/chatbot/leads`

**Fix:**
```bash
# Restart frontend after .env change
npm run dev
```

### Problem: CORS Errors

**Backend already configured to allow localhost ports:**
- 8080, 8081, 8082, 8083, 8084, 5173

If using different port, add to `truenester-chatbot-api/src/server.ts`:
```typescript
const allowedOrigins = [
  "http://localhost:YOUR_PORT",
  // ...existing origins
];
```

## Verification Checklist

- [ ] Backend server running on port 4000
- [ ] Frontend using `http://localhost:4000/api` for chatbot
- [ ] `SLACK_WEBHOOK_URL` configured in backend `.env`
- [ ] Email credentials configured in backend `.env`
- [ ] Test script runs successfully
- [ ] Slack notifications appearing
- [ ] Email notifications arriving
- [ ] Conversations visible in admin panel

## Production Deployment

### For Render/Heroku/Railway:

1. **Set environment variables:**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   SLACK_WEBHOOK_URL=your_slack_webhook
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=truenester4u@gmail.com
   EMAIL_PASS=your_app_password
   PORT=4000
   ```

2. **Update frontend `.env`:**
   ```env
   VITE_ADMIN_API_URL="https://your-backend.onrender.com/api"
   VITE_CHATBOT_API_URL="https://your-backend.onrender.com/api"
   ```

3. **Deploy backend first**, then frontend

## Support

**Backend logs location:**
- Development: Terminal running `npm run dev`
- Check for: `[NOTIFICATION]`, `[SLACK]`, `[EMAIL]` prefixed messages

**Key log messages:**
- ✅ Success: `[NOTIFICATION] ✅ Sent via: Slack, Email`
- ❌ Failure: `[NOTIFICATION] ❌ All channels failed`
- 📧 Email: `[EMAIL] Message ID: <id>`
- 💬 Slack: `[SLACK] Notification sent successfully`

## Summary

✨ **Slack and Email notifications are fully integrated and configured!**

The integration automatically sends notifications when:
- Chatbot captures a new lead
- Contact form is submitted
- Property inquiry is made

Just ensure the backend API is running and credentials are valid.
