# Deployment Environment Variables Guide

This guide explains all the environment variables needed for Slack, Email, and Admin Panel notifications to work correctly in production.

## 🚨 IMPORTANT: Update Production API URL

**Before deploying**, update the `PRODUCTION_API_URL` in `src/lib/api-config.ts` to match your actual Render backend URL:

```typescript
// In src/lib/api-config.ts, line 8:
const PRODUCTION_API_URL = "https://YOUR-ACTUAL-RENDER-APP-NAME.onrender.com/api";
```

Replace `YOUR-ACTUAL-RENDER-APP-NAME` with your Render service name.

---

## Vercel (Frontend) Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

| Variable | Required | Example Value |
|----------|----------|---------------|
| `VITE_SUPABASE_URL` | ✅ Yes | `https://jwmbxpqpjxqclfcahwcf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Your Supabase anon key |
| `VITE_ADMIN_API_URL` | ✅ Yes | `https://YOUR-RENDER-APP.onrender.com/api` |
| `VITE_CHATBOT_API_URL` | ✅ Yes | `https://YOUR-RENDER-APP.onrender.com/api` |
| `VITE_SLACK_WEBHOOK_URL` | Optional | Your Slack webhook (for frontend backup) |

### After Adding Variables:
1. Click "Save"
2. **Redeploy your site** (Settings → Deployments → Redeploy)

---

## Render (Backend) Environment Variables

Go to: **Render Dashboard → Your Service → Environment**

### Required Variables:

| Variable | Required | Example Value |
|----------|----------|---------------|
| `SUPABASE_URL` | ✅ Yes | `https://jwmbxpqpjxqclfcahwcf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Your Supabase service role key (from Project Settings → API) |
| `FRONTEND_URL` | ✅ Yes | `https://your-app.vercel.app` (your Vercel domain) |
| `PORT` | ✅ Yes | `4000` (or Render default) |

### Slack Notifications:

| Variable | Required | Example Value |
|----------|----------|---------------|
| `SLACK_WEBHOOK_URL` | ✅ Yes | `https://hooks.slack.com/services/XXX/YYY/ZZZ` |

**To get Slack Webhook URL:**
1. Go to https://api.slack.com/apps
2. Create/select your app
3. Go to "Incoming Webhooks"
4. Create a new webhook for your channel
5. Copy the webhook URL

### Email Notifications (SMTP):

| Variable | Required | Example Value |
|----------|----------|---------------|
| `EMAIL_HOST` | ✅ Yes | `smtp.gmail.com` |
| `EMAIL_PORT` | ✅ Yes | `587` |
| `EMAIL_SECURE` | ✅ Yes | `false` |
| `EMAIL_USER` | ✅ Yes | `your-email@gmail.com` |
| `EMAIL_PASS` | ✅ Yes | Your app password (not regular password!) |
| `EMAIL_FROM` | Optional | `TrueNester <noreply@truenester.com>` |

**For Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an "App Password" for "Mail"
4. Use this app password (not your Gmail password)

### Telegram Notifications (Optional):

| Variable | Required | Example Value |
|----------|----------|---------------|
| `TELEGRAM_BOT_TOKEN` | Optional | `123456789:ABC-DEF...` |
| `TELEGRAM_CHAT_ID` | Optional | `-1001234567890` |

---

## How It Works (Auto-Detection)

The frontend now uses `src/lib/api-config.ts` which automatically:

1. **In Production** (on Vercel/Netlify): Uses `VITE_CHATBOT_API_URL` or `VITE_ADMIN_API_URL` or the hardcoded production URL
2. **In Development** (localhost): Uses `http://localhost:4000/api`

This means:
- ✅ Conversations are stored in admin panel (via Supabase)
- ✅ Slack notifications are sent (via backend API)
- ✅ Email notifications are sent (via backend API)
- ✅ All work in both local and production environments

---

## Verification Checklist

After deployment, verify:

1. **Backend Health Check:**
   ```
   curl https://YOUR-RENDER-APP.onrender.com/health
   ```
   Should return JSON with `slackConfigured: true`, `emailConfigured: true`

2. **Frontend Console:**
   - Open browser DevTools → Console
   - Look for `[API-CONFIG]` logs showing correct production URL
   - No `localhost` URLs should appear in production

3. **Test Submission:**
   - Submit a chatbot conversation
   - Check Slack channel for notification
   - Check email inbox for notification
   - Check Admin Panel → Conversations

---

## Troubleshooting

### "Conversations work but no Slack/Email"
- Check Render environment variables are set correctly
- Check Render service logs for `[SLACK]` or `[EMAIL]` errors
- Verify webhook URL is correct and channel exists

### "No conversations in admin panel"
- Check Supabase credentials are correct
- Check browser console for API errors
- Verify `VITE_ADMIN_API_URL` is set in Vercel

### "CORS errors in console"
- Add your Vercel domain to `allowedOrigins` in `truenester-chatbot-api/src/server.ts`
- Set `FRONTEND_URL` in Render environment

### "Email not sending"
- For Gmail: Use App Password, not regular password
- Check `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` are correct
- Check Render logs for `[EMAIL]` errors
