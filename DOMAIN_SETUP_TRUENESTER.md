# TrueNester.com Domain Setup Guide

## Your Configuration

| Component | Current URL | Target URL |
|-----------|-------------|------------|
| **Frontend** | dubai-nest-hub-f3c99d5902f9f02eb444.vercel.app | truenester.com |
| **Backend API** | truenester-api.onrender.com | api.truenester.com |

---

## Step 1: GoDaddy DNS Configuration

### Login to GoDaddy
1. Go to [GoDaddy](https://www.godaddy.com)
2. Navigate to **My Products** → **DNS** for truenester.com

### Delete Old Records (Important!)
Before adding new records, **delete any existing A, AAAA, or CNAME records** for:
- `@` (root domain)
- `www`
- `api` (if exists)

### Add New DNS Records

#### For Frontend (Vercel) - Root Domain
| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `76.76.21.21` | 600 |

#### For Frontend (Vercel) - WWW Subdomain
| Type | Name | Value | TTL |
|------|------|-------|-----|
| **CNAME** | `www` | `cname.vercel-dns.com` | 600 |

#### For Backend API - api.truenester.com
| Type | Name | Value | TTL |
|------|------|-------|-----|
| **CNAME** | `api` | `truenester-api.onrender.com` | 600 |

### Screenshot Guide for GoDaddy DNS:
```
┌─────────────────────────────────────────────────────────────┐
│ DNS Management for truenester.com                           │
├──────┬──────┬─────────────────────────────────┬─────────────┤
│ Type │ Name │ Value                           │ TTL         │
├──────┼──────┼─────────────────────────────────┼─────────────┤
│ A    │ @    │ 76.76.21.21                     │ 600 seconds │
│ CNAME│ www  │ cname.vercel-dns.com            │ 600 seconds │
│ CNAME│ api  │ truenester-api.onrender.com     │ 600 seconds │
└──────┴──────┴─────────────────────────────────┴─────────────┘
```

---

## Step 2: Vercel Domain Configuration

### Add Custom Domain in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **dubai-nest-hub-f3c99d5902f9f02eb444**
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `truenester.com`
6. Click **Add**
7. Repeat for: `www.truenester.com`

### Vercel Environment Variables
Go to **Settings** → **Environment Variables** and update:

| Variable | Value |
|----------|-------|
| `VITE_ADMIN_API_URL` | `https://api.truenester.com/api` |
| `VITE_CHATBOT_API_URL` | `https://api.truenester.com/api` |
| `VITE_SLACK_WEBHOOK_URL` | (your Slack webhook - keep existing) |

**Important:** After adding variables, trigger a **Redeploy** for changes to take effect.

---

## Step 3: Render Backend Configuration

### Add Custom Domain in Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select service: **truenester-api**
3. Go to **Settings** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter: `api.truenester.com`
6. Render will show you the CNAME target (should match `truenester-api.onrender.com`)

### Render Environment Variables
Go to **Environment** tab and ensure these are set:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://truenester.com` |
| `SUPABASE_URL` | (your Supabase URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | (your service role key) |
| `SLACK_WEBHOOK_URL` | (your Slack webhook) |
| `ADMIN_API_KEY` | (generate a 32+ char random string) |

### Optional Notification Channels:
| Variable | Value |
|----------|-------|
| `TELEGRAM_BOT_TOKEN` | (from @BotFather) |
| `TELEGRAM_CHAT_ID` | (from @userinfobot) |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | (your email) |
| `EMAIL_PASS` | (app password) |
| `EMAIL_FROM` | `TrueNester <noreply@truenester.com>` |

---

## Step 4: Verify SSL Certificates

### Vercel SSL
- Vercel automatically provisions SSL certificates
- Wait 5-10 minutes after adding domain
- Visit https://truenester.com to verify

### Render SSL
- Render automatically provisions SSL for custom domains
- Wait 5-10 minutes after DNS propagation
- Visit https://api.truenester.com/health to verify

---

## Step 5: Test All Integrations

### 1. Test Backend Health
```bash
curl https://api.truenester.com/health
```
Expected response:
```json
{
  "status": "ok",
  "slackConfigured": true,
  "telegramConfigured": true/false,
  "emailConfigured": true/false
}
```

### 2. Test Frontend
- Visit https://truenester.com
- Open chatbot and submit a test conversation
- Check Slack channel for notification

### 3. Test Admin Panel
- Visit https://truenester.com/admin
- Login and verify conversations load
- Check that Slack notification buttons link to truenester.com

### 4. Test Slack Integration
Slack notifications should now show:
- "View in Admin Panel" → links to https://truenester.com/admin/conversations
- "View All Conversations" → links to https://truenester.com/admin/conversations

### 5. Test Email Integration
If email is configured, notifications should include:
- Correct admin panel links to https://truenester.com

---

## DNS Propagation

DNS changes can take **up to 48 hours** to propagate globally.

### Check Propagation Status
Use these tools to verify:
- [whatsmydns.net](https://www.whatsmydns.net/#A/truenester.com)
- [dnschecker.org](https://dnschecker.org)

### Expected Results:
| Domain | Type | Expected Value |
|--------|------|----------------|
| truenester.com | A | 76.76.21.21 |
| www.truenester.com | CNAME | cname.vercel-dns.com |
| api.truenester.com | CNAME | truenester-api.onrender.com |

---

## Troubleshooting

### CORS Errors
If you see CORS errors after domain change:
1. Verify `FRONTEND_URL` is set to `https://truenester.com` on Render
2. Redeploy the backend on Render
3. Clear browser cache

### SSL Certificate Not Working
1. Wait 10-15 minutes for auto-provisioning
2. Check that DNS records are correct
3. Force SSL renewal in Vercel/Render dashboard

### Slack Buttons Wrong URL
1. Update `FRONTEND_URL` on Render to `https://truenester.com`
2. Redeploy the backend
3. New notifications will use correct URLs

### Admin Page Not Loading Conversations
1. Verify `VITE_ADMIN_API_URL` in Vercel is `https://api.truenester.com/api`
2. Redeploy frontend on Vercel
3. Check browser console for API errors

---

## Quick Reference

| Service | Dashboard | Custom Domain |
|---------|-----------|---------------|
| Frontend | [Vercel](https://vercel.com) | truenester.com |
| Backend | [Render](https://render.com) | api.truenester.com |
| DNS | [GoDaddy](https://godaddy.com) | Manage DNS |
| Database | [Supabase](https://supabase.com) | N/A |

---

## Final Checklist

- [ ] GoDaddy: A record for @ → 76.76.21.21
- [ ] GoDaddy: CNAME for www → cname.vercel-dns.com
- [ ] GoDaddy: CNAME for api → truenester-api.onrender.com
- [ ] Vercel: Added truenester.com domain
- [ ] Vercel: Added www.truenester.com domain
- [ ] Vercel: Updated VITE_ADMIN_API_URL to https://api.truenester.com/api
- [ ] Vercel: Redeployed after env changes
- [ ] Render: Added api.truenester.com custom domain
- [ ] Render: Updated FRONTEND_URL to https://truenester.com
- [ ] Render: Redeployed after env changes
- [ ] Tested: Frontend loads at https://truenester.com
- [ ] Tested: API health at https://api.truenester.com/health
- [ ] Tested: Chatbot submits and Slack receives notification
- [ ] Tested: Admin panel loads conversations
- [ ] Tested: Slack buttons link to truenester.com
