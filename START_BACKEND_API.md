# Start Backend API - Step by Step

## Problem
The backend API is not running, so conversations can't be saved to the database.

## Fix - 2 Steps

### Step 1: Get Supabase Service Role Key

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `jwmbxpqpjxqclfcahwcf`
3. Click **Settings** (gear icon in left sidebar)
4. Click **API** in the settings menu
5. Scroll down to **Project API keys**
6. Find **service_role** key (NOT the anon key)
7. Click the **Copy** button next to it

### Step 2: Update .env File

1. Open: `truenester-chatbot-api/.env`
2. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with the key you copied
3. Save the file

The file should look like:
```
SUPABASE_URL=https://jwmbxpqpjxqclfcahwcf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bWJ4cHFwanhxY2xmY2Fod2NmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk1OTAxMywiZXhwIjoyMDc5NTM1MDEzfQ.ACTUAL_KEY_HERE
PORT=4000
```

### Step 3: Start the API

Open a terminal in the `truenester-chatbot-api` folder and run:

```bash
npm run dev
```

You should see:
```
Admin conversations API listening on port 4000
```

**Keep this terminal running!**

### Step 4: Test It

1. Refresh your website (http://localhost:8080)
2. Open the chatbot
3. Complete a conversation
4. The "Sync hiccup detected" error should be gone
5. Check `/admin/conversations` to see your conversation

## Troubleshooting

### If you see "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY"
- You didn't copy the service role key correctly
- Make sure there are no spaces or quotes around the key in .env file

### If you see "Cannot find module"
- Run `npm install` in the `truenester-chatbot-api` folder first

### If port 4000 is already in use
- Change `PORT=4000` to `PORT=4001` in the .env file
- Also update the main `.env` file: `VITE_ADMIN_API_URL=http://localhost:4001/api`

## Quick Commands

```bash
# Install dependencies (run once)
cd truenester-chatbot-api
npm install

# Start the API (run every time)
npm run dev

# Test the API
node test-api.js
```
