/**
 * Helper functions for Supabase queries
 * Prioritizes real database data - loads persistently from Supabase
 * 
 * IMPORTANT: If properties don't load for logged-in users, run this SQL in Supabase:
 * 
 * DROP POLICY IF EXISTS "Anyone can view published properties" ON "public"."properties";
 * CREATE POLICY "Anyone can view published properties" 
 * ON "public"."properties" FOR SELECT TO public USING (published = true);
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Query the properties table without type constraints
 */
export const queryProperties = () => {
  return (supabase as any).from("properties");
};

/**
 * Query the conversations table without type constraints
 */
export const queryConversations = () => {
  return (supabase as any).from("conversations");
};

/**
 * Query the chat_messages table without type constraints
 */
export const queryChatMessages = () => {
  return (supabase as any).from("chat_messages");
};

/**
 * Fetch all published properties with featured flags
 * Returns real data from database
 */
export const fetchFeaturedProperties = async (): Promise<any[]> => {
  console.log("🔍 fetchFeaturedProperties: Starting...");
  
  const { data, error } = await queryProperties()
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ fetchFeaturedProperties error:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log("⚠️ fetchFeaturedProperties: No data found");
    return [];
  }

  // Filter for featured properties
  const featuredData = data.filter((p: any) => 
    p.featured_dubai || p.featured_abu_dhabi || p.featured_ras_al_khaimah || p.featured
  );

  if (featuredData.length > 0) {
    console.log("✅ fetchFeaturedProperties success:", { count: featuredData.length });
    return featuredData;
  }

  // Return all properties if no featured ones
  console.log("✅ fetchFeaturedProperties success (no featured, returning all):", { count: data.length });
  return data.slice(0, 12);
};

/**
 * Fetch rental properties from database
 */
export const fetchRentalProperties = async (): Promise<any[]> => {
  console.log("🏠 fetchRentalProperties: Starting...");
  
  const { data, error } = await queryProperties()
    .select("*")
    .eq("published", true)
    .eq("purpose", "rent")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("❌ fetchRentalProperties error:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log("⚠️ fetchRentalProperties: No rental data found");
    return [];
  }

  console.log("✅ fetchRentalProperties success:", { count: data.length });
  return data;
};

/**
 * Fetch buy/sale properties from database
 */
export const fetchBuyProperties = async (search: string = ""): Promise<any[]> => {
  console.log("🏠 fetchBuyProperties: Starting...", { search });
  
  const { data, error } = await queryProperties()
    .select("*")
    .eq("published", true)
    .in("purpose", ["buy", "sale"])
    .order("created_at", { ascending: false })
    .limit(48);

  if (error) {
    console.error("❌ fetchBuyProperties error:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log("⚠️ fetchBuyProperties: No buy data found");
    return [];
  }

  // Apply search filter client-side if needed
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    const filtered = data.filter((p: any) => 
      p.title?.toLowerCase().includes(searchLower) ||
      p.location?.toLowerCase().includes(searchLower)
    );
    console.log("✅ fetchBuyProperties success (filtered):", { count: filtered.length });
    return filtered.length > 0 ? filtered : data;
  }

  console.log("✅ fetchBuyProperties success:", { count: data.length });
  return data;
};

/**
 * Fetch property by ID from database
 */
export const fetchPropertyById = async (id: string): Promise<any | null> => {
  console.log("🔍 fetchPropertyById:", { id });
  
  // Skip if it's a fallback ID (shouldn't happen anymore)
  if (id.startsWith("fallback-")) {
    console.warn("⚠️ fetchPropertyById: Skipping fallback ID");
    return null;
  }
  
  const { data, error } = await queryProperties()
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ fetchPropertyById error:", error);
    return null;
  }

  console.log("✅ fetchPropertyById success");
  return data;
};

/**
 * Fetch properties for hero section location search
 */
export const fetchPropertiesForLocations = async (): Promise<any[]> => {
  console.log("📍 fetchPropertiesForLocations: Starting...");

  try {
    // Simple query - just get location data
    const { data, error } = await queryProperties()
      .select("location, area, city, purpose");

    if (error) {
      console.error("❌ fetchPropertiesForLocations error:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("⚠️ fetchPropertiesForLocations: No data found");
      return [];
    }

    console.log("✅ fetchPropertiesForLocations success:", { count: data.length });
    return data;
  } catch (err) {
    console.error("❌ fetchPropertiesForLocations exception:", err);
    return [];
  }
};

/**
 * Insert a conversation
 */
export const insertConversation = async (conversation: any) => {
  console.log("💬 insertConversation: Starting...");
  
  const { data, error } = await queryConversations()
    .insert([conversation])
    .select();

  if (error) {
    console.error("❌ insertConversation error:", error);
    throw error;
  }

  console.log("✅ insertConversation success");
  return data;
};

/**
 * Insert chat messages
 */
export const insertChatMessages = async (messages: any[]) => {
  console.log("💬 insertChatMessages: Starting...", { count: messages.length });
  
  const { data, error } = await queryChatMessages()
    .insert(messages);

  if (error) {
    console.error("❌ insertChatMessages error:", error);
    throw error;
  }

  console.log("✅ insertChatMessages success");
  return data;
};
