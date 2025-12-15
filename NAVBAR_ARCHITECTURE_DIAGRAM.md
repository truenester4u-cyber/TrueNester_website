# Navbar & Modal - Architecture & Component Diagram

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                         │
│                         (Your main app)                                      │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ AuthProvider (existing)       │
        │ Provides useAuth() hook       │
        └──────────────┬────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ <Navbar /> ✨ NEW             │
        │  ├─ Logo & Navigation         │
        │  ├─ Login button (logged out) │
        │  ├─ User menu (logged in)     │
        │  └─ Modal controller          │
        │      │                        │
        │      └─→ <LoginSignupModal /> │
        │          └─ Auth forms        │
        │          └─ Testimonials      │
        │          └─ Animations        │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Your Page Content             │
        │ (Buy, Rent, Sell, etc.)       │
        └──────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER INTERACTIONS                                │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣  USER NOT LOGGED IN
   ┌────────────────────────────────────────┐
   │   Navbar                               │
   │   ┌──────────────────────────────────┐ │
   │   │ [Login / Sign up] button         │ │
   │   └──────────────────────────────────┘ │
   └────────────────────────────────────────┘
          │
          │ (user clicks)
          ▼
   ┌────────────────────────────────────────┐
   │   Modal opens                          │
   │   ┌──────────────────────────────────┐ │
   │   │ Login Form                       │ │
   │   │ [Email] [Password] [Sign In]     │ │
   │   │ [Google] button                  │ │
   │   └──────────────────────────────────┘ │
   └────────────────────────────────────────┘
          │
          │ (user submits)
          ▼
   ┌────────────────────────────────────────┐
   │   Supabase Auth                        │
   │   - Validate credentials               │
   │   - Create session                     │
   │   - Return JWT token                   │
   └────────────────────────────────────────┘
          │
          │ (auth succeeds)
          ▼
   ┌────────────────────────────────────────┐
   │   AuthContext                          │
   │   - user = User object                 │
   │   - session = Session object           │
   │   - localStorage = JWT token           │
   └────────────────────────────────────────┘
          │
          │ (state updates)
          ▼
   ┌────────────────────────────────────────┐
   │   Navbar re-renders                    │
   │   - Modal closes                       │
   │   - Shows user avatar + name           │
   │   - Shows dropdown menu                │
   └────────────────────────────────────────┘


2️⃣  USER LOGGED IN
   ┌────────────────────────────────────────┐
   │   Navbar                               │
   │   ┌──────────────────────────────────┐ │
   │   │ [Avatar] [Name] [▼]              │ │
   │   │ Dropdown menu on click:          │ │
   │   │ - Dashboard                      │ │
   │   │ - My Favorites                   │ │
   │   │ - Profile                        │ │
   │   │ - Settings                       │ │
   │   │ - Logout                         │ │
   │   └──────────────────────────────────┘ │
   └────────────────────────────────────────┘
          │
          │ (user clicks Logout)
          ▼
   ┌────────────────────────────────────────┐
   │   Supabase Auth                        │
   │   - Clear session                      │
   │   - Invalidate JWT token               │
   │   - Clear localStorage                 │
   └────────────────────────────────────────┘
          │
          │ (auth succeeds)
          ▼
   ┌────────────────────────────────────────┐
   │   AuthContext                          │
   │   - user = null                        │
   │   - session = null                     │
   └────────────────────────────────────────┘
          │
          │ (state updates)
          ▼
   ┌────────────────────────────────────────┐
   │   Navbar re-renders                    │
   │   - Back to "Login / Sign up" button    │
   │   - Dropdown disappears                │
   └────────────────────────────────────────┘
```

## State Management Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AuthContext State                                  │
│                                                                             │
│  user: User | null          ─→ Current authenticated user                 │
│  session: Session | null    ─→ Current session with tokens                │
│  loading: boolean           ─→ Is auth initializing?                       │
│  signUp()                   ─→ Create new account                          │
│  signIn()                   ─→ Login with email/password                   │
│  signOut()                  ─→ Logout and clear session                    │
│  signInWithGoogle()         ─→ OAuth with Google                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                    Shared across entire app
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
        │   Navbar     │   │   Dashboard  │  │   Pages      │
        │              │   │              │  │              │
        │ useAuth()    │   │ useAuth()    │  │ useAuth()    │
        │              │   │              │  │              │
        └──────────────┘   └──────────────┘  └──────────────┘
```

