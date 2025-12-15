# 🔑 ADMIN PASSWORD CHANGE - EXECUTE NOW

## SQL Script Ready
The password change SQL is ready in: `admin_password_update_20251215_084931.sql`

## How to Execute:

### Method 1: Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `jwmbxpqpjxqclfcahwcf`  
3. Go to SQL Editor (left sidebar)
4. Copy and paste this SQL:

```sql
UPDATE auth.users 
SET encrypted_password = crypt('True$Path_2025!', gen_salt('bf'))
WHERE email = 'admin@truenester.com';
```

5. Click "Run"
6. You should see: "1 row updated"

### Method 2: Copy from generated file
1. Open the file: `admin_password_update_20251215_084931.sql`
2. Copy the SQL content
3. Paste in Supabase SQL Editor
4. Run it

## ✅ After Password Change

**New Admin Login Credentials:**
- Email: `admin@truenester.com`
- Password: `True$Path_2025!`

## Test Login
1. Go to your admin panel: `https://dubai-nest-hub.netlify.app/admin`
2. Use the new credentials above
3. You should be able to login successfully

**Both backend deployment and password change are ready to execute!**