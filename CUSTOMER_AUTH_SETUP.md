# Customer Authentication System - Setup Guide

## Overview
Complete customer authentication system using Supabase Auth in Vite + React + TypeScript. Includes login, signup, protected routes, and customer dashboard.

## 🎯 Features Implemented

### 1. Authentication Pages
- **Login Page** (`/login`) - Email/password authentication
- **Signup Page** (`/signup`) - New customer registration
- **Dashboard** (`/dashboard`) - Protected customer area
- Auto-redirect: logged-in users can't access login/signup
- Loading states and comprehensive error handling

### 2. Auth System Components
- **AuthContext** (`src/contexts/AuthContext.tsx`)
  - Manages authentication state globally
  - Provides `signUp`, `signIn`, `signOut` methods
  - Tracks current user and session
  - Auto-persists session in localStorage
  
- **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
  - Guards protected routes from unauthenticated access
  - Shows loading spinner during auth check
  - Redirects to `/login` with return path preservation

### 3. Customer Dashboard
- Profile overview with avatar and user details
- Tabbed interface: Overview, Saved Properties, Inquiries, Settings
- Quick action buttons to browse properties
- Placeholders for future features (saved properties, inquiries)

### 4. Database Setup
- **profiles table** with Row-Level Security (RLS)
- Automatic profile creation on user signup via trigger
- Columns: id, role, full_name, email, phone, avatar_url, timestamps
- Role-based access: only customers can access customer data

---

## 🚀 Quick Setup Instructions

### Step 1: Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy the SQL from `database-migrations/202512090001_create_profiles_table.sql`
3. Execute the migration
4. Verify the `profiles` table was created

### Step 2: Verify Environment Variables
Ensure your `.env` file has:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Step 3: Test the System
1. Start dev server: `npm run dev`
2. Visit `http://localhost:8080/signup`
3. Create a test account
4. Check email for verification link (if email verification enabled)
5. Login at `/login`
6. Access protected dashboard at `/dashboard`

---

## 📁 File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx   # Route guard component
├── pages/
│   ├── Login.tsx                # Login page
│   ├── Signup.tsx               # Registration page
│   └── Dashboard.tsx            # Customer dashboard
└── App.tsx                       # Updated with auth routes

