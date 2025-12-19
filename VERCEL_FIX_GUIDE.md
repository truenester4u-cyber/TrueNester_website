# 🔧 Vercel Deployment Fix Guide - Slack & Admin Conversations

## 🎯 Problem Summary

Your website is deployed on Vercel, but:
- ❌ Slack notifications are not working
- ❌ Admin panel conversations are not loading
- ❌ Chatbot conversations are not being saved

## 🔍 Root Cause

The backend API (`truenester-chatbot-api`) is a separate Express server that needs to be deployed separately. Vercel only hosts the frontend React app.

## ✅ Solution Overview

You have **two options**:

### Option 1: Deploy Backend Separately (Recommended)
Deploy the backend API on Render, Railway, or another platform, then configure Vercel to connect to it.

### Option 2: Use Vercel Serverless Functions
Convert API calls to use Vercel serverless functions (more complex, but keeps everything on Vercel).

---

## 🚀 Option 1: Deploy Backend Separately (EASIEST)

### Step 1: Deploy Backend API on Render.com

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `dubai-nest-hub-api`
   - **Root Directory**: `truenester-chatbot-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

5. **Add Environment Variables** (in Render dashboard):
   ```
   PORT=4000
   NODE_ENV=production
   SUPABASE_URL=https://jwmbxpqpjxqclfcahwcf.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   ADMIN_API_KEY=TrueNester2025_AdminAPI_SecureKey_Dubai_Development_Production_v1
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

6. **Deploy** - Render will automatically deploy your backend
7. **Copy your Render URL** (e.g., `https://dubai-nest-hub-api.onrender.com`)

### Step 2: Configure Vercel Environment Variables

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add these variables** (for Production, Preview, and Development):

   ```
   VITE_SUPABASE_URL=https://jwmbxpqpjxqclfcahwcf.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
   VITE_ADMIN_API_URL=https://dubai-nest-hub-api.onrender.com/api
   VITE_CHATBOT_API_URL=https://dubai-nest-hub-api.onrender.com/api
   VITE_SLACK_WEBHOOK_URL=your_slack_webhook_url
   ```

5. **Redeploy** your Vercel site (Settings → Deployments → Redeploy)

### Step 3: Update Backend CORS (Already Done ✅)

The backend CORS has been updated to allow Vercel domains. Make sure your `FRONTEND_URL` environment variable in Render matches your Vercel URL.

---

## 🛠️ Option 2: Use Vercel Serverless Functions

If you prefer to keep everything on Vercel, you can create serverless functions to proxy API calls.

### Create API Proxy Functions

The `api/` directory already has `submit-contact.js`. You'll need to create additional proxy functions for:
- `/api/chatbot/leads` → Proxy to backend
- `/api/admin/conversations` → Proxy to backend

However, this requires the backend to still be deployed somewhere, so **Option 1 is recommended**.

---

## 📋 Environment Variables Checklist

### Vercel (Frontend) - Required:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ `VITE_ADMIN_API_URL` (your backend API URL)
- ✅ `VITE_CHATBOT_API_URL` (your backend API URL)
- ✅ `VITE_SLACK_WEBHOOK_URL` (optional, for frontend Slack notifications)

### Backend API (Render/Railway/etc) - Required:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SLACK_WEBHOOK_URL`
- ✅ `ADMIN_API_KEY`
- ✅ `FRONTEND_URL` (your Vercel URL)
- ✅ `PORT` (usually 4000)

---

## 🧪 Testing After Deployment

1. **Test Backend Health:**
   ```bash
   curl https://your-backend-api.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

2. **Test Admin Panel:**
   - Visit: `https://your-vercel-app.vercel.app/admin/conversations`
   - Should load conversations without errors

3. **Test Chatbot:**
   - Open chatbot on your site
   - Have a conversation
   - Check admin panel - conversation should appear

4. **Test Contact Form:**
   - Submit contact form
   - Check Slack for notification
   - Check admin panel for new conversation

5. **Test Property Inquiry:**
   - Submit property inquiry form
   - Check Slack for notification
   - Check admin panel for new conversation

---

## 🔍 Troubleshooting

### Issue: "Failed to fetch" errors in browser console

**Solution:**
- Check that `VITE_ADMIN_API_URL` and `VITE_CHATBOT_API_URL` are set correctly in Vercel
- Verify backend API is running (check Render dashboard)
- Check browser console for CORS errors
- Ensure backend CORS allows your Vercel domain

### Issue: Slack notifications not working

**Solution:**
- Verify `SLACK_WEBHOOK_URL` is set in backend environment variables
- Test webhook URL manually:
  ```bash
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d '{"text":"Test message"}'
  ```
- Check backend logs for Slack errors

### Issue: Conversations not appearing in admin panel

**Solution:**
- Check Supabase database - verify `conversations` and `chat_messages` tables exist
- Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is correct in Vercel
- Check browser console for Supabase errors
- Verify backend API is successfully creating conversations

### Issue: CORS errors

**Solution:**
- Backend CORS has been updated to allow Vercel domains
- Make sure `FRONTEND_URL` in backend matches your Vercel URL
- Check backend logs for CORS rejection messages

---

## 📚 Additional Resources

- **Render Deployment**: https://render.com/docs
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Slack Webhooks**: https://api.slack.com/messaging/webhooks

---

## ✅ Quick Checklist

- [ ] Backend API deployed on Render/Railway
- [ ] Backend environment variables configured
- [ ] Vercel environment variables configured
- [ ] Backend CORS updated (already done ✅)
- [ ] Vercel site redeployed
- [ ] Tested admin panel
- [ ] Tested chatbot
- [ ] Tested contact form
- [ ] Tested Slack notifications
- [ ] Verified conversations appear in admin panel

---

**Need Help?** Check the browser console and backend logs for specific error messages.