## Component Props & State Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  <Navbar />                                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Props: None (self-contained)                                       │  │
│  │ State:                                                              │  │
│  │  - isOpen: boolean (mobile menu)                                   │  │
│  │  - isLoginModalOpen: boolean (controls modal visibility)           │  │
│  │  - isDropdownOpen: boolean (user dropdown)                         │  │
│  │  - userProfile: UserProfile | null (from Supabase)                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Renders:                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ <nav> (Fixed top navbar)                                            │ │
│  │  ├─ Logo [Link]                                                    │ │
│  │  ├─ Navigation Links (Buy, Rent, Sell, Locations)                 │ │
│  │  └─ Right Side:                                                   │ │
│  │     ├─ If !user:                                                  │ │
│  │     │  └─ [Login / Sign up] button → opens modal                 │ │
│  │     ├─ If user:                                                   │ │
│  │     │  ├─ Avatar + Name + Dropdown indicator                     │ │
│  │     │  └─ Dropdown menu (Dashboard, Favorites, Profile, etc.)    │ │
│  │     └─ Mobile menu button (hamburger)                             │ │
│  │                                                                   │ │
│  │ <LoginSignupModal>                                                 │ │
│  │  ├─ isOpen={isLoginModalOpen}                                    │ │
│  │  └─ onClose={() => setIsLoginModalOpen(false)}                  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│  <LoginSignupModal />                                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Props:                                                              │  │
│  │  - isOpen: boolean (controls visibility)                           │  │
│  │  - onClose: () => void (callback to close)                        │  │
│  │                                                                    │  │
│  │ State:                                                              │  │
│  │  - tab: "login" | "signup" (which form to show)                    │  │
│  │  - formData: FormState (email, password, etc.)                    │  │
│  │  - errors: FormErrors (validation errors)                         │  │
│  │  - loading: boolean (is auth request in flight)                   │  │
│  │  - success: boolean (show success state)                          │  │
│  │  - showPassword: boolean (toggle password visibility)              │  │
│  │  - testimonialIndex: number (which quote to show)                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Renders:                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ Modal (Framer Motion animated)                                      │ │
│  │ ├─ Backdrop (blur + dark overlay, click to close)                  │ │
│  │ └─ Content (glassmorphism container)                                │ │
│  │    ├─ Close button (X) [top right]                                │ │
│  │    ├─ Left section (hidden on mobile):                            │ │
│  │    │  ├─ Logo + Brand name                                        │ │
│  │    │  ├─ Rotating testimonial (auto-changes every 5s)            │ │
│  │    │  │  ├─ Emoji                                                │ │
│  │    │  │  ├─ Quote text                                           │ │
│  │    │  │  └─ Author name                                          │ │
│  │    │  └─ Navigation dots (clickable to switch quotes)            │ │
│  │    │                                                              │ │
│  │    └─ Right section (form):                                       │ │
│  │       ├─ Tab buttons:                                             │ │
│  │       │  ├─ [Login]  [Sign Up]                                  │ │
│  │       │  └─ Animated underline shows active tab                 │ │
│  │       │                                                          │ │
│  │       ├─ Form (Framer Motion animated):                          │ │
│  │       │  ├─ (Login only):                                       │ │
│  │       │  │  ├─ Email input                                      │ │
│  │       │  │  └─ Password input [show/hide toggle]                │ │
│  │       │  │                                                      │ │
│  │       │  ├─ (Sign up only):                                     │ │
│  │       │  │  ├─ Name input                                       │ │
│  │       │  │  ├─ Email input                                      │ │
│  │       │  │  ├─ Password input [show/hide toggle]                │ │
│  │       │  │  └─ Confirm password input [show/hide toggle]        │ │
│  │       │  │                                                      │ │
│  │       │  ├─ Error messages (inline, animated)                   │ │
│  │       │  └─ [Submit] button (loading state with spinner)        │ │
│  │       │                                                          │ │
│  │       ├─ OR divider                                              │ │
│  │       │                                                          │ │
│  │       └─ [Continue with Google] button                           │ │
│  │                                                                  │ │
│  │       OR (if success):                                            │ │
│  │       ├─ Animated checkmark                                      │ │
│  │       ├─ Success message                                         │ │
│  │       └─ Auto-closes after 1.5s                                 │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Responsive Layout Diagram

