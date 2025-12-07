# QUICK FIX - Get Conversations Working NOW

## The Issue
Your backend API is not running. That's why you see:
- ❌ "Failed to fetch" errors in browser console
- ❌ "Sync hiccup detected" in chatbot
- ❌ No conversations in admin panel

## The Solution (5 Minutes)

### 1️⃣ Get Your Supabase Service Key

Go to: https://supabase.com/dashboard/project/jwmbxpqpjxqclfcahwcf/settings/api

Look for **"service_role"** key (NOT "anon" key) and copy it.

### 2️⃣ Update the .env File

Open: `truenester-chatbot-api/.env`

Replace this line:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk1OTAxMywiZXhwIjoyMDc5NTM1MDEzfQ.YOUR_SERVICE_ROLE_KEY_HERE
```

With the actual key you copied (paste after the last dot).

### 3️⃣ Start the Backend

Open a NEW terminal and run these commands:

```bash
cd truenester-chatbot-api
npm run dev
```

You should see:
```
Admin conversations API listening on port 4000
```

✅ **KEEP THIS TERMINAL OPEN!**

### 4️⃣ Test It

1. Go back to your website: http://localhost:8080
2. Open the chatbot (bottom right)
3. Have a conversation and provide your details
4. Go to: http://localhost:8080/admin/conversations
5. You should see your conversation! 🎉

## Still Not Working?

### Check 1: Did you run the database migration?
- Go to Supabase → SQL Editor
- Run the SQL from: `database-migrations/SIMPLE_CONVERSATIONS_SETUP.sql`

### Check 2: Is the API actually running?
- Look at the terminal where you ran `npm run dev`
- It should say "Admin conversations API listening on port 4000"
- If you see errors, share them with me

### Check 3: Browser console errors?
- Press F12 in your browser
- Go to Console tab
- Look for any red errors
- They should be gone now

## What You're Running

You need TWO terminals running:

**Terminal 1** - Frontend (Vite dev server)
```bash
npm run dev
```

**Terminal 2** - Backend API (Express server)
```bash
cd truenester-chatbot-api
npm run dev
```

Both must be running for conversations to work!
