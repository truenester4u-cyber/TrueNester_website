# Quick Reference Card - Navbar & Modal

## One-Minute Setup

```tsx
// 1. Open App.tsx
import { Navbar } from "@/components/auth/Navbar";

// 2. Add to your app
<Navbar />

// 3. Done! ✅
```

---

## Component Locations

```
✨ NEW COMPONENTS:
├─ src/components/auth/Navbar.tsx
└─ src/components/auth/LoginSignupModal.tsx

📚 NEW DOCUMENTATION:
├─ NAVBAR_README.md (START HERE)
├─ NAVBAR_INTEGRATION_GUIDE.md
├─ NAVBAR_CODE_EXAMPLES.tsx
├─ NAVBAR_STYLING_GUIDE.md
├─ NAVBAR_TYPESCRIPT_TYPES.ts
├─ NAVBAR_IMPLEMENTATION_SUMMARY.ts
└─ NAVBAR_ARCHITECTURE_DIAGRAM.md
```

---

## Common Tasks

### Show Login Modal
```tsx
const [isOpen, setIsOpen] = useState(false);

<LoginSignupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
<button onClick={() => setIsOpen(true)}>Login</button>
```

### Check if User is Logged In
```tsx
const { user, loading } = useAuth();

if (!loading && user) {
  console.log("User logged in:", user.email);
}
```

### Get User Profile
```tsx
const { user } = useAuth();
const [profile, setProfile] = useState(null);

useEffect(() => {
  if (user) {
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setProfile(data));
  }
}, [user]);
```

### Handle Logout
```tsx
const { signOut } = useAuth();

const logout = async () => {
  await signOut();
  // Navbar automatically updates
};
```

---

## Props Reference

### `<Navbar />`
No props needed! Self-contained.

### `<LoginSignupModal />`
```tsx
interface LoginSignupModalProps {
  isOpen: boolean;      // Show/hide modal
  onClose: () => void;  // Close callback
}
```

---

## Styling Customization

### Change Colors
Edit `tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: {
      primary: "#your-color",
      secondary: "#your-color",
    }
  }
}
```

### Change Testimonials
Edit `LoginSignupModal.tsx`, find `TESTIMONIALS` array:
```tsx
const TESTIMONIALS = [
  {
    quote: "Your text",
    author: "Author name",
    emoji: "🎯"
  }
];
```

### Change Dropdown Items
Edit `Navbar.tsx`, find "Dropdown Menu" section:
```tsx
<Link to="/path">Menu Item</Link>
```

### Change Animation Speed
Look for `transition` props:
```tsx
transition={{ duration: 0.3 }}  // 0.3s animation
```

---

## Form Validation

### Login Form
- ✅ Email required, must be valid format
- ✅ Password required, min 6 characters

### Sign Up Form
- ✅ Name required
- ✅ Email required, valid format
- ✅ Password required, min 6 characters
- ✅ Confirm password must match

---

## Files to Know

| File | Purpose | Edit? |
|------|---------|-------|
| `src/components/auth/Navbar.tsx` | Main navbar component | Yes, for customization |
| `src/components/auth/LoginSignupModal.tsx` | Modal component | Yes, for customization |
| `src/contexts/AuthContext.tsx` | Auth state management | No, unless adding features |
| `tailwind.config.ts` | Tailwind configuration | Yes, for colors/themes |
| `NAVBAR_README.md` | Main documentation | Reference |

---

## TypeScript Types

```tsx
// Component props
interface LoginSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form state
interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

// Form errors
interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  general?: string;
}

// Tab type
type Tab = "login" | "signup";

// User profile
interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  phone?: string | null;
  bio?: string | null;
}
```

---

## Auth Methods

```tsx
const {
  user,                  // User | null
  session,              // Session | null
  loading,              // boolean
  signUp,               // (email, password, name) => Promise
  signIn,               // (email, password) => Promise
  signInWithGoogle,     // () => Promise
  signInWithFacebook,   // () => Promise
  signOut,              // () => Promise
} = useAuth();
```

---

## Responsive Breakpoints

