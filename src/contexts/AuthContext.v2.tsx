/**
 * AuthContext v2 - Complete Auth & Routing System
 * 
 * Manages:
 * - Supabase Auth state (source of truth)
 * - User profile & metadata (role, permissions)
 * - Authentication methods (login, signup, logout, OAuth)
 * - Loading states during auth transitions
 * - Redirect handling after login/signup
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/** User profile with role information */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "customer" | "admin"; // Determine permissions based on role
  created_at: string;
}

/** Complete auth context type */
export interface AuthContextType {
  // State
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Methods
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithFacebook: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;

  // Utilities
  isAdmin: () => boolean;
  setRedirectUrl: (url: string) => void;
  getRedirectUrl: () => string | null;
  clearRedirectUrl: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect URL for post-login navigation
  const [redirectUrl, setRedirectUrlState] = useState<string | null>(
    () => sessionStorage.getItem("auth_redirect_url")
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Fetch user profile from database
   * This gives us the role and other metadata
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role, created_at")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setUserProfile(data as UserProfile);
      } else {
        // If profile doesn't exist, default to customer role
        setUserProfile({
          id: userId,
          email: "",
          full_name: null,
          avatar_url: null,
          role: "customer",
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, []);

  /**
   * Initialize auth on mount
   * Listen for auth state changes from Supabase
   * Uses immediate localStorage check + async verification for fast loading
   */
  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;

    // STEP 1: Immediately check localStorage for existing session (sync, fast)
    const checkLocalSession = () => {
      try {
        // Find the Supabase auth key in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            const storedSession = localStorage.getItem(key);
            if (storedSession) {
              const parsed = JSON.parse(storedSession);
              if (parsed?.user && parsed?.access_token) {
                console.log("🔐 AuthContext: Found cached session in localStorage");
                return { user: parsed.user, session: parsed };
              }
            }
          }
        }
      } catch (e) {
        console.warn("Could not parse localStorage session:", e);
      }
      return null;
    };

    // STEP 2: Set initial state from localStorage immediately
    const cachedAuth = checkLocalSession();
    if (cachedAuth && isMounted) {
      console.log("🔐 AuthContext: Using cached session");
      setUser(cachedAuth.user);
      setSession(cachedAuth.session);
      // Fetch profile in background, don't block loading
      fetchUserProfile(cachedAuth.user.id).catch(console.error);
      setIsLoading(false);
    }

    // STEP 3: Verify session with Supabase (async, but non-blocking if cached)
    const initAuth = async () => {
      try {
        console.log("🔐 AuthContext: Verifying session with Supabase...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ AuthContext: Session error:", error);
        }

        if (isMounted) {
          console.log("🔐 AuthContext: Session verified:", !!session);
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Only wait for Supabase if no cached session found
    if (!cachedAuth) {
      // Set timeout to prevent infinite loading
      authTimeout = setTimeout(() => {
        if (isMounted && isLoading) {
          console.warn("⚠️ AuthContext: Auth check timed out, setting to unauthenticated");
          setIsLoading(false);
        }
      }, 5000); // 5 second timeout
    }

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 AuthContext: Auth state changed:", event);
      
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch profile but don't block UI
          fetchUserProfile(session.user.id).catch(console.error);
        } else {
          setUserProfile(null);
        }

        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  /**
   * Sign up with email/password
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Create profile entry
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              role: "customer",
              full_name: fullName,
              email: email,
            },
          ]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      return { error: error as AuthError };
    }
  };

  /**
   * Sign in with email/password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      return { error: error as AuthError };
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return { error };
      }

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      return { error: error as AuthError };
    }
  };

  /**
   * Sign in with Facebook OAuth
   */
  const signInWithFacebook = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Facebook sign in failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return { error };
      }

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      return { error: error as AuthError };
    }
  };

  /**
   * Sign out - clears session and redirects to home
   */
  const signOut = async () => {
    console.log("🔐 AuthContext: Signing out...");
    
    try {
      // Step 1: Clear local state FIRST
      setUser(null);
      setUserProfile(null);
      setSession(null);
      clearRedirectUrl();

      // Step 2: Clear ALL Supabase-related localStorage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log("🗑️ Removing localStorage key:", key);
        localStorage.removeItem(key);
      });

      // Step 3: Call Supabase signOut with global scope
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error && error.message !== "Auth session missing!") {
        console.error("❌ SignOut error:", error);
      }

      // Step 4: CRITICAL - Wait for auth state to fully propagate to anonymous
      // This prevents race condition where queries refetch before anonymous state is ready
      console.log("⏳ Waiting for auth state to propagate...");
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 5: Clear React Query cache to force refetch with anonymous access
      // This ensures properties, locations, reviews load with proper public RLS policies
      console.log("🔄 Invalidating all queries for anonymous access...");
      await queryClient.clear(); // Use clear() instead of invalidateQueries() for complete reset

      // Step 6: Show success toast notification
      toast({
        title: "You have successfully logged out",
        description: "See you next time! 👋",
      });

      console.log("✅ AuthContext: Sign out complete, redirecting...");
      
      // Step 7: Redirect to home after brief delay for toast visibility
      setTimeout(() => {
        window.location.replace("/");
      }, 1500);
    } catch (err) {
      console.error("❌ SignOut exception:", err);
      
      // Show error toast but still redirect
      toast({
        title: "Logged out",
        description: "You have been signed out. Redirecting...",
      });
      
      // Force redirect even on error after brief delay
      setTimeout(() => {
        window.location.replace("/");
      }, 1500);
    }
  };

  // Whitelisted admin domains and emails
  const ADMIN_DOMAINS = ['truenester.com', 'nesterhub.com'];
  const ADMIN_EMAILS = ['admin@truenester.com', 'info@truenester.com'];

  /**
   * Check if user is admin
   * Checks profile role OR whitelisted email/domain
   */
  const isAdmin = () => {
    // Check profile role first
    if (userProfile?.role === "admin") {
      return true;
    }
    
    // Check whitelisted emails
    const email = user?.email?.toLowerCase() || '';
    if (ADMIN_EMAILS.includes(email)) {
      return true;
    }
    
    // Check whitelisted domains
    const domain = email.split('@')[1];
    if (domain && ADMIN_DOMAINS.includes(domain)) {
      return true;
    }
    
    return false;
  };

  /**
   * Redirect URL management
   * Used to redirect user back after login
   */
  const setRedirectUrl = (url: string) => {
    setRedirectUrlState(url);
    sessionStorage.setItem("auth_redirect_url", url);
  };

  const getRedirectUrl = () => redirectUrl;

  const clearRedirectUrl = () => {
    setRedirectUrlState(null);
    sessionStorage.removeItem("auth_redirect_url");
  };

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    isAdmin,
    setRedirectUrl,
    getRedirectUrl,
    clearRedirectUrl,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
