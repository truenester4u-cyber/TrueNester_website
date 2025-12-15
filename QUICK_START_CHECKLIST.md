# 🚀 Quick Start Checklist - Auth Rebuild

Copy-paste this checklist into your task tracker or notes:

## Phase 1: Setup (15 mins)

- [ ] Read `AUTH_REBUILD_SUMMARY.md` for overview
- [ ] Read `AUTH_ROUTING_INTEGRATION_GUIDE.md` for detailed steps
- [ ] Backup your current `src/contexts/AuthContext.tsx`

## Phase 2: Code Updates (30 mins)

### Update App.tsx (or main component)
- [ ] Change import: `import { AuthProvider } from "@/contexts/AuthContext.v2"`
- [ ] Copy route definitions from integration guide
- [ ] Wrap protected routes with `<ProtectedRoute>`
- [ ] Wrap admin routes with `<ProtectedRoute requireAdmin={true}>`

### Update Navigation.tsx
- [ ] Backup current Navigation.tsx
- [ ] Copy new navbar code from integration guide
- [ ] Update imports to use `useAuth` from v2
- [ ] Test both guest and logged-in states

### Update Login.tsx
- [ ] Add redirect handling:
```tsx
const searchParams = new URLSearchParams(location.search);
const redirect = searchParams.get("redirect");
// After successful login: navigate(redirect || "/");
```

### Update Signup.tsx
- [ ] Same redirect handling as Login.tsx

## Phase 3: Database (5 mins)

Run these in Supabase SQL Editor:

```sql
-- 1. Add role to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- 2. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  property_title text,
  rating int CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 3. Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- 4. Add user_id to conversations (if not exists)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Phase 4: Testing (10 mins)

### Test Unauthenticated User
- [ ] Logout (or use incognito/different browser)
- [ ] Navbar shows "Login" and "Sign up" buttons
- [ ] Click "Sign up" button → goes to /signup
- [ ] Click "Login" button → goes to /login
- [ ] Try to access /favorites → redirects to /login?redirect=/favorites

### Test Authenticated User
- [ ] Log in with test account
- [ ] Navbar shows avatar + dropdown
- [ ] Dropdown has: My Favorites, My Inquiries, My Reviews, Sign Out
- [ ] Click "My Favorites" → goes to /favorites (no redirect)
- [ ] Click "My Reviews" → goes to /my-reviews
- [ ] Try /admin/reviews without admin role → redirected to home
- [ ] Check loading spinner appears during page transitions

### Test Redirects
- [ ] Log out
- [ ] Try to access /favorites
- [ ] Should redirect to /login?redirect=/favorites
- [ ] Log in
- [ ] Should return to /favorites (not home)

## Phase 5: Enhancements (Optional)

- [ ] Home page: Add "Write a Review" button in reviews section
- [ ] Property detail: Add "Send Inquiry" button (protected)
- [ ] Show approved reviews only on public pages
- [ ] Add avatar upload to profile
- [ ] Add review filtering/sorting in My Reviews
- [ ] Add search in Favorites
- [ ] Add export inquiries as CSV

## Phase 6: Polish (Optional)

- [ ] Test dark mode - all pages
- [ ] Test mobile view - navbar dropdown, buttons
- [ ] Check animations smooth on all transitions
- [ ] Add success toasts after actions
- [ ] Verify error messages show for failed auth

## Files Created

✅ `src/contexts/AuthContext.v2.tsx` - Main auth context
✅ `src/components/auth/ProtectedRoute.tsx` - Route protection
✅ `src/components/LoadingSpinner.tsx` - Loading indicator
✅ `src/pages/Favorites.tsx` - Protected favorites page
✅ `src/pages/Inquiries.tsx` - Protected inquiries page
✅ `src/pages/MyReviews.tsx` - Protected reviews page
✅ `src/pages/admin/AdminReviews.tsx` - Admin review moderation
✅ `src/AUTH_REBUILD_SUMMARY.md` - Full overview
✅ `src/AUTH_ROUTING_INTEGRATION_GUIDE.md` - Step-by-step guide

## Key Exports

```tsx
// Use in any component
import { useAuth } from "@/contexts/AuthContext.v2";

const { 
  user,                  // Supabase User object
  userProfile,          // { id, email, full_name, role, ... }
  isAuthenticated,      // boolean
  isLoading,            // boolean (during auth checks)
  signIn,               // async login function
  signUp,               // async signup function
  signOut,              // async logout function
  isAdmin,              // () => boolean function
  setRedirectUrl,       // (url: string) => void
  getRedirectUrl,       // () => string | null
} = useAuth();
```

## Route Examples

```tsx
// Public routes - no wrapper needed
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />

// Protected routes - wrap with ProtectedRoute
<Route 
  path="/favorites" 
  element={
    <ProtectedRoute>
      <Favorites />
    </ProtectedRoute>
  } 
/>

// Admin-only routes
<Route 
  path="/admin/reviews" 
  element={
    <ProtectedRoute requireAdmin={true}>
      <AdminReviews />
    </ProtectedRoute>
  } 
/>
```

## Troubleshooting

**Problem**: User sees loading spinner forever
- **Solution**: Check browser console for errors, verify Supabase connection

**Problem**: Redirect not working after login
- **Solution**: Verify Login page reads `?redirect=` query param and navigates

**Problem**: isAdmin() always returns false
- **Solution**: Check profiles table has `role = 'admin'` for your test user

**Problem**: Protected pages show 404
- **Solution**: Verify routes are defined in App.tsx

**Problem**: Navbar doesn't update when login state changes
- **Solution**: Verify AuthProvider wraps entire app (in App.tsx or main.tsx)

## Performance Tips

- AuthContext subscriptions auto-cleanup (useEffect return)
- Protected routes don't re-fetch on every render (React memo)
- Loading spinner only shows during auth initialization
- Redirect URLs stored in sessionStorage (cleared on browser close)

## Security Notes

- Supabase Auth handles password hashing & JWT tokens
- RLS policies should restrict database access by user_id
- Admin access checked via `role` field in profiles table
- OAuth tokens managed by Supabase automatically
- No sensitive data stored in sessionStorage (only redirect URL)

---

**Estimated Total Time**: ~60 minutes for full implementation
**Difficulty**: Medium (lots of setup, but straightforward)
**Testing Time**: ~15 minutes

Good luck! 🚀