```
Mobile:   < 768px   (hamburger menu, full-width modal)
Tablet:   768-1024px (adjusted spacing)
Desktop:  1024px+   (full navbar, side-by-side modal)
```

---

## Testing Checklist

- [ ] Navbar shows "Login / Sign up" when logged out
- [ ] Modal opens when button clicked
- [ ] Login form works with valid credentials
- [ ] Sign up form works
- [ ] Error messages appear for invalid input
- [ ] Modal closes after successful login
- [ ] Navbar shows user avatar + dropdown
- [ ] Dropdown menu items work
- [ ] Logout clears session
- [ ] Mobile menu responsive
- [ ] Dark mode looks good
- [ ] Animations smooth (no lag)

---

## Troubleshooting

### Modal won't open
```tsx
// Make sure you're using the hook correctly
const [isOpen, setIsOpen] = useState(false);
<LoginSignupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

### User profile not loading
```tsx
// Check Supabase profiles table exists
// Or fallback uses user.user_metadata
```

### Dark mode not working
```tsx
// Ensure parent has dark mode provider
// Check tailwind.config.ts has dark: 'class'
```

### Animations jerky
```tsx
// Reduce animation complexity
// Or disable on low-end devices
// Check browser performance
```

---

## Key Features at a Glance

### Navbar
- ✅ Login button (logged out)
- ✅ User avatar + dropdown (logged in)
- ✅ Mobile hamburger menu
- ✅ Responsive design
- ✅ Dark mode
- ✅ Smooth animations

### Modal
- ✅ Login & sign up tabs
- ✅ Form validation
- ✅ Password toggle
- ✅ Rotating testimonials
- ✅ Google OAuth
- ✅ Loading/success states
- ✅ Mobile responsive
- ✅ Dark mode

---

## Code Snippets

### Protect a Route
```tsx
<Route
  path="/dashboard"
  element={
    user ? <Dashboard /> : <Navigate to="/" />
  }
/>
```

### Show Different UI Based on Auth
```tsx
{user ? (
  <div>Welcome, {user.email}!</div>
) : (
  <div>Please log in</div>
)}
```

### Upload Avatar (example)
```tsx
const { user } = useAuth();

const uploadAvatar = async (file: File) => {
  const { data } = await supabase.storage
    .from("avatars")
    .upload(`${user.id}/${Date.now()}`, file);
  
  if (data) {
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(data.path);
    
    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);
  }
};
```

---

## Performance Tips

- ✅ Modal lazy-loads (only renders when open)
- ✅ Animations use GPU (transform/opacity)
- ✅ No unnecessary re-renders
- ✅ Debounced event handlers
- ✅ Optimized images

---

## Accessibility Features

- ✅ ARIA labels on form fields
- ✅ Keyboard navigation (Tab key)
- ✅ Focus rings on interactive elements
- ✅ Error announcements (role="alert")
- ✅ Proper color contrast (WCAG AA)
- ✅ Reduced motion support

---

## Next Steps

1. **Read:** NAVBAR_README.md
2. **Copy:** `<Navbar />` into your App.tsx
3. **Test:** Login/signup functionality
4. **Customize:** Colors, testimonials, styling
5. **Deploy:** Push to production

---

## Support Resources

| Resource | Link |
|----------|------|
| README | `NAVBAR_README.md` |
| Integration Guide | `NAVBAR_INTEGRATION_GUIDE.md` |
| Code Examples | `NAVBAR_CODE_EXAMPLES.tsx` |
| Styling Guide | `NAVBAR_STYLING_GUIDE.md` |
| TypeScript Types | `NAVBAR_TYPESCRIPT_TYPES.ts` |
| Architecture | `NAVBAR_ARCHITECTURE_DIAGRAM.md` |
| Summary | `NAVBAR_IMPLEMENTATION_SUMMARY.ts` |

---

## Questions?

Check the documentation files above or review the code comments in:
- `src/components/auth/Navbar.tsx`
- `src/components/auth/LoginSignupModal.tsx`

---

**Last Updated:** December 2025  
**Framework:** React 18 + TypeScript + Vite + Tailwind + Framer Motion  
**Auth:** Supabase  
**Status:** ✅ Production Ready
