import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to read the `show_rentals` setting from site_settings.
 * Defaults to `true` if no row or column exists yet.
 */
export const useShowRentals = () => {
  return useQuery<boolean>({
    queryKey: ["site-settings", "show_rentals"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("show_rentals")
        .limit(1)
        .single();

      if (error) {
        console.warn("⚠️ Could not fetch show_rentals setting:", error.message);
        return true; // Default to showing rentals
      }

      // If the column doesn't exist yet, default to true
      return data?.show_rentals ?? true;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to toggle the `show_rentals` setting from the admin panel.
 * Optimistically updates the cache and persists to Supabase.
 */
export const useToggleShowRentals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newValue: boolean) => {
      // Get the existing settings row
      const { data: existing, error: fetchError } = await (supabase as any)
        .from("site_settings")
        .select("id")
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existing) {
        const { error } = await (supabase as any)
          .from("site_settings")
          .update({ show_rentals: newValue, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert a new row if none exists
        const { error } = await (supabase as any)
          .from("site_settings")
          .insert([{ show_rentals: newValue }]);

        if (error) throw error;
      }

      return newValue;
    },
    onMutate: async (newValue) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["site-settings", "show_rentals"] });
      const previousValue = queryClient.getQueryData<boolean>(["site-settings", "show_rentals"]);
      queryClient.setQueryData(["site-settings", "show_rentals"], newValue);
      return { previousValue };
    },
    onError: (_err, _newValue, context) => {
      // Rollback on error
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData(["site-settings", "show_rentals"], context.previousValue);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings", "show_rentals"] });
    },
  });
};
