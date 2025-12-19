# ⚠️ Manual Setup Required

The automated script couldn't add the API keys because the terminal is in non-interactive mode.

## Current Status:
✅ VITE_SUPABASE_URL - Added
✅ SUPABASE_URL - Added
❌ VITE_SUPABASE_PUBLISHABLE_KEY - **MISSING**
❌ SUPABASE_SERVICE_ROLE_KEY - **MISSING**

## 🔑 Get Your Keys:
Go to: https://app.supabase.com/project/jwmbxpqpjxqclfcahwcf/settings/api

You'll see:
- **anon public** key (long string starting with `eyJ...`)
- **service_role** key (long string starting with `eyJ...`)

## 📝 Add Keys Manually:

### Step 1: Add Anon Key
```powershell
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
```
When prompted:
1. Paste your **anon public** key
2. Press Enter
3. When asked "Mark as sensitive?" press **N** (it's a public key)

### Step 2: Add Service Role Key
```powershell
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```
When prompted:
1. Paste your **service_role** key
2. Press Enter
3. When asked "Mark as sensitive?" press **Y** (it's a secret!)

### Step 3: Verify
```powershell
vercel env ls
```
You should see 4 variables.

### Step 4: Redeploy
```powershell
vercel --prod --yes
```

## ✅ After Redeployment:
Test at: https://dubai-nest-hub-f3c99d5902f9f02eb444.vercel.app/admin/conversations

The conversations should load without errors!




