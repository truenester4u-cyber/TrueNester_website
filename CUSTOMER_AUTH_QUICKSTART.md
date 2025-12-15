# 🚀 Customer Auth - Quick Reference

## 🎯 One-Time Setup (Do This First!)

```bash
# 1. Run database migration
# Open Supabase Dashboard → SQL Editor
# Copy & execute: database-migrations/202512090001_create_profiles_table.sql

# 2. Start dev server
npm run dev
```

## 🌐 New Routes

| URL | Description | Auth Required |
|-----|-------------|---------------|
| `/login` | Customer login | No |
| `/signup` | New account | No |
| `/dashboard` | Customer area | Yes |

## 💻 Use in Components

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  // Check if logged in
  if (!user) return <div>Please login</div>;
  
  // Use user data
  return <div>Hello {user.email}</div>;
}
```

## 🔒 Protect Routes

```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

<Route
  path="/my-page"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

## 🔑 Auth Methods

```typescript
const { signUp, signIn, signOut } = useAuth();

// Sign up
await signUp(email, password, fullName);

// Sign in
await signIn(email, password);

// Sign out
await signOut();
```

## 📦 Files Created

```
src/
├── contexts/AuthContext.tsx           # Auth state
├── components/auth/ProtectedRoute.tsx # Route guard
└── pages/
    ├── Login.tsx                      # Login page
    ├── Signup.tsx                     # Signup page
    └── Dashboard.tsx                  # Customer dashboard

database-migrations/
└── 202512090001_create_profiles_table.sql  # DB setup
```

## ⚡ Environment Variables

Already configured in `.env`:
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

## 🧪 Quick Test

1. Visit `http://localhost:8080/signup`
2. Create test account
3. Login at `/login`
4. Access `/dashboard`
5. Click logout

## 🔐 Security Features

✅ Row-Level Security (RLS)  
✅ Session persistence  
✅ Protected routes  
✅ Form validation  
✅ Separate from admin  

## 📚 Full Documentation

- `CUSTOMER_AUTH_SETUP.md` - Complete setup guide
- `CUSTOMER_AUTH_IMPLEMENTATION.md` - Technical details
- `CUSTOMER_AUTH_SUMMARY.md` - Executive summary

## 🆘 Troubleshooting

**TypeScript errors about "profiles"?**  
→ Run migration first, then regenerate types

**Can't login?**  
→ Check Supabase Auth is enabled

**Session not saving?**  
→ Check browser localStorage enabled

## ✅ Checklist

- [ ] Run database migration
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test protected route
- [ ] Test logout

---

**That's it!** Run the migration and start testing. 🎉
