# 🚨 URGENT: Fix Render Configuration

## The Problem
Your Render backend is returning 404 because it's looking at the wrong directory.

## The Fix (Takes 2 Minutes)

### Go to Render Dashboard:
1. Open https://dashboard.render.com
2. Click on **TrueNester_api** service
3. Click **Settings** (left sidebar)

### Update These Settings:

| Setting | Current (Wrong) | Change To (Correct) |
|---------|----------------|---------------------|
| **Root Directory** | `.` or empty | `truenester-chatbot-api` |
| **Build Command** | `npm install` | `cd truenester-chatbot-api && npm install` |
| **Start Command** | `npm start` | `cd truenester-chatbot-api && npm start` |

### Alternative (Simpler):

If the above doesn't work, just set:
- **Root Directory**: `truenester-chatbot-api`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### After Changing:
1. Scroll to bottom
2. Click **"Save Changes"**
3. Render will auto-redeploy (takes 2-3 minutes)

---

## How to Verify It Worked

After Render shows "Live", test these URLs in your browser:

1. **Health Check:**
   ```
   https://truenester-api.onrender.com/health
   ```
   Should return JSON with `status: "ok"`

2. **Property Inquiry Endpoint (will fail but shouldn't 404):**
   ```
   https://truenester-api.onrender.com/api/property-inquiry
   ```
   Should return error about missing data (not 404)

---

## Why This Happened

Your GitHub repo structure:
```
dubai-nest-hub/
├── src/                    ← Frontend code
├── truenester-chatbot-api/ ← Backend code (THIS is what Render needs)
│   ├── src/
│   │   └── server.ts
│   └── package.json
└── package.json            ← Frontend package.json (WRONG ONE)
```

Render was running the **frontend** `package.json` instead of the **backend** one.

---

## Screenshot Guide

When you open Render Settings, you should see something like this:

**Before (Wrong):**
```
Root Directory: [empty or .]
```

**After (Correct):**
```
Root Directory: truenester-chatbot-api
```

---

## If Still Not Working

Check Render Logs:
1. Render Dashboard → TrueNester_api
2. Click **"Logs"** tab
3. Look for errors like:
   - `Cannot find module 'express'`
   - `Error: Cannot find package.json`
   - `ENOENT: no such file or directory`

These confirm the directory issue.

---

## Quick Test After Fix

Once Render redeploys successfully:

1. Go to your Vercel site
2. Open chatbot
3. Submit a test conversation
4. Check:
   - ✅ Slack notification arrives
   - ✅ Email arrives
   - ✅ Admin panel shows conversation

**Let me know when you've updated Render settings!**
