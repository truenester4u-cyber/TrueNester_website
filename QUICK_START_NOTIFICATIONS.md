# 🚀 Quick Start: Chatbot with Slack & Email Notifications

## TL;DR - Start Everything

### Option 1: One-Click Start (Windows)
```bash
start-with-notifications.bat
```

### Option 2: Manual Start

**Terminal 1 - Backend API:**
```bash
cd truenester-chatbot-api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Terminal 3 - Test Notifications:**
```bash
node test-chatbot-notifications.js
```

## What's Already Configured ✅

### Slack Integration
- **Webhook URL**: Configured in `truenester-chatbot-api/.env`
- **Channel**: Will appear in your Slack workspace
- **Format**: Rich message blocks with customer details

### Email Integration
- **SMTP**: Gmail (smtp.gmail.com)
- **From**: truenester4u@gmail.com
- **To**: info@truenester.com, truenester4u@gmail.com
- **Format**: HTML email with customer details

### Database Storage
- **Conversations**: Saved to Supabase
- **Messages**: Full chat history stored
- **Admin Panel**: http://localhost:8080/admin/conversations

## Test It Now!

### 1. Start Servers
```bash
# Option A: Use the batch file
start-with-notifications.bat

# Option B: Manual (2 terminals)
# Terminal 1:
cd truenester-chatbot-api && npm run dev

# Terminal 2:
npm run dev
```

### 2. Test with Script
```bash
node test-chatbot-notifications.js
```

**Expected output:**
```
🧪 Testing Chatbot Notification Integration
✅ SUCCESS! Lead submitted successfully
📬 NOTIFICATIONS:
   ✓ Slack notification sent
   ✓ Email notification sent
```

### 3. Test with Real Chatbot
1. Open http://localhost:8080
2. Click chatbot widget (💬 bottom-right)
3. Have a conversation
4. Provide your details:
   - Name
   - Phone
   - Email (optional)
   - Budget, area, preferences
5. Submit

**Check results:**
- ✅ Slack: New message in your workspace
- ✅ Email: Check info@truenester.com or truenester4u@gmail.com
- ✅ Admin: http://localhost:8080/admin/conversations

## Notification Preview

### Slack Message
```
🤖 New Chatbot Conversation

Name: John Doe
Intent: buy
Email: john@example.com
Phone: +971501234567
Budget: AED 1.5M - 2M
Property Type: Apartment
Area: Dubai Marina
Lead Score: 85/100

Duration: 3 minutes

[View in Admin Panel →]
```

### Email
```
Subject: 🤖 New Chatbot Lead - John Doe (Hot Lead - 85/100)

Dubai Nest Hub - New Chatbot Conversation

Customer: John Doe
Contact: john@example.com | +971501234567
Intent: Buying property
Budget: AED 1.5M - 2M
Property Type: Apartment
Preferred Area: Dubai Marina

Lead Score: 85/100 (Hot Lead)
Duration: 3 minutes

[View Full Conversation in Admin Panel]
```

## Troubleshooting

### Backend Not Starting?
```bash
cd truenester-chatbot-api
npm install  # Install dependencies first
npm run dev
```

### Notifications Not Sending?

**Check Backend Logs:**
```
[SLACK] Notification sent successfully     ← Good!
[EMAIL] ✅ Email sent successfully!        ← Good!
[NOTIFICATION] ❌ All channels failed      ← Problem!
```

**If Slack fails:**
1. Verify webhook URL in `truenester-chatbot-api/.env`
2. Test webhook: https://api.slack.com/messaging/webhooks

**If Email fails:**
1. Check credentials in `truenester-chatbot-api/.env`
2. Ensure Gmail App Password is correct
3. Check Gmail account has 2FA enabled

### Frontend Not Connecting?

**Check `.env` has:**
```env
VITE_CHATBOT_API_URL="http://localhost:4000/api"
```

**Restart frontend after `.env` change:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

### CORS Errors?

Backend is configured for localhost:8080. If using different port, add to `truenester-chatbot-api/src/server.ts`:
```typescript
"http://localhost:YOUR_PORT",
```

## Verify Everything Works

### Checklist
- [ ] Backend running on http://localhost:4000
- [ ] Frontend running on http://localhost:8080
- [ ] Test script completes successfully
- [ ] Slack notification received
- [ ] Email notification received
- [ ] Conversation appears in admin panel
- [ ] Chat messages stored correctly
- [ ] Lead score calculated (0-100)

### Quick Verification Commands
```bash
# Check backend is responding
curl http://localhost:4000/api/health

# Check frontend is serving
curl http://localhost:8080

# Test notification with script
node test-chatbot-notifications.js
```

## What Happens When Lead is Captured?

### Automatic Process
1. **User submits chatbot form** → Frontend sends POST to `/api/chatbot/leads`
2. **Backend receives data** → Validates payload with Zod schema
3. **Save to database** → Creates conversation + messages in Supabase
4. **Send notifications** → Parallel calls to Slack, Email, (Telegram optional)
5. **Return success** → Frontend shows confirmation to user

### Timeline
- **Database save**: < 500ms
- **Slack notification**: ~1-2 seconds
- **Email notification**: ~2-3 seconds
- **Total time**: ~3-5 seconds

### Notification Channels
```
Chatbot Lead Submitted
         ↓
    Backend API
    ↙    ↓    ↘
Slack  Email  Database
   ✓     ✓      ✓
(All parallel, non-blocking)
```

## Next Steps

### Production Deployment
See `CHATBOT_NOTIFICATIONS_SETUP.md` for:
- Environment variables for Render/Heroku/Railway
- Production webhook URLs
- Email service configuration
- Monitoring and logging

### Customization
- **Change email recipients**: Edit `truenester-chatbot-api/src/services/notification-service.ts` line 163
- **Customize Slack format**: Edit `buildSlackMessage()` in notification-service.ts
- **Add Telegram**: Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in backend `.env`

### Monitoring
- Backend logs show all notification attempts
- Admin panel shows all conversations
- Check Slack/Email for delivery confirmation

## Support

**Backend logs show everything:**
```bash
cd truenester-chatbot-api
npm run dev

# Watch for:
[NOTIFICATION] ✅ Sent via: Slack, Email
[SLACK] Notification sent successfully
[EMAIL] ✅ Email sent successfully!
```

**If something fails:**
1. Check backend `.env` credentials
2. Verify network connectivity
3. Test webhooks individually
4. Review `CHATBOT_NOTIFICATIONS_SETUP.md`

---

## Summary

✨ **Your chatbot is fully integrated with Slack and Email!**

**Just run:**
```bash
start-with-notifications.bat
# or
node test-chatbot-notifications.js
```

All notifications are automatic - no additional code needed!
