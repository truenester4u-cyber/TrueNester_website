/**
 * Hooks for managing customer reviews
 * Provides functions to create reviews and fetch review history
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext.v2";
import { useToast } from "@/hooks/use-toast";
import { logReviewSubmitted } from "@/lib/activityLogger";

export interface CustomerReview {
  id: string;
  user_id: string | null;
  property_code: string | null; // Changed from property_id to property_code
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  title: string | null;
  comment: string;
  verified: boolean;
  helpful_votes: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    property_code: string;
    title: string;
    featured_image: string;
    location: string;
  };
}

export interface CreateReviewData {
  property_code?: string; // Changed from property_id to property_code
  reviewer_name: string;
  reviewer_email?: string;
  rating: number;
  title?: string;
  comment: string;
}

// Fetch reviews for current user
export const useCustomerReviews = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // @ts-ignore - reviews table will be created via migration
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          user_id,
          property_code,
          reviewer_name,
          reviewer_email,
          rating,
          title,
          comment,
          verified,
          helpful_votes,
          status,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CustomerReview[];
    },
    enabled: !!user,
  });
};

// Create a new review
export const useCreateReview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      if (!user) throw new Error("User not authenticated");

      // @ts-ignore - reviews table will be created via migration
      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            user_id: user.id,
            property_code: reviewData.property_code || null, // Changed from property_id to property_code
            reviewer_name: reviewData.reviewer_name,
            reviewer_email: reviewData.reviewer_email || null,
            rating: reviewData.rating,
            title: reviewData.title || null,
            comment: reviewData.comment,
            status: "pending", // Reviews require approval
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      if (data) {
        await logReviewSubmitted(data.id, reviewData.property_code, undefined, reviewData.rating);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
      toast({
        title: "Review submitted!",
        description: "Your review is pending approval and will be published soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get review stats for the user
export const useReviewStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["review-stats", user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, pending: 0, approved: 0, rejected: 0 };

      // @ts-ignore - reviews table will be created via migration
      const { data, error } = await supabase
        .from("reviews")
        .select("status")
        .eq("user_id", user.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter((r: any) => r.status === "pending").length,
        approved: data.filter((r: any) => r.status === "approved").length,
        rejected: data.filter((r: any) => r.status === "rejected").length,
      };

      return stats;
    },
    enabled: !!user,
  });
};

// Fetch approved reviews for a specific property (public)
export const usePropertyReviews = (propertyCode: string) => {
  return useQuery({
    queryKey: ["property-reviews", propertyCode],
    queryFn: async () => {
      if (!propertyCode) return [];

      // @ts-ignore - reviews table will be created via migration
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          reviewer_name,
          rating,
          title,
          comment,
          verified,
          helpful_votes,
          created_at
        `)
        .eq("property_code", propertyCode)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CustomerReview[];
    },
    enabled: !!propertyCode,
  });
};