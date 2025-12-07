# Admin Panel - Locations Management Setup Guide

## Overview
The admin panel now includes a comprehensive Locations management system that allows you to add, edit, and manage Dubai locations that appear on your website.

## What Has Been Added

### 1. **Admin Locations Page** (`/admin/locations`)
- View all locations in a table format
- See location images, names, property counts, and price ranges
- Toggle publish/unpublish status with one click
- Edit or delete locations
- Empty state with call-to-action

### 2. **Location Form** (`/admin/locations/new` and `/admin/locations/edit/:id`)
- Add new locations or edit existing ones
- Fields include:
  - **Name**: Location name (e.g., "Downtown Dubai")
  - **Slug**: URL-friendly identifier (auto-generated)
  - **Description**: Detailed description of the location
  - **Image URL**: Link to location image
  - **Properties Count**: Number of properties available
  - **Price Range**: Price range for properties (e.g., "AED 800K - 15M")
  - **Features**: Multiple tags for location highlights
  - **Published**: Toggle to publish/unpublish

### 3. **Updated Admin Sidebar**
- Added "Locations" menu item with MapPin icon
- Easy navigation between Properties, Locations, and Blog Posts

### 4. **Routes Configuration**
All necessary routes have been added to `App.tsx`:
- `/admin/locations` - List all locations
- `/admin/locations/new` - Create new location
- `/admin/locations/edit/:id` - Edit existing location

## Database Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section

### Step 2: Run the Migration
1. Open the file `database-migrations/create_locations_table.sql`
2. Copy the entire SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** to execute the migration

This will:
- Create the `locations` table with all necessary fields
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Insert 6 sample Dubai locations
- Set up automatic timestamp updates

### Step 3: Verify Table Creation
1. Go to **Table Editor** in Supabase
2. You should see the new `locations` table
3. It should contain 6 sample locations

## Using the Admin Panel

### Accessing the Admin Panel
1. Navigate to `/auth` and log in
2. After authentication, go to `/admin/dashboard`
3. Click on "Locations" in the sidebar

### Adding a New Location
1. Click the **"Add Location"** button
2. Fill in all required fields (Name and Slug are mandatory)
3. Add features by typing and clicking "Add" or pressing Enter
4. Upload or paste an image URL
5. Toggle "Published" to make it visible on the website
6. Click **"Create Location"**

### Editing a Location
1. Click the pencil icon next to any location
2. Update the fields as needed
3. Click **"Update Location"**

### Deleting a Location
1. Click the trash icon next to any location
2. Confirm the deletion in the dialog
3. The location will be permanently removed

### Publishing/Unpublishing
- Click the badge in the "Status" column to quickly toggle publish status
- Published locations show a green badge with an eye icon
- Draft locations show a gray badge

## Features Highlights

### Auto-Generated Slug
When creating a new location, the slug is automatically generated from the name:
- "Downtown Dubai" → "downtown-dubai"
- "Palm Jumeirah" → "palm-jumeirah"

### Image Preview
When you enter an image URL, a preview will appear below the input field to verify the image loads correctly.

### Feature Tags
Add multiple features to each location:
- Type a feature name
- Click "Add" or press Enter
- Click on any badge to remove it

### Real-time Status Toggle
Click on the published/draft badge in the table to instantly change the status without navigating to the edit form.

## Security

The database is secured with Row Level Security (RLS):
- **Public users**: Can only view published locations
- **Authenticated users**: Can view all locations and perform CRUD operations
- All admin operations require authentication

## Sample Data

The migration includes 6 pre-populated locations:
1. Downtown Dubai
2. Palm Jumeirah
3. Dubai Marina
4. Business Bay
5. JBR (Jumeirah Beach Residence)
6. Arabian Ranches

## Next Steps

### Integrating Locations with Properties
You can link properties to locations by:
1. Adding a `location_id` field to the properties table
2. Creating a foreign key relationship
3. Filtering properties by location on the frontend

### Display Locations on Website
Update `src/pages/Locations.tsx` and `src/components/home/LocationsGrid.tsx` to fetch data from Supabase instead of using hardcoded arrays:

```typescript
const { data: locations } = await supabase
  .from('locations')
  .select('*')
  .eq('published', true)
  .order('name');
```

## Troubleshooting

### "relation 'locations' does not exist"
- Make sure you've run the SQL migration in Supabase
- Check the Table Editor to verify the table was created

### "Permission denied"
- Ensure you're logged in as an authenticated user
- Check that RLS policies are properly set up

### Images not loading
- Verify the image URL is publicly accessible
- Check for CORS issues with the image host
- Consider using Supabase Storage for reliable image hosting

## Support

For any issues or questions:
1. Check the browser console for error messages
2. Verify Supabase connection in the Network tab
3. Ensure all environment variables are set correctly
4. Check that authentication is working properly

---

**Admin Panel Features:**
- ✅ Locations Management (CRUD)
- ✅ Properties Management
- ✅ Blog Posts Management
- ✅ Dashboard with Statistics
- ✅ Secure Authentication
- ✅ Row Level Security