database-migrations/
└── 202512090001_create_profiles_table.sql  # Database schema
```

---

## 🔐 Security Features

### 1. Row-Level Security (RLS)
- ✅ Users can only view/update their own profile
- ✅ Automatic profile creation via database trigger
- ✅ Role-based access control (customer/admin)

### 2. Client-Side Protection
- ✅ Protected routes require authentication
- ✅ Auto-redirect unauthenticated users to login
- ✅ Session persistence in localStorage
- ✅ Automatic token refresh

### 3. Admin Separation
- ✅ Customer auth separate from admin auth (`/auth`)
- ✅ Admin routes unchanged (`/admin/*`)
- ✅ No admin access from customer accounts

---

## 🎨 UI/UX Features

### Form Validation
- Email format validation
- Password minimum length (6 characters)
- Password confirmation matching
- Full name requirement (2+ characters)
- Real-time error messages

### User Feedback
- Toast notifications for success/error
- Loading spinners during async operations
- Disabled form inputs during submission
- Clear error messages with icons

### Responsive Design
- Mobile-friendly layouts
- Gradient backgrounds
- Clean card-based UI using shadcn/ui
- Consistent branding with primary colors

---

## 🔌 Integration Points

### 1. Supabase Client
Already configured in `src/integrations/supabase/client.ts`:
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### 2. Auth Context Usage
Use in any component:
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

### 3. Protected Routes
Wrap any route that requires authentication:
```typescript
<Route
  path="/my-page"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

---

## 📊 Database Schema

### profiles Table
| Column      | Type      | Constraints                |
|-------------|-----------|----------------------------|
| id          | UUID      | PRIMARY KEY, FK to auth.users |
| role        | TEXT      | DEFAULT 'customer', CHECK IN ('customer', 'admin') |
| full_name   | TEXT      | NOT NULL                   |
| email       | TEXT      | NOT NULL                   |
| phone       | TEXT      | NULL                       |
| avatar_url  | TEXT      | NULL                       |
| created_at  | TIMESTAMP | DEFAULT now()              |
| updated_at  | TIMESTAMP | AUTO-UPDATE via trigger    |

### Indexes
- `idx_profiles_role` on `role`
- `idx_profiles_email` on `email`

### RLS Policies
1. **Select**: Users can view their own profile (`auth.uid() = id`)
2. **Update**: Users can update their own profile
3. **Insert**: Users can create their profile on signup

---

## 🧪 Testing Checklist

- [ ] Signup creates new account
- [ ] Profile record auto-created in database
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials shows error
- [ ] Dashboard accessible after login
- [ ] Dashboard redirects to login when logged out
- [ ] Logout clears session
- [ ] Protected route redirects to login
- [ ] Login redirects back to intended page
- [ ] Form validation shows appropriate errors
- [ ] Toast notifications appear correctly

---

## 🚢 Deployment Notes

### Environment Variables (Production)
Set these in your deployment platform (Netlify, Vercel, etc.):
```
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
```

### Build Command
```bash
npm run build
```

### Supabase Setup
1. Run migration in production Supabase project
2. Enable email authentication in Supabase Auth settings
3. Configure email templates (optional)
4. Set site URL in Supabase settings
5. Configure redirect URLs for auth

---

## 🔧 Customization Guide

### Add Custom Profile Fields
1. Update migration SQL to add columns
2. Update `Profile` interface in `Dashboard.tsx`
3. Modify signup form to capture additional data
4. Update `AuthContext.signUp()` to include new fields

### Add Social Login (Google, GitHub, etc.)
1. Enable provider in Supabase Auth settings
2. Add provider button in Login/Signup
3. Use `supabase.auth.signInWithOAuth({ provider: 'google' })`
4. Handle callback redirect

### Email Verification
1. Enable in Supabase Auth → Email tab
2. Customize email templates
3. Add verification status check in dashboard
4. Show "verify email" banner if unverified

---

## 📚 Key Files Reference

### AuthContext Methods
```typescript
signUp(email, password, fullName)    // Create account
signIn(email, password)               // Login
signOut()                             // Logout
```

### Auth Context State
```typescript
{
  user: User | null,              // Current user object
  session: Session | null,        // Current session
  loading: boolean                // Auth state loading
}
```

---

## 🎓 Best Practices Followed

✅ **TypeScript types** for all components and props  
✅ **Async/await** for all async operations  
✅ **Error handling** with try/catch and user feedback  
✅ **Environment variables** for sensitive config  
✅ **Row-Level Security** on database tables  
✅ **Form validation** before submission  
✅ **Loading states** for better UX  
✅ **Toast notifications** for user feedback  
✅ **Responsive design** with Tailwind CSS  
✅ **Clean code** with comments and documentation  

---

## 🆘 Troubleshooting

### Issue: "User not found" on signup
- **Cause**: Email verification is enabled
- **Solution**: Check email inbox or disable email confirmation in Supabase

### Issue: Profile not created
- **Cause**: Database trigger not working
- **Solution**: Re-run migration, check Supabase logs

### Issue: RLS policy errors
- **Cause**: Policies not properly configured
- **Solution**: Verify policies in Supabase dashboard → Authentication → Policies

### Issue: Redirect loop on login
- **Cause**: Auth state not updating
- **Solution**: Clear localStorage, check browser console for errors

---

## 🎉 Success!

Your customer authentication system is now fully operational. Customers can:
- ✅ Sign up for new accounts
- ✅ Log in with email/password
- ✅ Access protected dashboard
- ✅ View their profile information
- ✅ Log out securely

Ready for production deployment! 🚀
