/**
 * LoginSignupModal - Modern modal for login/signup with glassmorphism UI
 * Features:
 * - Tabbed layout (Login / Sign Up)
 * - Rotating testimonials with Framer Motion animations
 * - Supabase Auth integration
 * - Inline error handling and loading states
 * - Responsive design
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Eye, EyeOff, Mail, Lock, User, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface LoginSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "login" | "signup";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  general?: string;
}

const TESTIMONIALS = [
  {
    quote: "Securely manage your Dubai property investments.",
    author: "Smart Investors",
    emoji: "🏠",
  },
  {
    quote: "Login to track enquiries, favourites, and more.",
    author: "Property Owners",
    emoji: "📊",
  },
  {
    quote: "Join our community of happy property owners.",
    author: "Dubai Nest Hub",
    emoji: "🌟",
  },
  {
    quote: "Invest in premium Dubai real estate with confidence.",
    author: "Expert Advisors",
    emoji: "💎",
  },
  {
    quote: "Your property portfolio at your fingertips.",
    author: "Modern Investors",
    emoji: "📱",
  },
];

export const LoginSignupModal = ({
  isOpen,
  onClose,
}: LoginSignupModalProps) => {
  const [tab, setTab] = useState<Tab>("login");
  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const { signIn, signUp, signInWithGoogle, signInWithFacebook } = useAuth();

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset form when switching tabs
  useEffect(() => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
    setErrors({});
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [tab]);

  // Validate email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate login form
  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate signup form
  const validateSignupForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateLoginForm()) return;

    setLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateSignupForm()) return;

    setLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName
    );

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setErrors({});
    setLoading(true);

    const { error } = await signInWithFacebook();

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    }
  };

  const currentTestimonial = TESTIMONIALS[testimonialIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="w-full max-w-4xl my-8">
              {/* Modal Container */}
              <div className="relative bg-white dark:bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                  {/* Left Section - Testimonials (Hidden on Mobile) */}
                  <div className="hidden lg:flex lg:col-span-2 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 p-6 flex-col justify-between min-h-[500px]">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Dubai Nest Hub
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your trusted real estate partner
                      </p>
                    </div>

                    {/* Rotating Testimonial */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={testimonialIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        <div className="text-4xl">{currentTestimonial.emoji}</div>
                        <blockquote className="text-lg font-semibold text-gray-900 dark:text-white">
                          "{currentTestimonial.quote}"
                        </blockquote>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          — {currentTestimonial.author}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    {/* Testimonial Dots */}
                    <div className="flex gap-2">
                      {TESTIMONIALS.map((_, index) => (
                        <motion.button
                          key={index}
                          className={`h-2 rounded-full transition-all ${
                            index === testimonialIndex
                              ? "bg-primary w-8"
                              : "bg-gray-300 dark:bg-gray-600 w-2"
                          }`}
                          onClick={() => setTestimonialIndex(index)}
                          whileHover={{ scale: 1.2 }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right Section - Form */}
                  <div className="lg:col-span-3 p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                      {(["login", "signup"] as const).map((t) => (
                        <motion.button
                          key={t}
                          onClick={() => setTab(t)}
                          className={`pb-2 font-semibold relative text-lg ${
                            tab === t
                              ? "text-primary"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {t === "login" ? "Login" : "Sign Up"}
                          {tab === t && (
                            <motion.div
                              layoutId="underline"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 40,
                              }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Success State */}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5 }}
                        >
                          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {tab === "login" ? "Welcome back!" : "Welcome!"}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {tab === "login"
                            ? "You're now logged in."
                            : "Your account has been created."}
                        </p>
                      </motion.div>
                    )}

                    {/* Error Alert */}
                    {errors.general && !success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                      >
                        <Alert variant="destructive">
                          <AlertDescription>{errors.general}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    {!success && (
                      <>
                        {/* Login Form */}
                        {tab === "login" && (
                          <motion.form
                            key="login"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleLogin}
                            className="space-y-5"
                          >
                            {/* Email Field */}
                            <div className="space-y-2">
                              <Label htmlFor="login-email">Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  id="login-email"
                                  type="email"
                                  placeholder="you@example.com"
                                  value={formData.email}
                                  onChange={(e) =>
                                    handleInputChange("email", e.target.value)
                                  }
                                  className="pl-10"
                                />
                              </div>
                              {errors.email && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-sm text-red-500"
                                >
                                  {errors.email}
                                </motion.p>
                              )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                              <Label htmlFor="login-password">Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  id="login-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={formData.password}
                                  onChange={(e) =>
                                    handleInputChange("password", e.target.value)
                                  }
                                  className="pl-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                              {errors.password && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-sm text-red-500"
                                >
                                  {errors.password}
                                </motion.p>
                              )}
                            </div>

                            {/* Submit Button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              disabled={loading}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              {loading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                              {loading ? "Signing in..." : "Sign In"}
                            </motion.button>
                          </motion.form>
                        )}

                        {/* Sign Up Form */}
                        {tab === "signup" && (
                          <motion.form
                            key="signup"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleSignup}
                            className="space-y-5"
                          >
                            {/* Full Name Field */}
                            <div className="space-y-2">
                              <Label htmlFor="signup-name">Full Name</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  id="signup-name"
                                  type="text"
                                  placeholder="John Doe"
                                  value={formData.fullName}
                                  onChange={(e) =>
                                    handleInputChange("fullName", e.target.value)
                                  }
                                  className="pl-10"
                                />
                              </div>
                              {errors.fullName && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-sm text-red-500"
                                >
                                  {errors.fullName}
                                </motion.p>
                              )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                              <Label htmlFor="signup-email">Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  id="signup-email"
                                  type="email"
                                  placeholder="you@example.com"
                                  value={formData.email}
                                  onChange={(e) =>
                                    handleInputChange("email", e.target.value)
                                  }
                                  className="pl-10"
                                />
                              </div>
                              {errors.email && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-sm text-red-500"
                                >
                                  {errors.email}
                                </motion.p>
                              )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                              <Label htmlFor="signup-password">Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  id="signup-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={formData.password}
                                  onChange={(e) =>
                                    handleInputChange("password", e.target.value)
                                  }
                                  className="pl-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                              {errors.password && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-sm text-red-500"
                                >
                                  {errors.password}
                                </motion.p>
                              )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                              <Label htmlFor="signup-confirm">
                                Confirm Password
                              </Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  id="signup-confirm"
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={formData.confirmPassword}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "confirmPassword",
                                      e.target.value
                                    )
                                  }
                                  className="pl-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                              {errors.confirmPassword && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-sm text-red-500"
                                >
                                  {errors.confirmPassword}
                                </motion.p>
                              )}
                            </div>

                            {/* Submit Button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              disabled={loading}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              {loading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                              {loading ? "Creating account..." : "Sign Up"}
                            </motion.button>
                          </motion.form>
                        )}

{/* Divider */}
                        <div className="my-6 flex items-center gap-4">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Or
                          </span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* Social Sign In Buttons */}
                        <div className="space-y-3">
                          {/* Google Sign In Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            type="button"
                            className="w-full border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                            >
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                          </motion.button>

                          {/* Facebook Sign In Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFacebookSignIn}
                            disabled={loading}
                            type="button"
                            className="w-full border-2 border-gray-200 dark:border-gray-700 hover:border-[#1877F2] bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="#1877F2"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Continue with Facebook
                          </motion.button>
                        </div>

                        {/* Switch between Login/Signup */}
                        <div className="mt-6 text-center">
                          {tab === "login" ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Don't have an account?{" "}
                              <button
                                type="button"
                                onClick={() => setTab("signup")}
                                className="text-primary hover:text-primary/80 font-semibold transition-colors"
                              >
                                Create one now
                              </button>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Already have an account?{" "}
                              <button
                                type="button"
                                onClick={() => setTab("login")}
                                className="text-primary hover:text-primary/80 font-semibold transition-colors"
                              >
                                Sign in
                              </button>
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

