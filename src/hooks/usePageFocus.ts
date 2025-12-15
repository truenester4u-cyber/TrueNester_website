/**
 * Hook to refetch queries when page comes back into focus
 * This ensures data is always fresh when users switch back to the tab
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const usePageFocus = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFocus = () => {
      console.log("👁️ Page focused - invalidating stale queries");
      // Invalidate all stale queries to force a refresh
      queryClient.refetchQueries({ 
        stale: true,
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👁️ Page became visible - refetching data");
        queryClient.refetchQueries({ 
          stale: true,
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);
};
