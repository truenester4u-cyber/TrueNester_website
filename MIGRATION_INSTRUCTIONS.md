# Database Migration Instructions

## Apply the Properties Table Migration

Since you're using a hosted Supabase instance, follow these steps to apply the migration:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bjaspummfthkudrhykvq
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20251122090000_create_properties_table.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed and linked:

```bash
# Link your project (one-time setup)
npx supabase link --project-ref bjaspummfthkudrhykvq

# Push the migration
npx supabase db push
```

## After Migration

Once the migration is applied, you can:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/auth` to login (you'll need to create an admin user first)

3. Create an admin user via Supabase Dashboard:
   - Go to Authentication > Users
   - Create a new user
   - Then go to SQL Editor and run:
     ```sql
     INSERT INTO public.user_roles (user_id, role)
     VALUES ('YOUR_USER_ID_HERE', 'admin');
     ```

4. Access the admin panel at `/admin/dashboard`

## Features Available

- ✅ Complete property management (CRUD operations)
- ✅ Image upload and management
- ✅ Blog post management
- ✅ Admin dashboard with statistics
- ✅ Responsive design
- ✅ Search and filtering
- ✅ SEO fields
- ✅ Featured properties
- ✅ Draft/Published status

Happy managing! 🎉
