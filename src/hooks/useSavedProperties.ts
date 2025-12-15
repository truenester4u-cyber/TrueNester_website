/**
 * Hooks for managing customer saved properties
 * Provides functions to save/unsave properties and fetch saved list
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext.v2";
import { useToast } from "@/hooks/use-toast";
import { logPropertySaved, logPropertyUnsaved } from "@/lib/activityLogger";

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  notes: string | null;
  created_at: string;
  property: {
    id: string;
    title: string;
    price: number;
    location: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    featured_image: string;
  };
}

// Fetch saved properties for current user
export const useSavedProperties = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-properties", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // @ts-ignore - saved_properties table will be created via migration
      const { data, error } = await supabase
        .from("saved_properties")
        .select(`
          id,
          user_id,
          property_id,
          notes,
          created_at,
          property:properties (
            id,
            title,
            price,
            location,
            property_type,
            bedrooms,
            bathrooms,
            area,
            featured_image
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as SavedProperty[];
    },
    enabled: !!user,
  });
};

// Check if a property is saved
export const useIsPropertySaved = (propertyId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-property-saved", propertyId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      // @ts-ignore - saved_properties table will be created via migration
      const { data, error } = await supabase
        .from("saved_properties")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", propertyId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!propertyId,
  });
};

// Save a property
export const useSaveProperty = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, propertyTitle, propertyImage, propertyPrice }: { 
      propertyId: string; 
      propertyTitle?: string; 
      propertyImage?: string; 
      propertyPrice?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // @ts-ignore - saved_properties table will be created via migration
      const { data, error } = await supabase
        .from("saved_properties")
        .insert([
          {
            user_id: user.id,
            property_id: propertyId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Log activity
      try {
        await logPropertySaved(user.id, propertyId, propertyTitle, propertyImage, propertyPrice);
      } catch (logError) {
        console.error("Failed to log property saved activity:", logError);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-properties"] });
      queryClient.invalidateQueries({ queryKey: ["is-property-saved"] });
      queryClient.invalidateQueries({ queryKey: ["user-activity"] });
      toast({
        title: "Property saved!",
        description: "Added to your saved properties.",
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

// Unsave a property
export const useUnsaveProperty = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, propertyTitle }: { propertyId: string; propertyTitle?: string }) => {
      if (!user) throw new Error("User not authenticated");

      // @ts-ignore - saved_properties table will be created via migration
      const { error } = await supabase
        .from("saved_properties")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", propertyId);

      if (error) throw error;
      
      // Log activity
      try {
        await logPropertyUnsaved(user.id, propertyId, propertyTitle);
      } catch (logError) {
        console.error("Failed to log property unsaved activity:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-properties"] });
      queryClient.invalidateQueries({ queryKey: ["is-property-saved"] });
      queryClient.invalidateQueries({ queryKey: ["user-activity"] });
      toast({
        title: "Property removed",
        description: "Removed from your saved properties.",
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

// Toggle save/unsave property
export const useToggleSaveProperty = () => {
  const saveProperty = useSaveProperty();
  const unsaveProperty = useUnsaveProperty();

  return {
    toggleSave: async (
      propertyId: string, 
      isSaved: boolean, 
      metadata?: { title?: string; image?: string; price?: string }
    ) => {
      if (isSaved) {
        await unsaveProperty.mutateAsync({ 
          propertyId, 
          propertyTitle: metadata?.title 
        });
      } else {
        await saveProperty.mutateAsync({ 
          propertyId, 
          propertyTitle: metadata?.title,
          propertyImage: metadata?.image,
          propertyPrice: metadata?.price
        });
      }
    },
    isLoading: saveProperty.isPending || unsaveProperty.isPending,
  };
};