### Desktop (1024px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] [Buy] [Rent] [Sell] [Locations]    [Login / Sign up] or [Avatar ▼] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                             Page Content                                    │
│                                                                              │
│                                                                              │
│ Modal (when open):                                                          │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ [Testimonials]      │ [Login/Signup Form]                            │ │
│ │ Rotating quotes     │ • [Login] [Sign Up] tabs                       │ │
│ │ Navigation dots     │ • Email field                                   │ │
│ │                     │ • Password field                                │ │
│ │                     │ • [Sign In / Sign Up] button                   │ │
│ │                     │ • [Continue with Google]                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Logo] [Buy] [Rent] [Sell]    [Login / Sign up] or [Avatar ▼]            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                          Page Content                                     │
│                                                                            │
│ Modal (when open):                                                         │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ [Login/Signup Form]                                                 │ │
│ │ • [Login] [Sign Up] tabs                                           │ │
│ │ • Email field                                                       │ │
│ │ • Password field                                                    │ │
│ │ • [Sign In / Sign Up] button                                       │ │
│ │ • [Continue with Google]                                            │ │
│ │                                                                     │ │
│ │ (Testimonials hidden on tablet)                                     │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo]                              [☰] Hamburger Menu                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Expanded menu (when clicked):                                           │
│ ├─ [Buy]                                                               │
│ ├─ [Rent]                                                              │
│ ├─ [Sell]                                                              │
│ ├─ [Locations]                                                         │
│ ├─ Divider                                                             │
│ └─ [Login / Sign up] or [Dashboard] [Logout]                          │
│                                                                          │
│                     Page Content                                         │
│                                                                          │
│                                                                          │
│ Modal (when open):                                                       │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ [X] Close button                                                   │ │
│ │                                                                    │ │
│ │ [Login/Signup Form]                                               │ │
│ │ • [Login] [Sign Up] tabs                                         │ │
│ │ • Email input                                                     │ │
│ │ • Password input [eye icon]                                      │ │
│ │ • [Sign In / Sign Up] button                                     │ │
│ │ • [Continue with Google]                                          │ │
│ │                                                                    │ │
│ │ (Testimonials NOT shown on mobile)                               │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Component Mount                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  AuthProvider setup   │
                    │  - Check localStorage │
                    │  - Get session        │
                    │  - Set user state     │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Navbar mounts        │
                    │  - Check user state   │
                    └───────────────────────┘
                                │
                                ├─ If user exists:
                                │       ▼
                                │  Fetch profile
                                │  from Supabase
                                │
                                ├─ Render accordingly:
                                │  ├─ "Login / Sign up" (no user)
                                │  └─ Avatar + dropdown (user exists)
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Ready for interaction│
                    │  Listen for clicks    │
                    └───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      User Clicks "Login / Sign up"                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  setIsLoginModalOpen  │
                    │  = true               │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Modal opens with     │
                    │  Framer Motion        │
                    │  animation            │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Ready for form input │
                    │  Testimonials auto-   │
                    │  rotate every 5s      │
                    └───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      User Submits Login Form                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Validate form        │
                    │  Show errors if any   │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Set loading = true   │
                    │  Show spinner         │
                    │  Disable button       │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Call signIn()        │
                    │  from AuthContext     │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Supabase processes   │
                    │  authentication       │
                    │  - Validate email     │
                    │  - Check password     │
                    │  - Create session     │
                    └───────────────────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
            ✅ Success                   ❌ Error
                  │                           │
                  ▼                           ▼
      ┌─────────────────────┐      ┌──────────────────┐
      │ AuthContext updates │      │ Show error msg   │
      │ - user = User       │      │ - loading = false│
      │ - session = Session │      │ - button enabled │
      └─────────────────────┘      └──────────────────┘
                  │
                  ▼
      ┌─────────────────────┐
      │ Show success state  │
      │ - Animated         │
      │ checkmark          │
      │ - Success message  │
      └─────────────────────┘
                  │
                  ▼
      ┌─────────────────────┐
      │ Auto-close modal    │
      │ (1.5s delay)        │
      └─────────────────────┘
                  │
                  ▼
      ┌─────────────────────┐
      │ Navbar re-renders   │
      │ - Shows user info   │
      │ - Dropdown appears  │
      └─────────────────────┘
