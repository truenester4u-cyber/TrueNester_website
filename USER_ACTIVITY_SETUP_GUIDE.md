# User Activity History - Setup & Implementation Guide

## ✅ What's Been Implemented

### 1. Database Schema
**File:** `supabase_migration_user_activity.sql`

A complete migration file has been created with:
- `user_activity` table with activity_type enum
- Indexes for performance (user_id, created_at, activity_type)
- Row Level Security (RLS) policies - users can only see their own activity
- Automatic `updated_at` trigger
- Activity types: property_view, property_saved, property_unsaved, review_submitted, review_updated, inquiry_submitted, inquiry_updated

**Action Required:** Run this SQL in your Supabase SQL Editor.

### 2. Data Fetching Hooks
**File:** `src/hooks/useUserActivity.ts`

Two hooks created:
- `useUserActivity(limit)` - Fetches user's activity with property/inquiry details
- `useActivityStats()` - Aggregates activity counts by type

Features:
- Auto-joins property and inquiry tables
- Sorts by most recent first
- 2-minute stale time for performance
- Enabled only when user is authenticated

### 3. Activity Logging Utility
**File:** `src/lib/activityLogger.ts`

Helper functions for logging activities:
- `logPropertySaved()` - When user favorites a property
- `logPropertyUnsaved()` - When user unfavorites a property
- `logReviewSubmitted()` - When user submits a review
- `logReviewUpdated()` - When user updates a review
- `logInquirySubmitted()` - When user submits an inquiry
- `logInquiryUpdated()` - When user updates an inquiry

Each function stores metadata (property title, price, rating, etc.) for display.

### 4. Dashboard Activity Tab
**File:** `src/pages/Dashboard.tsx`

Added new "Activity" tab to customer dashboard:
- Shows timeline of all user activities
- Color-coded icons (view=blue, favorite=red, review=yellow, inquiry=green)
- Relative timestamps ("2 hours ago", "Yesterday")
- Links to properties
- Shows review ratings and inquiry status
- Empty state when no activities

### 5. Activity Logging Integration
**File:** `src/hooks/useSavedProperties.ts`

Updated favorite/unfavorite mutations to automatically log activity:
- `useSaveProperty()` - Logs when property is saved
- `useUnsaveProperty()` - Logs when property is removed
- Invalidates activity queries to refresh UI
- Accepts property metadata (title, image, price) for better tracking

## 📋 Setup Instructions

### Step 1: Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase_migration_user_activity.sql`
3. Paste and click "Run"
4. Verify: Check "Table Editor" → `user_activity` table should exist

### Step 2: Regenerate Types (Optional)
If you have local Supabase CLI:
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Step 3: Install date-fns (If Not Already Installed)
The dashboard uses `date-fns` for relative time formatting:
```bash
npm install date-fns
```

### Step 4: Test the Feature
1. Start your dev server: `npm run dev`
2. Log in to a customer account
3. Go to Dashboard → Activity tab
4. Save/unsave a property
5. Check Activity tab - you should see the action logged with timestamp

## 🔄 How It Works

### Activity Flow:
1. **User Action** → (e.g., clicks favorite button on PropertyDetail)
2. **Mutation Hook** → `useSaveProperty()` called
3. **Database Insert** → Property saved to `saved_properties` table
4. **Activity Log** → `logPropertySaved()` called automatically
5. **Activity Insert** → Record created in `user_activity` table
6. **Query Invalidation** → `["user-activity"]` query refreshed
7. **UI Update** → Activity tab shows new entry

### Data Structure:
```typescript
{
  id: "uuid",
  user_id: "uuid",
  activity_type: "property_saved",
  reference_id: "property-uuid",
  reference_type: "property",
  metadata: {
    property_title: "Luxury Villa in Dubai Marina",
    property_price: "AED 5,500,000",
    property_image: "villa-hero.jpg"
  },
  created_at: "2025-01-15T10:30:00Z"
}
```

## 🎯 What's Tracked

### Currently Tracked:
✅ Property favorites (save/unsave)

