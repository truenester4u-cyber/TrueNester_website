# User Activity History - Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration (Required)
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy all content from `supabase_migration_user_activity.sql`
3. Paste and click **"Run"**
4. Verify table exists: **Table Editor** → `user_activity`

### Step 2: Install Dependency
```bash
npm install date-fns
```

### Step 3: Start Your Server
```bash
npm run dev
```

## ✅ What You Get

- **Activity Tab in Dashboard** - Shows timeline of user actions
- **Auto-tracked Favorites** - Logs when properties are saved/unsaved
- **Color-coded Icons** - Visual indicators for different activity types
- **Timestamps** - "2 hours ago", "Yesterday", etc.
- **Property Links** - Click to view referenced properties

## 📸 Where to Find It

1. Log in as a customer
2. Go to **Dashboard** (click user avatar)
3. Click **"Activity"** tab (4th tab)
4. Save/unsave a property to see it logged

## 📁 Files Created

1. ✅ `supabase_migration_user_activity.sql` - Database schema
2. ✅ `src/hooks/useUserActivity.ts` - Data fetching hooks
3. ✅ `src/lib/activityLogger.ts` - Activity logging functions
4. ✅ `src/pages/Dashboard.tsx` - Updated with Activity tab
5. ✅ `src/hooks/useSavedProperties.ts` - Auto-logs favorites
6. ✅ `USER_ACTIVITY_SETUP_GUIDE.md` - Full documentation

## 🎯 Currently Tracked

- ✅ Property saved (favorited)
- ✅ Property unsaved (unfavorited)

## 🔜 Ready to Add

- Property views
- Review submissions
- Inquiry submissions

See `USER_ACTIVITY_SETUP_GUIDE.md` for integration code.

## 🆘 Troubleshooting

**Q: Activity tab shows "No activity yet"**  
A: Log in, save/unsave a property, refresh the Activity tab.

**Q: TypeScript errors about user_activity**  
A: Run the migration first. Errors expected until table exists.

**Q: Activity not appearing**  
A: Check browser console for errors. Verify migration ran successfully.

## 📚 Full Documentation

See `USER_ACTIVITY_SETUP_GUIDE.md` for:
- Detailed architecture
- Integration examples
- Customization options
- Advanced features
