import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext.v2";

export type ActivityType =
  | "property_view"
  | "property_saved"
  | "property_unsaved"
  | "review_submitted"
  | "review_updated"
  | "inquiry_submitted"
  | "inquiry_updated";

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  reference_id: string;
  reference_type: "property" | "review" | "inquiry";
  metadata: {
    property_title?: string;
    property_image?: string;
    property_price?: string;
    review_rating?: number;
    inquiry_message?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  // Joined data
  property?: {
    id: string;
    title: string;
    featured_image?: string;
    price?: number;
    location?: string;
  };
  inquiry?: {
    id: string;
    message: string;
    status: string;
  };
}

export const useUserActivity = (limit: number = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-activity", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // @ts-ignore - user_activity table will be created via migration
      const { data, error } = await supabase
        // @ts-ignore
        .from("user_activity")
        .select(
          `
          *,
          property:properties(id, title, featured_image, price, location),
          inquiry:inquiries(id, message, status)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching user activity:", error);
        throw error;
      }

      return (data as any[]) as UserActivity[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

export const useActivityStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-activity-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // @ts-ignore - user_activity table will be created via migration
      const { data, error } = await supabase
        // @ts-ignore
        .from("user_activity")
        .select("activity_type")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching activity stats:", error);
        throw error;
      }

      // Count by activity type
      const stats = {
        total: data.length,
        property_views: 0,
        properties_saved: 0,
        reviews_submitted: 0,
        inquiries_submitted: 0,
      };

      data.forEach((activity: any) => {
        if (activity.activity_type === "property_view") {
          stats.property_views++;
        } else if (activity.activity_type === "property_saved") {
          stats.properties_saved++;
        } else if (activity.activity_type === "review_submitted") {
          stats.reviews_submitted++;
        } else if (activity.activity_type === "inquiry_submitted") {
          stats.inquiries_submitted++;
        }
      });

      return stats;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
