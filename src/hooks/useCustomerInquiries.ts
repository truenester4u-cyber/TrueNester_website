/**
 * Hooks for managing customer inquiries
 * Provides functions to create inquiries and fetch inquiry history
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext.v2";
import { useToast } from "@/hooks/use-toast";

export interface CustomerInquiry {
  id: string;
  user_id: string;
  property_code: string | null; // Changed from property_id to property_code
  inquiry_type: "viewing" | "information" | "purchase" | "rental" | "general";
  message: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: "new" | "contacted" | "in-progress" | "closed";
  agent_notes: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  property?: {
    id: string;
    property_code: string;
    title: string;
    featured_image: string;
    location: string;
  };
}

export interface CreateInquiryData {
  property_code?: string; // Changed from property_id to property_code
  inquiry_type: "viewing" | "information" | "purchase" | "rental" | "general";
  message: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

// Fetch inquiries for current user
export const useCustomerInquiries = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-inquiries", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // @ts-ignore - customer_inquiries table will be created via migration
      const { data, error } = await supabase
        .from("customer_inquiries")
        .select(`
          id,
          user_id,
          property_code,
          inquiry_type,
          message,
          customer_name,
          customer_email,
          customer_phone,
          status,
          agent_notes,
          created_at,
          updated_at,
          responded_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CustomerInquiry[];
    },
    enabled: !!user,
  });
};

// Create a new inquiry
export const useCreateInquiry = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inquiryData: CreateInquiryData) => {
      if (!user) throw new Error("User not authenticated");

      // @ts-ignore - customer_inquiries table will be created via migration
      const { data, error } = await supabase
        .from("customer_inquiries")
        .insert([
          {
            user_id: user.id,
            property_code: inquiryData.property_code || null, // Changed from property_id to property_code
            inquiry_type: inquiryData.inquiry_type,
            message: inquiryData.message,
            customer_name: inquiryData.customer_name,
            customer_email: inquiryData.customer_email,
            customer_phone: inquiryData.customer_phone || null,
            status: "new",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-inquiries"] });
      toast({
        title: "Inquiry submitted!",
        description: "We'll get back to you as soon as possible.",
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

// Get inquiry count by status
export const useInquiryStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["inquiry-stats", user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, active: 0, closed: 0 };

      // @ts-ignore - customer_inquiries table will be created via migration
      const { data, error } = await supabase
        .from("customer_inquiries")
        .select("status")
        .eq("user_id", user.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter((i: any) => i.status !== "closed").length,
        closed: data.filter((i: any) => i.status === "closed").length,
      };

      return stats;
    },
    enabled: !!user,
  });
};
