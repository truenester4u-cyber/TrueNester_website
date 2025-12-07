# Fix Conversations Integration - Quick Guide

## Problem
The chatbot shows "Sync hiccup detected" because the database tables don't exist yet.

## Solution - 3 Steps

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `jwmbxpqpjxqclfcahwcf`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy ALL the SQL from: `database-migrations/SIMPLE_CONVERSATIONS_SETUP.sql`
6. Paste it into the SQL Editor
7. Click **RUN** (bottom right)
8. You should see: "Success. No rows returned"

### Step 2: Start the Backend API

Open a terminal and run:

```bash
cd truenester-chatbot-api
npm install
npm run dev
```

You should see: `Admin conversations API listening on port 4000`

**Keep this terminal running!**

### Step 3: Test the Integration

1. Open your website in a browser
2. Click the chatbot icon (bottom right)
3. Complete a conversation with your name, email, and phone
4. Go to: `http://localhost:5173/admin/conversations`
5. You should see your conversation appear!

## Verify It's Working

### In the Chatbot:
- The green "Sync hiccup detected" message should disappear
- After providing contact info, you'll see confirmation

### In Admin Panel:
- Navigate to `/admin/conversations`
- You should see:
  - Conversation list with customer names
  - Full chat history
  - Lead scores and analytics
  - Export options

## Troubleshooting

### If conversations still don't appear:

1. **Check the backend is running**:
   - Terminal should show: `Admin conversations API listening on port 4000`
   - If not, run `npm run dev` in `truenester-chatbot-api` folder

2. **Check browser console**:
   - Press F12 → Console tab
   - Look for errors related to `/api/chatbot/leads`

3. **Check Supabase tables**:
   - Go to Supabase → Table Editor
   - You should see: `conversations`, `chat_messages`, `agents` tables
   - If not, re-run the SQL migration

4. **Check .env file**:
   - Verify `VITE_ADMIN_API_URL=http://localhost:4000/api`

## What Was Fixed

The original migration had an error:
- It referenced a `'manager'` role that doesn't exist
- The new migration disables RLS (Row Level Security) for simplicity
- You can enable RLS later for production security

## Next Steps

Once working:
- Test creating multiple conversations
- Try the filters (status, lead quality, intent)
- Export conversations to CSV/Excel
- Assign conversations to agents
- Schedule follow-ups
