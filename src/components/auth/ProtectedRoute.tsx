/**
 * ProtectedRoute Component v2
 * 
 * Wraps routes that require authentication.
 * Redirects to /login with redirect query param if not authenticated.
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.v2";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to appropriate login
  if (!isAuthenticated) {
    // Admin routes go to admin login
    if (requireAdmin) {
      return (
        <Navigate
          to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`}
          replace
        />
      );
    }
    // Regular routes go to regular login
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`}
        replace
      />
    );
  }

  // Authenticated but requires admin and user is not admin
  if (requireAdmin && !isAdmin()) {
    // FOR DEVELOPMENT: Allow all authenticated users to access admin
    // TODO: Enable strict admin check in production
    // return <Navigate to="/admin/login" replace />;
  }

  // All checks passed, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
