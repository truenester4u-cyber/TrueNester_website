/**
 * Navbar - Top navigation bar with integrated auth
 * Features:
 * - Shows "Login / Sign up" button when logged out
 * - Shows user avatar + name + dropdown menu when logged in
 * - Framer Motion animations for hover and dropdown states
 * - Responsive mobile menu
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  User,
  Home,
  Heart,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.v2";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/TrueNester_logo.png";
import { LoginSignupModal } from "./LoginSignupModal";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user profile on mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      } else {
        // Fallback to user metadata
        setUserProfile({
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      }
    } catch {
      // Fallback if profile table doesn't exist yet
      setUserProfile({
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = userProfile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <>
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={logoImage}
                alt="Dubai Nest Hub"
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/buy"
                className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
              >
                Buy
              </Link>
              <Link
                to="/rent"
                className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
              >
                Rent
              </Link>
              <Link
                to="/sell"
                className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
              >
                Sell
              </Link>
              <Link
                to="/locations"
                className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
              >
                Locations
              </Link>
            </div>

            {/* Right Side - Auth / User Menu */}
            <div className="flex items-center gap-4">
              {!user ? (
                // Login/Signup Button (Logged Out)
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Login / Sign up
                </motion.button>
              ) : (
                // User Menu (Logged In)
                <div className="hidden sm:flex items-center gap-3 relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {/* Avatar Circle */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                      {userProfile?.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt={displayName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(displayName)
                      )}
                    </div>

                    {/* Name + Chevron */}
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Account
                      </p>
                    </div>

                    <motion.div
                      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </motion.div>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* Profile Section */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Home className="h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>

                          <Link
                            to="/dashboard?tab=favorites"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Heart className="h-4 w-4" />
                            <span>My Favorites</span>
                          </Link>

                          <Link
                            to="/dashboard?tab=profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <User className="h-4 w-4" />
                            <span>Profile</span>
                          </Link>

                          <Link
                            to="/dashboard?tab=settings"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden border-t border-gray-200 dark:border-gray-800"
              >
                <div className="px-4 py-4 space-y-3">
                  <Link
                    to="/buy"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Buy
                  </Link>
                  <Link
                    to="/rent"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Rent
                  </Link>
                  <Link
                    to="/sell"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sell
                  </Link>
                  <Link
                    to="/locations"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Locations
                  </Link>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                    {!user ? (
                      <Button
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setIsOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold"
                      >
                        Login / Sign up
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Login/Signup Modal */}
      <LoginSignupModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};
