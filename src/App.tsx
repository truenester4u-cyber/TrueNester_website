import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Buy from "./pages/Buy";
import Rent from "./pages/Rent";
import Sell from "./pages/Sell";
import About from "./pages/About";
import Locations from "./pages/Locations";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Properties from "./pages/admin/Properties";
import PropertyForm from "./pages/admin/PropertyForm";
import AdminLocations from "./pages/admin/Locations";
import LocationForm from "./pages/admin/LocationForm";
import BlogPosts from "./pages/admin/BlogPosts";
import BlogPostForm from "./pages/admin/BlogPostForm";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";
import ConversationsPage from "./pages/admin/Conversations";
import AdminReviews from "./pages/admin/Reviews";
import SellSubmissions from "./pages/admin/SellSubmissions";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminAuth from "./pages/AdminAuth";
import TrueNesterChatbot from "./components/chat/TrueNesterChatbot";
import { CookieBanner } from "./components/CookieBanner";
import { AnalyticsLoader } from "./components/AnalyticsLoader";
import { AuthProvider } from "./contexts/AuthContext.v2";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Favorites from "./pages/Favorites";
import Inquiries from "./pages/Inquiries";
import MyReviews from "./pages/MyReviews";
import QueryDebug from "./pages/QueryDebug";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - keep data fresh but avoid excessive refetching
      gcTime: 15 * 60 * 1000, // 15 minutes cache lifetime
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors), do retry on 5xx and network errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2; // Reduce to 2 attempts to speed up failures
      },
      retryDelay: (attemptIndex) => Math.min(500 * Math.pow(2, attemptIndex), 10000), // Faster backoff
      refetchOnWindowFocus: false, // Don't refetch on focus - data is fresh enough
      refetchOnReconnect: true, // Only refetch when network comes back online
      refetchOnMount: false, // Don't refetch on mount if data exists
    },
  },
});

const AppRoutes = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Scroll to top on route change or page refresh
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/about" element={<About />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/query-debug" element={<QueryDebug />} />
        
        {/* Customer Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Customer Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
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
        
        {/* Admin Routes - Secure Access */}
        {/* Redirect /auth to admin login - no separate customer admin accounts */}
        <Route path="/auth" element={<Navigate to="/admin/login" replace />} />
        {/* Admin Login - NO SIGNUP (Company email only) */}
        <Route path="/admin/login" element={<AdminAuth />} />
        
        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/properties"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Properties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/properties/new"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PropertyForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/properties/edit/:id"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PropertyForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations/new"
          element={
            <ProtectedRoute requireAdmin={true}>
              <LocationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations/edit/:id"
          element={
            <ProtectedRoute requireAdmin={true}>
              <LocationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blog"
          element={
            <ProtectedRoute requireAdmin={true}>
              <BlogPosts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blog/new"
          element={
            <ProtectedRoute requireAdmin={true}>
              <BlogPostForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blog/edit/:id"
          element={
            <ProtectedRoute requireAdmin={true}>
              <BlogPostForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conversations"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sell-submissions"
          element={
            <ProtectedRoute requireAdmin={true}>
              <SellSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/newsletter"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminNewsletter />
            </ProtectedRoute>
          }
        />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && <TrueNesterChatbot />}
    </>
  );
};

const App = () => {
  const [authReady, setAuthReady] = useState(false);

  // Wait for Supabase auth to initialize before rendering
  // This prevents race conditions where queries run before auth is ready
  // Timeout after 2 seconds to prevent indefinite loading
  useEffect(() => {
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout>;
    
    const initAuth = async () => {
      try {
        // Get the current session - this ensures auth state is loaded
        // Use a timeout to prevent hanging on network issues
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => {
          timeout = setTimeout(() => resolve(null), 2000);
        });

        await Promise.race([sessionPromise, timeoutPromise]);
        
        if (mounted) {
          // After auth is ready, invalidate all queries to force refetch with proper auth context
          queryClient.invalidateQueries();
          setAuthReady(true);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) {
          setAuthReady(true); // Still proceed even on error
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // Show loading spinner while auth initializes (max 2 seconds)
  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AnalyticsLoader />
            <AppRoutes />
            <CookieBanner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
