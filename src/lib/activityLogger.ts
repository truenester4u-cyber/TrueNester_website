import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

/**
 * Log user activity to the database
 * @param activityType - Type of activity
 * @returns Promise with the created activity record
 */
export const logActivity = async (activityType: ActivityType) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("Cannot log activity: User not authenticated");
      return null;
    }

    // @ts-ignore - user_activity table will be created via migration
    const { data, error } = await supabase
      .from("user_activity")
      .insert([
        {
          user_id: user.id,
          activity_type: activityType,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error);
      return null; // Don't throw errors for activity logging
    }

    return data;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null; // Don't throw errors for activity logging
  }
};

/**
 * Log property view activity
 */
export const logPropertyView = async (
  propertyId: string,
  propertyTitle?: string,
  propertyCode?: string
) => {
  return logActivity("property_view");
};

/**
 * Log property saved (favorited) activity
 */
export const logPropertySaved = async (
  propertyId: string,
  propertyTitle?: string,
  propertyCode?: string
) => {
  return logActivity("property_save");
};

/**
 * Log property unsaved (unfavorited) activity
 */
export const logPropertyUnsaved = async (
  propertyId: string,
  propertyTitle?: string,
  propertyCode?: string
) => {
  return logActivity("property_unsave");
};

/**
 * Log review submission activity
 */
export const logReviewSubmitted = async (
  reviewId: string,
  propertyCode?: string,
  propertyTitle?: string,
  rating?: number
) => {
  return logActivity("review_submit");
};

/**
 * Log inquiry submission activity
 */
export const logInquirySubmitted = async (
  inquiryId: string,
  propertyCode?: string,
  propertyTitle?: string,
  inquiryType?: string
) => {
  return logActivity("inquiry_submit");
};

/**
 * Log search activity
 */
export const logSearch = async (
  query?: string,
  filters?: Record<string, any>,
  resultsCount?: number
) => {
  return logActivity("search_perform");
};

/**
 * Log profile update activity
 */
export const logProfileUpdate = async () => {
  return logActivity("profile_update");
};

/**
 * Log login activity
 */
export const logLogin = async () => {
  return logActivity("login");
};

/**
 * Log logout activity
 */
export const logLogout = async () => {
  return logActivity("logout");
};
