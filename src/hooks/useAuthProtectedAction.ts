/**
 * Hook for auth-protected user actions
 * Checks if user is logged in and shows toast if they need to login
 * 
 * DEPRECATED: Use direct inline auth checks in components instead
 * This hook exists for reference but the recommended pattern is:
 * 
 * if (!isAuthenticated) {
 *   toast({
 *     title: "Login Required",
 *     description: "Message",
 *     action: <ToastAction altText="Login" onClick={() => navigate("/login")}>Login</ToastAction>,
 *   });
 *   return;
 * }
 */

import { useAuth } from "@/contexts/AuthContext.v2";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthProtectedActionOptions {
  action: () => Promise<void> | void;
  loginMessage?: string;
  onError?: (error: any) => void;
}

export const useAuthProtectedAction = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const executeIfAuthenticated = async (options: AuthProtectedActionOptions) => {
    const { action, onError } = options;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await Promise.resolve(action());
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  return { executeIfAuthenticated, isAuthenticated };
};
