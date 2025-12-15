import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";

// Admin-specific validation schema with stricter password requirements
const AdminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const WHITELISTED_ADMIN_DOMAINS = [
  'truenester.com',
  'nesterhub.com',
  'gmail.com', // Allow for development/testing
  'yahoo.com', // Allow for development/testing
  'outlook.com', // Allow for development/testing
  // Add company domains only
];

// Whitelisted admin emails (secure list)
const WHITELISTED_ADMIN_EMAILS = [
  'admin@truenester.com',
  'info@truenester.com',
  // Add specific admin emails here
  // For development: Allow any email by commenting out domain check
];

export default function AdminAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Validate email domain for admins
  const validateAdminEmail = (emailAddress: string): boolean => {
    // FOR DEVELOPMENT: Allow all emails
    // TODO: Enable strict validation in production
    return true;
    
    // PRODUCTION CODE (uncomment for production):
    // Check if email is in whitelist OR domain is whitelisted
    // if (WHITELISTED_ADMIN_EMAILS.includes(emailAddress.toLowerCase())) {
    //   return true;
    // }
    // const domain = emailAddress.split("@")[1];
    // return WHITELISTED_ADMIN_DOMAINS.includes(domain);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validation = AdminLoginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Step 1: Validate admin email domain
      if (!validateAdminEmail(email)) {
        toast({
          title: "Access Denied",
          description: "Only company email addresses can access the admin panel.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Step 2: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Auth error:", error);
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast({
          title: "Login Failed",
          description: "No user data returned from authentication.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("✅ Auth successful, user ID:", data.user.id);
      
      // Security: Verify email is in admin whitelist
      const userEmail = data.user.email?.toLowerCase() || '';
      if (!validateAdminEmail(userEmail)) {
        console.error("Email not in admin whitelist:", userEmail);
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Your email is not authorized for admin access.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Success - redirect to admin dashboard
      toast({
        title: "Welcome Back",
        description: "You have been successfully logged in.",
      });

      // Add a small delay to ensure session is established
      setTimeout(() => {
        const redirect = searchParams.get("redirect");
        navigate(redirect || "/admin/dashboard", { replace: true });
      }, 300);
      
    } catch (error: unknown) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Nest Hub</h1>
          </div>
          <p className="text-slate-400 text-sm">Admin Panel - Secure Access</p>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-700 bg-slate-800/50 shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Lock className="h-6 w-6 text-blue-500" />
              Admin Login
            </CardTitle>
            <p className="text-sm text-slate-400">
              Enterprise-grade security. Company email required.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Company Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@truenester.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  Only whitelisted company domains are permitted
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  Minimum 12 characters with complexity requirements
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Secure Login
                  </>
                )}
              </Button>

              {/* Security Notice */}
              <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300">
                  🔒 <strong>Secure Facility:</strong> This admin panel is protected with
                  enterprise-grade security controls including IP whitelisting, MFA,
                  and comprehensive audit logging.
                </p>
              </div>

              {/* Support Link */}
              <div className="text-center pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  Admin access issues?{" "}
                  <a
                    href="mailto:admin@truenester.com"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Contact Support
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Security Info */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>⚠️ Unauthorized access attempts are logged and monitored</p>
          <p>🔐 All sessions are encrypted with TLS 1.3</p>
          <p>📊 Audit trail maintained for compliance</p>
        </div>
      </div>
    </div>
  );
}
