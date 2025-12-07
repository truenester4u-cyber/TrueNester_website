# Complete Slack Integration Guide - All Three Lead Sources

## 🎯 Overview

Your system now sends **Slack notifications for all three lead sources**:

1. ✅ **Contact Form** (General Inquiries)
2. ✅ **Chatbot Conversations** 
3. ✅ **Property Inquiry Forms**

All notifications go to the same Slack channel, giving you a unified view of all customer interactions.

---

## 📊 What Gets Sent to Slack

### 1️⃣ Contact Form Submissions
```
📬 New Contact Form Message
Name: Rajesh Kumar               Department: Sales
Email: rajesh@email.com          Phone: +91 98765 43210

Subject: Interested in 2BHK apartment
Message: Hi, I'm looking to invest in Dubai real estate...
[View in Admin Panel]
```

### 2️⃣ Chatbot Conversations
```
🤖 New Chatbot Conversation
Name: Priya Sharma               Intent: buy
Email: priya@email.com           Phone: +91 87654 32109
Budget: AED 1.5M                 Property Type: Apartment
Area: Dubai Marina               Lead Score: 75/100
Duration: 12 minutes
[View in Admin Panel]
```

### 3️⃣ Property Inquiry Forms
```
🏠 New Property Inquiry
Name: Ahmed Hassan               Property: Luxury 2BR Dubai Marina
Email: ahmed@email.com           Phone: +971 50 123 4567

Message: Interested in this property, can you send more details?
[View Property] [View in Admin]
```

---

## ✅ Setup Checklist

### Frontend (Main App)
- ✅ Contact form sends Slack notification when submitted
- ✅ Environment variable: `VITE_SLACK_WEBHOOK_URL`
- ✅ Location: `src/pages/Contact.tsx`

### Frontend (Property Pages)
- ✅ Property inquiry form sends Slack notification
- ✅ Environment variable: `VITE_SLACK_WEBHOOK_URL`
- ✅ Location: `src/pages/PropertyDetail.tsx`

### Backend (Admin API)
- ✅ Chatbot leads send Slack notification
- ✅ Environment variable: `SLACK_WEBHOOK_URL`
- ✅ Location: `truenester-chatbot-api/src/server.ts`
- ✅ Configuration: `FRONTEND_URL` for correct links

---

## 🚀 Environment Variables Required

### Frontend (.env)
```env
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Backend (truenester-chatbot-api/.env)
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
FRONTEND_URL=http://localhost:8080
```

**Note**: Both use the same webhook URL from Slack!

---

## 📝 Data Captured by Source

### Contact Form
- Full Name
- Email
- Phone
- Department (Sales, Support, Partnership, General)
- Subject
- Message
- Status: "new" (warm lead, score 60)
- Tags: [department, "contact-form", "general-inquiry"]

### Chatbot Conversation
- Customer Name
- Email & Phone
- Intent (buy, rent, invest, browse)
- Budget
- Property Type
- Preferred Area
- Lead Score (auto-calculated)
- Duration in minutes
- Chat history
- Status: "new"
- Tags: ["chatbot", intent]

### Property Inquiry
- Customer Name
- Email & Phone
- Property Title & URL
- Message
- Status: "new"
- Intent: "property_inquiry"
- Tags: ["property-inquiry", "contact"]

---

## 🎨 Slack Message Features

All messages include:
- ✅ Rich formatting with sections and fields
- ✅ Emoji icons for quick identification
- ✅ Action buttons linking to admin panel
- ✅ Contact information clearly displayed
- ✅ Source context for categorization

---

## 🔧 How It Works Behind the Scenes

### Contact Form Flow
```
1. User fills form → Validates
2. Creates conversation in Supabase
3. Creates message record
4. Sends Slack notification (no-cors mode)
5. Shows success toast
```

### Chatbot Flow
```
1. User completes chatbot conversation
2. Frontend sends to: /api/chatbot/leads
3. Backend receives payload
4. Creates conversation record
5. Inserts messages
6. Triggers Slack notification
7. Returns conversation ID
```

### Property Inquiry Flow
```
1. User fills property inquiry form
2. Validates form data
3. Creates conversation in Supabase
4. Sends Slack notification
5. Sends email via Supabase Edge Function
6. Shows success message
```

---

## 🧪 Testing All Three Sources

### Test 1: Contact Form
1. Go to: `http://localhost:8080/contact`
2. Fill all fields completely
3. Submit
4. Check Slack for 📬 icon message

### Test 2: Chatbot Conversation
1. Go to any property page: `http://localhost:8080/property/:id`
2. Look for chatbot widget (bottom right)
3. Have a conversation with the bot
4. Complete the lead capture
5. Check Slack for 🤖 icon message

### Test 3: Property Inquiry
1. Go to a property detail page
2. Scroll to "Schedule a Tour" or inquiry form
3. Fill out the form
4. Submit
5. Check Slack for 🏠 icon message

---

## 🎯 Admin Panel Integration

All three sources create conversations visible in `/admin/conversations`:

**Filter by Source:**
```
Contact Form:     tags = ["contact-form"]
Chatbot:          tags = ["chatbot"]
Property Inquiry: intent = "property_inquiry"
```

