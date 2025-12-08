import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import PropertyDetail from "./pages/PropertyDetail";
import Auth from "./pages/Auth";
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
import TrueNesterChatbot from "./components/chat/TrueNesterChatbot";
import { CookieBanner } from "./components/CookieBanner";
import { AnalyticsLoader } from "./components/AnalyticsLoader";

const queryClient = new QueryClient();

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
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/properties" element={<Properties />} />
        <Route path="/admin/properties/new" element={<PropertyForm />} />
        <Route path="/admin/properties/edit/:id" element={<PropertyForm />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/locations/new" element={<LocationForm />} />
        <Route path="/admin/locations/edit/:id" element={<LocationForm />} />
        <Route path="/admin/blog" element={<BlogPosts />} />
        <Route path="/admin/blog/new" element={<BlogPostForm />} />
        <Route path="/admin/blog/edit/:id" element={<BlogPostForm />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/conversations" element={<ConversationsPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && <TrueNesterChatbot />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsLoader />
        <AppRoutes />
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
