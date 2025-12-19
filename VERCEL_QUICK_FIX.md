# ⚡ Quick Fix for Vercel - Slack & Admin Conversations

## 🎯 The Problem
Your Vercel deployment is missing:
- Backend API connection
- Environment variables
- Slack webhook configuration

## 🚀 5-Minute Fix

### Step 1: Deploy Backend (2 minutes)

1. Go to **[Render.com](https://render.com)** → Sign up/Login
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `truenester-chatbot-api`
   - **Build**: `npm install`
   - **Start**: `npm start`
5. Add Environment Variables:
   ```
   SUPABASE_URL=https://jwmbxpqpjxqclfcahwcf.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=(get from Supabase dashboard)
   SLACK_WEBHOOK_URL=(your Slack webhook)
   ADMIN_API_KEY=TrueNester2025_AdminAPI_SecureKey_Dubai_Development_Production_v1
   FRONTEND_URL=https://your-app.vercel.app
   PORT=4000
   ```
6. **Deploy** → Copy your Render URL (e.g., `https://dubai-nest-hub-api.onrender.com`)

### Step 2: Configure Vercel (2 minutes)

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Select your project → **Settings → Environment Variables**
3. Add these (for Production):
   ```
   VITE_SUPABASE_URL=https://jwmbxpqpjxqclfcahwcf.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=(get from Supabase dashboard)
   VITE_ADMIN_API_URL=https://dubai-nest-hub-api.onrender.com/api
   VITE_CHATBOT_API_URL=https://dubai-nest-hub-api.onrender.com/api
   VITE_SLACK_WEBHOOK_URL=(your Slack webhook)
   ```
4. **Redeploy** your site

### Step 3: Test (1 minute)

1. Visit: `https://your-app.vercel.app/admin/conversations`
2. Should load without errors ✅
3. Test chatbot → Check admin panel ✅
4. Test contact form → Check Slack ✅

## ✅ Done!

Your Slack notifications and admin conversations should now work!

## 🔍 Where to Get Keys

- **Supabase Keys**: https://supabase.com/dashboard/project/jwmbxpqpjxqclfcahwcf/settings/api
- **Slack Webhook**: https://api.slack.com/messaging/webhooks

## 📖 Full Guide

See `VERCEL_FIX_GUIDE.md` for detailed troubleshooting.



