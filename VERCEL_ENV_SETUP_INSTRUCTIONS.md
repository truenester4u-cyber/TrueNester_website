# Vercel Environment Variables Setup

## ✅ Already Added
- `VITE_SUPABASE_URL`: https://jwmbxpqpjxqclfcahwcf.supabase.co
- `SUPABASE_URL`: https://jwmbxpqpjxqclfcahwcf.supabase.co

## 🔑 Still Need to Add

### 1. Get Your Supabase Keys
Go to: https://app.supabase.com/project/jwmbxpqpjxqclfcahwcf/settings/api

You'll need:
- **anon/public key** (starts with `eyJ...`)
- **service_role key** (starts with `eyJ...`)  ⚠️ Keep this secret!

### 2. Add Keys to Vercel

Open your terminal and run these commands ONE AT A TIME:

```powershell
# Add the anon/public key (when prompted, paste your anon key)
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production

# Add the service role key (when prompted, paste your service role key)
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# (Optional) Add Slack webhook if you have one
vercel env add SLACK_WEBHOOK_URL production
```

### 3. Redeploy Your Site

After adding all keys, redeploy:

```powershell
vercel --prod --yes
```

## Quick Command

Or copy-paste this all at once (you'll be prompted for each value):

```powershell
Write-Host "Adding Supabase Anon Key..." -ForegroundColor Yellow
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production

Write-Host "`nAdding Supabase Service Role Key..." -ForegroundColor Yellow
vercel env add SUPABASE_SERVICE_ROLE_KEY production

Write-Host "`nRedeploying site..." -ForegroundColor Green
vercel --prod --yes
```

## Verify Setup

After redeployment, check:
1. Visit: https://dubai-nest-hub-f3c99d5902f9f02eb444.vercel.app/admin/conversations
2. The conversations should load without errors
3. Check browser console - no more "NetworkError" messages

## Troubleshooting

If you still see errors:
1. Run `vercel env ls` to verify all variables are set
2. Check that keys are correct (they should start with `eyJ`)
3. Make sure you added them to "production" environment




