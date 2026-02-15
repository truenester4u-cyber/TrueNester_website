import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to read the `show_projects` setting from site_settings.
 * Defaults to `true` if no row or column exists yet.
 */
export const useShowProjects = () => {
  return useQuery<boolean>({
    queryKey: ["site-settings", "show_projects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("show_projects")
        .limit(1)
        .single();

      if (error) {
        console.warn("⚠️ Could not fetch show_projects setting:", error.message);
        return true; // Default to showing projects
      }

      // If the column doesn't exist yet, default to true
      return data?.show_projects ?? true;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to toggle the `show_projects` setting from the admin panel.
 * Optimistically updates the cache and persists to Supabase.
 */
export const useToggleShowProjects = () => {
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
          .update({ show_projects: newValue, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert a new row if none exists
        const { error } = await (supabase as any)
          .from("site_settings")
          .insert([{ show_projects: newValue }]);

        if (error) throw error;
      }

      return newValue;
    },
    onMutate: async (newValue) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["site-settings", "show_projects"] });
      const previousValue = queryClient.getQueryData<boolean>(["site-settings", "show_projects"]);
      queryClient.setQueryData(["site-settings", "show_projects"], newValue);
      return { previousValue };
    },
    onError: (_err, _newValue, context) => {
      // Rollback on error
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData(["site-settings", "show_projects"], context.previousValue);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings", "show_projects"] });
    },
  });
};