**Lead Quality:**
- Contact Form: Always "warm" (60 score)
- Chatbot: Auto-calculated (0-100 score)
- Property Inquiry: Variable (based on engagement)

---

## 📱 Mobile Notifications

Install Slack mobile app to get:
- ✅ Push notifications on your phone
- ✅ Instant alerts for new inquiries
- ✅ Ability to respond from mobile
- ✅ Thread conversations

---

## 🐛 Troubleshooting

### Slack Messages Not Appearing

**Check 1: Environment Variables**
```sh
# Frontend
echo $VITE_SLACK_WEBHOOK_URL

# Backend
cd truenester-chatbot-api
echo $SLACK_WEBHOOK_URL
```

**Check 2: Restart Services**
```sh
# Stop both
Ctrl+C in both terminals

# Restart Frontend
npm run dev

# Restart Backend (in new terminal)
cd truenester-chatbot-api
npm run dev
```

**Check 3: Webhook Status**
1. Go to: https://api.slack.com/apps
2. Select your app
3. Click "Incoming Webhooks"
4. Scroll to "Recent Deliveries"
5. Look for green ✅ or red ❌ status

**Check 4: Browser Console**
Press F12 → Console tab → Look for errors about Slack

### Contact Form Sends But Chatbot Doesn't

- Backend may not be running
- Check terminal for `npm run dev` in `truenester-chatbot-api/`
- Verify `SLACK_WEBHOOK_URL` is in backend `.env`

### Property Inquiry Doesn't Send

- Check `VITE_SLACK_WEBHOOK_URL` in main `.env`
- Verify PropertyDetail.tsx has the updated code
- Check browser console for errors
- Ensure property page is accessible

---

## 💡 Pro Tips

### 1. Organize with Threads
Reply to Slack messages to create threads:
```
Initial Message: New lead "Rajesh Kumar"
  └─ Reply 1: Assigned to agent "Ahmed"
  └─ Reply 2: Follow-up scheduled for tomorrow
  └─ Reply 3: Waiting for financing docs
```

### 2. Use Reactions
React to messages to categorize:
- 🔥 Hot lead (need immediate follow-up)
- 👍 Positive (good prospect)
- ❌ Not interested
- 📞 Called back
- ✅ Converted

### 3. Pin Important Messages
Right-click message → "Pin to channel" for high-value leads

### 4. Search Slack History
Search in Slack:
```
from:truenester "Dubai Marina"  # Find all Marina inquiries
is:unread                        # See unread inquiries
has:link                         # Messages with links
```

### 5. Customize Notifications
Slack settings → Notification preferences:
- Alert frequency
- Sound/vibration
- Desktop vs mobile
- Mute during hours

---

## 🔐 Security Notes

⚠️ **Webhook URL Security**
- Never commit `.env` files to git (already in `.gitignore`)
- Webhook URLs are secrets - treat like passwords
- If exposed, regenerate immediately from Slack
- Consider using environment-specific webhooks

✅ **Best Practices**
- Use same webhook for all sources (simpler to manage)
- Rotate quarterly for security
- Monitor "Recent Deliveries" for failures
- Only team members should see Slack

---

## 📊 What Happens Next

After notification is sent:

1. **In Slack**
   - Message appears with rich formatting
   - Can reply or add reactions
   - Message goes to channel history

2. **In Admin Panel** (`/admin/conversations`)
   - Conversation visible immediately
   - Can assign to agent
   - Can add notes or schedule follow-up
   - Status visible (new, in-progress, closed)

3. **In Database**
   - Full conversation stored
   - All messages logged
   - Lead score calculated
   - Tags automatically applied

---

## 🚀 Advanced Features (Future)

Potential enhancements:
- [ ] SMS notifications for hot leads
- [ ] WhatsApp Business integration
- [ ] CRM sync (Salesforce, HubSpot)
- [ ] Auto-assignment to agents
- [ ] Lead quality scoring visualization
- [ ] Analytics dashboard in Slack
- [ ] Chatbot handoff to human agents
- [ ] Payment schedule notifications

---

## 📚 Reference

**Files Modified:**
- `src/pages/Contact.tsx` - Contact form + Slack
- `src/pages/PropertyDetail.tsx` - Property inquiry + Slack
- `truenester-chatbot-api/src/server.ts` - Chatbot + Slack
- `.env` - Frontend Slack webhook
- `truenester-chatbot-api/.env` - Backend Slack webhook

**Key Functions:**
- `sendSlackNotification()` - Backend notification sender
- Contact form's `handleSubmit()` - Frontend notification
- Property form's submission logic - Inquiry notification

**Environment Variables:**
- `VITE_SLACK_WEBHOOK_URL` - Frontend (Contact + Property)
- `SLACK_WEBHOOK_URL` - Backend (Chatbot)
- `FRONTEND_URL` - Backend (Link generation)

---

**Implementation Date**: December 2025
**Status**: ✅ Complete - All Three Sources Active
**Slack Integration**: ✅ Ready to Use

Start getting instant notifications for all customer inquiries! 🎉
