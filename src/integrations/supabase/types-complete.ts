export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          title: string
          slug: string
          description: string
          price: number | null
          property_type: string
          purpose: string
          location: string
          city: string
          area: string | null
          bedrooms: string | null  // Changed to TEXT in migration
          bathrooms: string | null  // Changed to TEXT in migration
          size_sqft: string | null  // Changed to TEXT in migration
          size_sqm: string | null  // Changed to TEXT in migration
          features: Json  // JSONB array
          amenities: Json  // JSONB array
          images: Json  // JSONB array
          featured_image: string | null
          developer: string | null
          completion_status: string | null
          completion_date: string | null
          furnished: string | null
          parking_spaces: number | null
          floor_number: number | null
          total_floors: number | null
          meta_title: string | null
          meta_description: string | null
          featured: boolean
          published: boolean
          views: number
          created_at: string
          updated_at: string
          agent_name: string | null
          agent_phone: string | null
          agent_email: string | null
          // New fields added by migrations
          payment_plan: string | null
          handover_date: string | null
          floor_plans: Json  // JSONB array
          payment_plan_table: Json  // JSONB array
          total_units: string | null
          property_code: string | null  // Added by dashboard migration
          view_count: number
          last_viewed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description: string
          price?: number | null
          property_type: string
          purpose: string
          location: string
          city: string
          area?: string | null
          bedrooms?: string | null
          bathrooms?: string | null
          size_sqft?: string | null
          size_sqm?: string | null
          features?: Json
          amenities?: Json
          images?: Json
          featured_image?: string | null
          developer?: string | null
          completion_status?: string | null
          completion_date?: string | null
          furnished?: string | null
          parking_spaces?: number | null
          floor_number?: number | null
          total_floors?: number | null
          meta_title?: string | null
          meta_description?: string | null
          featured?: boolean
          published?: boolean
          views?: number
          created_at?: string
          updated_at?: string
          agent_name?: string | null
          agent_phone?: string | null
          agent_email?: string | null
          payment_plan?: string | null
          handover_date?: string | null
          floor_plans?: Json
          payment_plan_table?: Json
          total_units?: string | null
          property_code?: string | null
          view_count?: number
          last_viewed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string
          price?: number | null
          property_type?: string
          purpose?: string
          location?: string
          city?: string
          area?: string | null
          bedrooms?: string | null
          bathrooms?: string | null
          size_sqft?: string | null
          size_sqm?: string | null
          features?: Json
          amenities?: Json
          images?: Json
          featured_image?: string | null
          developer?: string | null
          completion_status?: string | null
          completion_date?: string | null
          furnished?: string | null
          parking_spaces?: number | null
          floor_number?: number | null
          total_floors?: number | null
          meta_title?: string | null
          meta_description?: string | null
          featured?: boolean
          published?: boolean
          views?: number
          created_at?: string
          updated_at?: string
          agent_name?: string | null
          agent_phone?: string | null
          agent_email?: string | null
          payment_plan?: string | null
          handover_date?: string | null
          floor_plans?: Json
          payment_plan_table?: Json
          total_units?: string | null
          property_code?: string | null
          view_count?: number
          last_viewed_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string
          full_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          full_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_properties: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_inquiries: {
        Row: {
          id: string
          user_id: string
          property_code: string | null  // Changed from property_id to property_code
          inquiry_type: string
          message: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          status: string
          agent_notes: string | null
          created_at: string
          updated_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          property_code?: string | null
          inquiry_type?: string
          message: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          status?: string
          agent_notes?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          property_code?: string | null
          inquiry_type?: string
          message?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          status?: string
          agent_notes?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          property_code: string | null  // Changed from property_id to property_code
          user_id: string | null
          reviewer_name: string
          reviewer_email: string | null
          rating: number
          title: string | null
          comment: string
          verified: boolean
          helpful_votes: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_code?: string | null
          user_id?: string | null
          reviewer_name: string
          reviewer_email?: string | null
          rating: number
          title?: string | null
          comment: string
          verified?: boolean
          helpful_votes?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_code?: string | null
          user_id?: string | null
          reviewer_name?: string
          reviewer_email?: string | null
          rating?: number
          title?: string | null
          comment?: string
          verified?: boolean
          helpful_votes?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          activity_data: Json | null
          created_at: string
          user_agent: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          activity_data?: Json | null
          created_at?: string
          user_agent?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          activity_data?: Json | null
          created_at?: string
          user_agent?: string | null
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {}
    Functions: {
      generate_property_code: {
        Args: {
          purpose_type: string
        }
        Returns: string
      }
      increment_property_views: {
        Args: {
          property_uuid: string
        }
        Returns: undefined
      }
      get_property_by_code: {
        Args: {
          code: string
        }
        Returns: {
          id: string
          property_code: string
          title: string
          purpose: string
          price: number
          location: string
        }[]
      }
    }
    Enums: {
      activity_type: 
        | "property_view"
        | "property_save"
        | "property_unsave"
        | "inquiry_submit"
        | "review_submit"
        | "search_perform"
        | "profile_update"
        | "login"
        | "logout"
    }
    CompositeTypes: {}
  }
}

// Helper types for specific structures
export interface PropertyFeature {
  name: string
  icon?: string
}

export interface PropertyImage {
  url: string
  alt?: string
  caption?: string
}

export interface FloorPlan {
  title: string
  size: string
  image: string
}

export interface PaymentPlanRow {
  header?: string
  milestone: string
  percentage: string
  note?: string
}

// Activity data structures
export interface PropertyViewActivity {
  property_id: string
  property_title: string
  property_code?: string
  source?: string
}

export interface PropertySaveActivity {
  property_id: string
  property_title: string
  property_code?: string
  action: 'save' | 'unsave'
}

export interface InquirySubmitActivity {
  inquiry_id: string
  property_code?: string
  property_title?: string
  inquiry_type: string
}

export interface ReviewSubmitActivity {
  review_id: string
  property_code?: string
  property_title?: string
  rating: number
}

export interface SearchActivity {
  query?: string
  filters: Record<string, any>
  results_count: number
}

// Union type for all activity data
export type ActivityData = 
  | PropertyViewActivity
  | PropertySaveActivity
  | InquirySubmitActivity
  | ReviewSubmitActivity
  | SearchActivity
  | Record<string, any>

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (
      Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"]
    )[TableName] extends { Row: infer R }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never