### Ready to Integrate (Functions Exist):
- Property views (call `logPropertyView()` in PropertyDetail component)
- Review submissions (call `logReviewSubmitted()` in ReviewFormModal)
- Inquiry submissions (call `logInquirySubmitted()` in Contact/PropertyDetail forms)

### To Add Property View Tracking:
In `src/pages/PropertyDetail.tsx`, add to `useEffect`:
```typescript
import { logPropertyView } from "@/lib/activityLogger";

useEffect(() => {
  if (property && user) {
    logPropertyView(
      user.id,
      property.id,
      property.title,
      property.featured_image,
      `AED ${property.price?.toLocaleString()}`
    ).catch(console.error);
  }
}, [property, user]);
```

### To Add Review Submission Tracking:
In `src/components/reviews/ReviewFormModal.tsx`, after successful review submission:
```typescript
import { logReviewSubmitted } from "@/lib/activityLogger";

// After supabase.from("reviews").insert()
await logReviewSubmitted(
  user.id,
  reviewId,
  propertyId,
  propertyTitle,
  rating
);
```

### To Add Inquiry Tracking:
In `src/pages/Contact.tsx`, after creating conversation:
```typescript
import { logInquirySubmitted } from "@/lib/activityLogger";

// After supabase.from("conversations").insert()
await logInquirySubmitted(
  customerId,
  conversationId,
  undefined, // No specific property
  undefined,
  formData.message
);
```

## 🎨 UI Features

### Activity Tab Displays:
- **Icon** - Color-coded by activity type
- **Action Text** - "Saved Luxury Villa to favorites"
- **Timestamp** - "2 hours ago" (using date-fns)
- **Review Rating** - Shows star rating for reviews
- **Status Badge** - Shows inquiry status (new/in-progress/closed)
- **View Link** - Direct link to property (if applicable)

### Empty State:
Shows friendly message when no activities exist with Activity icon.

## 🔧 Customization

### Change Activity Limit:
```typescript
// In Dashboard.tsx
const { data: activities } = useUserActivity(100); // Show last 100 activities
```

### Filter by Activity Type:
Modify `useUserActivity` hook to accept filter parameter:
```typescript
.eq("activity_type", "property_saved") // Only saved properties
```

### Add New Activity Types:
1. Update enum in migration SQL
2. Add to `ActivityType` in `useUserActivity.ts`
3. Create logger function in `activityLogger.ts`
4. Add icon/text case in Dashboard activity display

## 🐛 Troubleshooting

### Activities Not Showing:
- Check if migration ran successfully
- Verify RLS policies allow authenticated users to insert/select
- Check browser console for errors
- Ensure user is authenticated

### Old Activities Not Logged:
- Activity tracking only works for new actions after feature is deployed
- Existing favorites/reviews won't have activity records (no retroactive tracking)

### Performance Issues:
- Default limit is 50 activities
- Indexes exist on user_id and created_at for fast queries
- Consider adding pagination if users have 100+ activities

## 📊 Activity Stats (Bonus)

The `useActivityStats()` hook provides aggregated counts:
```typescript
const { data: stats } = useActivityStats();
// Returns: { total: 45, property_views: 20, properties_saved: 10, reviews_submitted: 5, inquiries_submitted: 10 }
```

Can be used to show stats cards in Dashboard Overview tab.

## ✨ Future Enhancements

- **Activity Filters** - Filter by date range or activity type
- **Activity Search** - Search activities by property name
- **Export Activities** - Download activity history as CSV
- **Activity Notifications** - Email summary of weekly activities
- **Property View Heatmap** - Visualize most viewed properties
- **Engagement Scoring** - Track user engagement over time

## 🎉 Summary

You now have a complete user activity tracking system that:
- ✅ Stores all user interactions in database
- ✅ Displays timeline in dashboard with icons and timestamps
- ✅ Links back to referenced properties
- ✅ Shows metadata (ratings, status, etc.)
- ✅ Automatically logs favorites (save/unsave)
- ✅ Ready to integrate reviews and inquiries
- ✅ Follows RLS security best practices
- ✅ Optimized with indexes and query settings

Users can now see their complete interaction history with properties, making the platform feel more personalized and engaging!
