# 🚀 QUICK START - DEPLOYMENT GUIDE

## Before You Deploy

### 1. Validate Environment (2 min)
```bash
node validate-env.js
# Must show: "✅ All environment variables validated!"
```

### 2. Set Required Variables

**Frontend `.env`:**
```
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_PUBLISHABLE_KEY=xxx  
VITE_ADMIN_API_URL=https://api.yourdomain.com/api
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

**Backend `.env` (truenester-chatbot-api/):**
```
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ADMIN_API_KEY=<32-char-random>
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
FRONTEND_URL=https://yourdomain.com
PORT=4000
```

### 3. Local Build Test (3 min)
```bash
npm run build && npm run preview
# Should show no errors
```

---

## Deployment Checklist

- [ ] All env vars set and validated
- [ ] Build succeeds locally
- [ ] No errors in `npm run build` output
- [ ] `.env` file NOT in Git
- [ ] Backend ready (can start with `npm start`)
- [ ] Slack webhook tested

---

## Deploy Now

### Frontend (Vercel/Netlify/etc)
```
1. Push code: git push origin main
2. Platform auto-deploys
3. Set env vars in platform dashboard
4. Test: https://yourdomain.com
```

### Backend (Railway/Render/etc)
```
1. Navigate to truenester-chatbot-api folder
2. Platform auto-deploys on git push
3. Set env vars in platform dashboard
4. Test: curl https://api.yourdomain.com/health
```

---

## Post-Deploy (5 min)

✅ Test each feature:
```bash
# 1. Frontend loads
curl https://yourdomain.com

# 2. Admin works  
Open: https://yourdomain.com/admin

# 3. Contact form
Open: https://yourdomain.com/contact
Submit test → Check Slack

# 4. Chatbot
Open any property → Use chatbot
Check Slack for notification

# 5. Backend health
curl https://api.yourdomain.com/health
```

---

## If Something Fails

### Backend won't start?
```bash
# Check env vars
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check logs in hosting platform dashboard
# Verify all required vars are set
```

### Frontend not connecting to backend?
```bash
# Check VITE_ADMIN_API_URL is correct
# Check backend is running
curl https://api.yourdomain.com/health
```

### Slack notifications not received?
```bash
# Verify webhook URL is correct
# Check webhook still valid in Slack workspace
# Check backend logs for errors
```

---

## Success Indicators

You'll know it's working when:
- ✅ Frontend loads without errors
- ✅ Admin panel accessible with auth
- ✅ Contact form submits
- ✅ Slack gets notification immediately
- ✅ Conversation appears in admin panel
- ✅ No red errors in browser console
- ✅ Backend health check returns 200

---

## Important URLs

```
Frontend: https://yourdomain.com
Admin: https://yourdomain.com/admin
API: https://api.yourdomain.com/api
Health: https://api.yourdomain.com/health
```

---

## Emergency Rollback

If something breaks:
1. Go to hosting platform dashboard
2. Select previous deployment
3. Click "Redeploy"
4. Takes 2-5 minutes

---

**CRITICAL**: Never commit `.env` file to Git!

---

**Need Help?** See `PRODUCTION_DEPLOYMENT.md` for detailed guide.