```

## File Organization

```
src/
├── components/
│   ├── auth/ ✨ NEW
│   │   ├── Navbar.tsx ✨ NEW
│   │   ├── LoginSignupModal.tsx ✨ NEW
│   │   └── ProtectedRoute.tsx (existing)
│   ├── ui/ (existing shadcn components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── alert.tsx
│   │   └── ...
│   └── ... (other components)
├── contexts/
│   └── AuthContext.tsx (existing)
├── integrations/
│   └── supabase/
│       └── client.ts (existing)
├── pages/
│   ├── Login.tsx (existing, can keep for backward compat)
│   ├── Signup.tsx (existing, can keep for backward compat)
│   └── ... (other pages)
└── App.tsx (update to use <Navbar />)

Documentation/ (root level)
├── NAVBAR_README.md ✨ NEW
├── NAVBAR_INTEGRATION_GUIDE.md ✨ NEW
├── NAVBAR_CODE_EXAMPLES.tsx ✨ NEW
├── NAVBAR_STYLING_GUIDE.md ✨ NEW
├── NAVBAR_TYPESCRIPT_TYPES.ts ✨ NEW
└── NAVBAR_IMPLEMENTATION_SUMMARY.ts ✨ NEW
```

## Authentication Flow - Complete Sequence

```
User                 Browser                  Modal              AuthContext           Supabase
 │                     │                       │                    │                    │
 │ Clicks "Login"      │                       │                    │                    │
 ├────────────────────>│                       │                    │                    │
 │                     │ Opens Modal           │                    │                    │
 │                     ├──────────────────────>│                    │                    │
 │                     │ Show form             │                    │                    │
 │                     │<──────────────────────┤                    │                    │
 │                     │                       │                    │                    │
 │ Enters email & pwd  │                       │                    │                    │
 ├────────────────────>│                       │                    │                    │
 │ Clicks "Sign In"    │                       │                    │                    │
 ├────────────────────>│ Validate form         │                    │                    │
 │                     ├──────────────────────>│                    │                    │
 │                     │                       │ Valid              │                    │
 │                     │<──────────────────────┤                    │                    │
 │                     │ Show spinner          │                    │                    │
 │                     │<──────────────────────┤                    │                    │
 │                     │                       │ Call signIn()     │                    │
 │                     │                       ├───────────────────>│                    │
 │                     │                       │                    │ POST /auth/v1/token│
 │                     │                       │                    ├───────────────────>│
 │                     │                       │                    │                    │
 │                     │                       │                    │ Validate email    │
 │                     │                       │                    │ Hash password     │
 │                     │                       │                    │ Create JWT        │
 │                     │                       │                    │<───────────────────┤
 │                     │                       │                    │ Return user + JWT │
 │                     │                       │<───────────────────┤                    │
 │                     │                       │ Update state       │                    │
 │                     │                       │ - user = User     │                    │
 │                     │                       │ - session = Sess  │                    │
 │                     │                       │ - localStorage JWT│                    │
 │                     │                       │<──────────────────┤                    │
 │ Sees checkmark      │ Show success          │                    │                    │
 │ & message           │<──────────────────────┤                    │                    │
 │ (Auto-closes in 1.5s)                      │                    │                    │
 │                     │ Close modal           │                    │                    │
 │                     │<──────────────────────┤                    │                    │
 │                     │                       │                    │                    │
 │ Sees user avatar    │ Navbar updates        │                    │                    │
 │ & dropdown          ├──────────────────────>│ (re-render)       │                    │
 │                     │                       │                    │                    │
```

---

This comprehensive architecture ensures:
- ✅ Clear separation of concerns
- ✅ Reusable components
- ✅ Proper state management
- ✅ Smooth animations
- ✅ Mobile responsiveness
- ✅ Type safety
- ✅ Easy to maintain and extend
