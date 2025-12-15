/**
 * AuthContext - Manages customer authentication state
 * Provides auth methods (login, signup, logout) and current user data
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithFacebook: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up new customer
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { error };

      // Create profile entry with customer role
      if (data.user) {
        // @ts-ignore - profiles table will be created via migration
        const { error: profileError } = await supabase.from("profiles")
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

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // Sign in existing customer
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // Sign in with Facebook OAuth
  const signInWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // Sign out customer
  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error && error.message !== 'Auth session missing!') {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
    } catch (err) {
      // Even if signOut fails, clear local state
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
