/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUICK CODE EXAMPLES - NAVBAR & LOGIN/SIGNUP MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Basic App Integration
// ═══════════════════════════════════════════════════════════════════════════════

import { Navbar } from "@/components/auth/Navbar";

// In your App.tsx or main layout:
export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Replace any existing navbar with this */}
      <Navbar />

      {/* Your routes and content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Page content */}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Using Auth Hook in Your Components
// ═══════════════════════════════════════════════════════════════════════════════

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function Dashboard() {
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to home if not logged in
      window.location.href = "/";
    }
  }, [user, loading]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user.email}!</h1>
        <p>User ID: {user.id}</p>
      </div>

      <button
        onClick={async () => {
          await signOut();
        }}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Fetch User Profile Data
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
}

export function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone, bio")
        .eq("id", user!.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Use fallback data from user metadata
        setProfile({
          full_name: user?.user_metadata?.full_name || null,
          avatar_url: user?.user_metadata?.avatar_url || null,
          phone: null,
          bio: null,
        });
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>No profile data</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center gap-4 mb-6">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || "User"}
            className="h-20 w-20 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{profile.phone}</p>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Open Login Modal from Any Component
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { LoginSignupModal } from "@/components/auth/LoginSignupModal";
import { Button } from "@/components/ui/button";

export function PropertyDetail() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleInquireClick = () => {
    // Open login modal before showing inquiry form
    setIsLoginModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Beautiful Dubai Apartment</h1>
      <p className="text-gray-600">$500,000</p>

      <Button
        size="lg"
        onClick={handleInquireClick}
        className="w-full"
      >
        Make Inquiry
      </Button>

      {/* Modal will open when user clicks the button */}
      <LoginSignupModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Protected Route Component
// ═══════════════════════════════════════════════════════════════════════════════

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Usage in App.tsx:
// <Route
//   path="/dashboard"
//   element={
//     <ProtectedRoute>
//       <Dashboard />
//     </ProtectedRoute>
//   }
// />

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Custom Sign Up with Additional Data
// ═══════════════════════════════════════════════════════════════════════════════

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function AdvancedSignup() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    investmentBudget: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // First, create the auth account
    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.fullName
    );

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Then, get the user and save additional profile data
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          // Custom field (if it exists in your profiles table)
          // investment_budget: formData.investmentBudget,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />

      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />

      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />

      <input
        type="number"
        placeholder="Investment Budget (AED)"
        value={formData.investmentBudget}
        onChange={(e) => setFormData({ ...formData, investmentBudget: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />

      <button
        type="submit"
        className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
      >
        Create Account
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Handle Auth State Changes
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function AuthAwareComponent() {
  const { user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log("User logged in:", user.email);
      console.log("Session expires at:", session?.expires_at);
    } else {
      console.log("User logged out");
    }
  }, [user, session]);

  useEffect(() => {
    // Redirect based on auth state
    if (user && window.location.pathname === "/login") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div>
      <h1>
        {user ? `Welcome, ${user.email}` : "Please log in"}
      </h1>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Upload Profile Avatar
// ═══════════════════════════════════════════════════════════════════════════════

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function AvatarUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      if (!user || !event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      setUploading(true);

      // Upload to storage
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(`${user.id}/${Date.now()}`, file, {
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      console.log("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-gray-700 dark:text-gray-300">Upload Avatar</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={uploading}
          className="mt-2"
        />
      </label>
      {uploading && <p>Uploading...</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Modify Navbar Dropdown Items (Customization)
// ═══════════════════════════════════════════════════════════════════════════════

/*
 * To add or remove dropdown menu items in the Navbar, edit Navbar.tsx
 * 
 * Look for the "Dropdown Menu" section (~line 195) and modify these items:
 * 
 * CURRENT ITEMS:
 * - Dashboard (links to /dashboard)
 * - My Favorites (links to /dashboard?tab=favorites)
 * - Profile (links to /dashboard?tab=profile)
 * - Settings (links to /dashboard?tab=settings)
 * - Logout
 * 
 * TO ADD A NEW ITEM:
 * 
 * <Link
 *   to="/my-properties"
 *   onClick={() => setIsDropdownOpen(false)}
 *   className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
 * >
 *   <Building className="h-4 w-4" />
 *   <span>My Properties</span>
 * </Link>
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Customize Modal Testimonials
// ═══════════════════════════════════════════════════════════════════════════════

/*
 * To change the rotating testimonials in LoginSignupModal.tsx,
 * find the TESTIMONIALS array at the top and modify it:
 * 
 * CURRENT:
 * const TESTIMONIALS = [
 *   {
 *     quote: "Securely manage your Dubai property investments.",
 *     author: "Smart Investors",
 *     emoji: "🏠",
 *   },
 *   // ... more items
 * ];
 * 
 * TO ADD A NEW TESTIMONIAL:
 * 
 * {
 *   quote: "Find your dream home in the heart of Dubai.",
 *   author: "Happy Homeowners",
 *   emoji: "🏡",
 * },
 */

// ═══════════════════════════════════════════════════════════════════════════════
// You can now use all these examples in your application!
// ═══════════════════════════════════════════════════════════════════════════════
