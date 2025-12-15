/**
 * COMPLETE AUTH & ROUTING REBUILD GUIDE
 * 
 * This guide shows how to integrate the new auth system into your existing app
 */

/*
═══════════════════════════════════════════════════════════════════════════════
STEP 1: Replace AuthContext in App.tsx (or main.tsx)
═══════════════════════════════════════════════════════════════════════════════

BEFORE (existing code):
```tsx
import { AuthProvider } from "@/contexts/AuthContext";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

AFTER (new code):
```tsx
import { AuthProvider } from "@/contexts/AuthContext.v2";  // ← Change to v2

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>  {/* Now uses improved AuthContext.v2 */}
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

═══════════════════════════════════════════════════════════════════════════════
STEP 2: Update Routes in App.tsx
═══════════════════════════════════════════════════════════════════════════════

Replace your existing route definitions with:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Favorites from "@/pages/Favorites";
import Inquiries from "@/pages/Inquiries";
import MyReviews from "@/pages/MyReviews";
import AdminReviews from "@/pages/admin/AdminReviews";

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Index />} />
      <Route path="/properties" element={<Properties />} />
      <Route path="/properties/:id" element={<PropertyDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* PROTECTED ROUTES - Require Authentication */}
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inquiries"
        element={
          <ProtectedRoute>
            <Inquiries />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reviews"
        element={
          <ProtectedRoute>
            <MyReviews />
          </ProtectedRoute>
        }
      />

      {/* ADMIN-ONLY ROUTES */}
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminReviews />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
```

═══════════════════════════════════════════════════════════════════════════════
STEP 3: Update Navigation.tsx for Modern Guest/Logged-In States
═══════════════════════════════════════════════════════════════════════════════

Replace your Navigation component with this modern version:

```tsx
import { useAuth } from "@/contexts/AuthContext.v2";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { LogOut, Heart, FileText, Star, Menu, X, ChevronDown } from "lucide-react";

const Navigation = () => {
  const { isAuthenticated, isLoading, userProfile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-bold text-2xl text-primary">
          TrueNester
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/properties" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">
            Properties
          </Link>
        </div>

        {/* Auth Section - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          ) : isAuthenticated && userProfile ? (
            // LOGGED IN: Show avatar dropdown
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  {userProfile.full_name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                  {userProfile.full_name || "User"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    <Link
                      to="/favorites"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      My Favorites
                    </Link>
                    <Link
                      to="/inquiries"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      My Inquiries
                    </Link>
                    <Link
                      to="/my-reviews"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      My Reviews
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // LOGGED OUT: Show login/signup buttons
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary transition-colors font-medium"
              >
                Login
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Sign up
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden p-2 text-gray-700 dark:text-gray-300"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-4 space-y-4">
              {isAuthenticated && userProfile ? (
                <>
                  <Link to="/favorites" className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary">
                    My Favorites
                  </Link>
                  <Link to="/inquiries" className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary">
                    My Inquiries
                  </Link>
                  <Link to="/my-reviews" className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary">
                    My Reviews
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 text-red-600 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary">
                    Login
                  </Link>
                  <Link to="/signup" className="block py-2 px-4 bg-primary text-white rounded-lg text-center">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navigation;
```

═══════════════════════════════════════════════════════════════════════════════
STEP 4: Update Login Page to Handle Redirects
═══════════════════════════════════════════════════════════════════════════════

In your Login.tsx (existing page), add redirect logic:

```tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.v2";

const Login = () => {
  const { signIn, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get("redirect");

  // If already logged in and there's a redirect, go there
  useEffect(() => {
    if (isAuthenticated && redirect) {
      navigate(redirect);
    }
  }, [isAuthenticated, redirect, navigate]);

  const handleLoginSuccess = async () => {
    // After successful login, redirect to the intended page
    if (redirect) {
      navigate(redirect);
    } else {
      navigate("/");
    }
  };

  // ... rest of your login form
};
```

Same for Signup.tsx.

═══════════════════════════════════════════════════════════════════════════════
STEP 5: Home Page Reviews Section with Write Review Button
═══════════════════════════════════════════════════════════════════════════════

In your Index.tsx (home page), update the reviews section:

```tsx
import { useAuth } from "@/contexts/AuthContext.v2";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ReviewsSection = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      // Redirect to login with redirect back to reviews section
      navigate("/login?redirect=/#reviews");
    } else {
      // Scroll to or navigate to review form
      navigate("/my-reviews/new");
    }
  };

  return (
    <section id="reviews" className="py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-bold">Customer Reviews</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleWriteReview}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          ✍️ Write a Review
        </motion.button>
      </div>

      {/* Reviews carousel - show only approved reviews */}
      {/* ... existing review cards code ... */}
    </section>
  );
};
```

═══════════════════════════════════════════════════════════════════════════════
STEP 6: Property Detail Page - Inquiry Form (Authenticated Only)
═══════════════════════════════════════════════════════════════════════════════

In PropertyDetail.tsx, check auth before showing inquiry form:

```tsx
import { useAuth } from "@/contexts/AuthContext.v2";
import { useNavigate } from "react-router-dom";

const PropertyDetail = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleInquiryClick = () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
    } else {
      // Show inquiry form
    }
  };

  return (
    <>
      {/* Property details */}
      {isAuthenticated ? (
        <InquiryForm propertyId={propertyId} />
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Sign in to send an inquiry
          </p>
          <button onClick={handleInquiryClick} className="px-4 py-2 bg-primary text-white rounded-lg">
            Sign In / Sign Up
          </button>
        </div>
      )}
    </>
  );
};
```

═══════════════════════════════════════════════════════════════════════════════
STEP 7: Update Your Supabase Database Schema
═══════════════════════════════════════════════════════════════════════════════

Run these migrations in Supabase:

-- Ensure profiles table has role column
ALTER TABLE profiles ADD COLUMN role text DEFAULT 'customer';

-- Reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  property_title text,
  rating int CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Favorites table
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Conversations (for inquiries) should have user_id field
ALTER TABLE conversations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

═══════════════════════════════════════════════════════════════════════════════
KEY AUTH FLOW SUMMARY
═══════════════════════════════════════════════════════════════════════════════

1. User NOT logged in → /login & /signup pages visible → Login/Signup buttons in navbar
2. User clicks "My Favorites" → Redirects to /login?redirect=/favorites
3. User logs in → Auth state updates via Supabase subscription → useAuth hook detects isAuthenticated=true
4. Component redirects to the intended page (from query param)
5. ProtectedRoute checks isAuthenticated → renders protected component
6. User dropdown shows in navbar with user profile, favorites, inquiries, reviews links
7. Admin users can access /admin/reviews to approve/reject reviews
8. Only approved reviews show on public pages (Index, PropertyDetail)

═══════════════════════════════════════════════════════════════════════════════
TYPESCRIPT TYPES CHEAT SHEET
═══════════════════════════════════════════════════════════════════════════════

From AuthContext.v2:
- useAuth() → returns AuthContextType
- AuthContextType has: user, userProfile, isAuthenticated, isLoading, signIn, signOut, etc.
- UserProfile has: id, email, full_name, avatar_url, role, created_at

Use in components:
const { isAuthenticated, userProfile, signOut } = useAuth();

═══════════════════════════════════════════════════════════════════════════════
ANIMATIONS (Already Included)
═══════════════════════════════════════════════════════════════════════════════

- Navbar dropdown: Framer Motion scale + fade animation
- Protected route loading: Rotating spinner with fade-in
- Page transitions: Initial opacity/transform animations
- Button hover: scale 1.05 on whileHover
- Dropdowns: appear with scale 0.95 and animate to 1

All using motion.div, AnimatePresence from framer-motion
No heavy modals - just clean navigation and page transitions

═══════════════════════════════════════════════════════════════════════════════
*/
