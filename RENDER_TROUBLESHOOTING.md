# Render Deployment Troubleshooting

## Current Issue
- `/health` endpoint works ✅
- `/api/property-inquiry` returns 404 ❌

## Possible Causes

### 1. Render Build Failed Silently
Check Render logs:
1. Go to Render Dashboard → TrueNester_api
2. Click **"Logs"** tab
3. Look for errors during the latest deployment
4. Common errors:
   - `npm install` failed
   - TypeScript compilation errors
   - Module not found errors

### 2. Render is Running Old Code
The `/health` endpoint exists in old code, but `/api/property-inquiry` was added later.

**Check deployment commit:**
1. Render Dashboard → TrueNester_api → Events
2. Look at the latest "Deploy succeeded" event
3. Check the commit hash - does it match your latest push?

Latest commit should be: `e3c204b` (just pushed)

### 3. Manual Redeploy Needed
Sometimes Render doesn't auto-deploy. Force it:
1. Render Dashboard → TrueNester_api
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Wait 2-3 minutes

### 4. Check Build Command Output
In Render Logs, you should see:
```
==> Building...
npm install
...
==> Starting service...
npm start
[TIMESTAMP] TrueNester Admin API listening on port 4000
```

If you see errors, that's the problem.

## Quick Test After Redeploy

Run these in your browser:

1. Health check (should work):
   ```
   https://truenester-api.onrender.com/health
   ```

2. Property inquiry (should return validation error, not 404):
   ```
   https://truenester-api.onrender.com/api/property-inquiry
   ```

3. Chatbot leads (should return validation error, not 404):
   ```
   https://truenester-api.onrender.com/api/chatbot/leads
   ```

## If Still 404 After Manual Redeploy

The issue might be with how Render is serving the routes. Check:

1. **Is Express starting correctly?**
   - Look for "listening on port 4000" in logs

2. **Are routes registered?**
   - Add console.log to server.ts to verify routes load

3. **Is there a reverse proxy issue?**
   - Render might be stripping `/api` prefix

## Next Steps

1. Check Render logs NOW
2. Look for the latest deployment commit hash
3. If it's not `e3c204b`, manually trigger deploy
4. Share any errors you see in the logs
