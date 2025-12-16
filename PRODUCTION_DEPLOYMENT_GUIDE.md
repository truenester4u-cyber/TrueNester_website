# 🚀 PRODUCTION DEPLOYMENT SETUP GUIDE
# =====================================

## 🌐 NETLIFY FRONTEND DEPLOYMENT

### Step 1: Update Netlify Environment Variables
Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables

**Add these environment variables:**
```
VITE_SUPABASE_PROJECT_ID=jwmbxpqpjxqclfcahwcf
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTkwMTMsImV4cCI6MjA3OTUzNTAxM30.E42ID3TPcEnnZ4U1x5OcU5Vgmx3icVEOFeb8Ywmt4Yo
VITE_SUPABASE_URL=https://jwmbxpqpjxqclfcahwcf.supabase.co
VITE_ADMIN_API_URL=https://truenester-api.onrender.com/api
VITE_CHATBOT_API_URL=https://truenester-api.onrender.com/api
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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
```

## 🖥️ BACKEND API DEPLOYMENT (Required!)

### Your backend API needs to be deployed. Options:

#### Option 1: Deploy on Render.com (Recommended)
1. Go to https://render.com
2. Connect your GitHub repository
3. Deploy the `truenester-chatbot-api` folder as a Web Service
4. Set environment variables:
   ```
   PORT=4000
   SUPABASE_URL=https://jwmbxpqpjxqclfcahwcf.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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
   FRONTEND_URL=https://your-netlify-site.netlify.app
   ADMIN_API_KEY=your_secure_admin_api_key
   ```

#### Option 2: Deploy on Railway.app
1. Go to https://railway.app
2. Deploy from GitHub
3. Same environment variables as above

#### Option 3: Deploy on Vercel (Serverless)
1. Go to https://vercel.com
2. Deploy the `truenester-chatbot-api` folder
3. Same environment variables

## 🔧 CURRENT ISSUES & SOLUTIONS

### Issue 1: Chatbot conversations not showing in admin panel
**Cause**: Frontend trying to connect to localhost:4000 instead of production API
**Solution**: ✅ Fixed by updating VITE_ADMIN_API_URL

### Issue 2: Property forms not showing in admin panel  
**Cause**: Same as above - API URL mismatch
**Solution**: ✅ Fixed by updating VITE_ADMIN_API_URL

### Issue 3: Forms work in Slack but not admin panel
**Cause**: Slack webhook works directly, but admin panel needs the backend API
**Solution**: ✅ Deploy backend API and update URLs

## 📋 DEPLOYMENT CHECKLIST

- [ ] ✅ Update .env file (Done)
- [ ] 🚀 Deploy backend API to Render/Railway/Vercel
- [ ] 🌐 Update Netlify environment variables  
- [ ] 🔄 Redeploy Netlify site after env var changes
- [ ] 🧪 Test chatbot conversations flow
- [ ] 🧪 Test admin panel conversation management
- [ ] 🧪 Test property form submissions
- [ ] 🧪 Test admin login with new password

## 🆘 QUICK FIX (If backend not ready)

If you can't deploy the backend API immediately, you can temporarily disable admin features:

1. Comment out chatbot widget in production
2. Use contact forms that go directly to Slack
3. Disable admin conversation management

**But for full functionality, you MUST deploy the backend API.**

## 🔗 USEFUL LINKS

- Supabase Dashboard: https://supabase.com/dashboard
- Netlify Dashboard: https://app.netlify.com
- Render.com: https://render.com
- Railway.app: https://railway.app

## 🔑 SECURITY NOTES

- Never commit .env files with real keys to Git
- Use different API keys for production vs development
- Set up CORS properly in your backend for your Netlify domain
- Use HTTPS only in production