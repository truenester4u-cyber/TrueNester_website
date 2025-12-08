export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          max_capacity: number | null
          name: string
          phone: string | null
          photo_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          max_capacity?: number | null
          name: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          max_capacity?: number | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          featured_image: string | null
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          category: string
          content: string
          created_at?: string
          excerpt: string
          id?: string
          featured_image?: string | null
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          featured_image?: string | null
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_text: string
          message_type: string | null
          metadata: Json | null
          sender: string
          timestamp: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text: string
          message_type?: string | null
          metadata?: Json | null
          sender: string
          timestamp: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text?: string
          message_type?: string | null
          metadata?: Json | null
          sender?: string
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_summaries: {
        Row: {
          actions_taken: string[] | null
          budget: string | null
          conversation_id: string
          created_at: string
          customer_intent: string | null
          duration_minutes: number | null
          generated_at: string
          id: string
          lead_score_breakdown: Json | null
          missing_steps: string[] | null
          preferred_area: string | null
          property_type: string | null
          suggested_follow_up: string | null
          summary_text: string | null
          total_messages: number | null
          updated_at: string
        }
        Insert: {
          actions_taken?: string[] | null
          budget?: string | null
          conversation_id: string
          created_at?: string
          customer_intent?: string | null
          duration_minutes?: number | null
          generated_at?: string
          id?: string
          lead_score_breakdown?: Json | null
          missing_steps?: string[] | null
          preferred_area?: string | null
          property_type?: string | null
          suggested_follow_up?: string | null
          summary_text?: string | null
          total_messages?: number | null
          updated_at?: string
        }
        Update: {
          actions_taken?: string[] | null
          budget?: string | null
          conversation_id?: string
          created_at?: string
          customer_intent?: string | null
          duration_minutes?: number | null
          generated_at?: string
          id?: string
          lead_score_breakdown?: Json | null
          missing_steps?: string[] | null
          preferred_area?: string | null
          property_type?: string | null
          suggested_follow_up?: string | null
          summary_text?: string | null
          total_messages?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          budget: string | null
          conversation_summary: string | null
          conversion_value: number | null
          created_at: string
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          duration_minutes: number | null
          end_time: string | null
          follow_up_date: string | null
          id: string
          intent: string | null
          lead_quality: string | null
          lead_score: number | null
          lead_score_breakdown: Json | null
          notes: string | null
          outcome: string | null
          preferred_area: string | null
          property_type: string | null
          start_time: string
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          budget?: string | null
          conversation_summary?: string | null
          conversion_value?: number | null
          created_at?: string
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          follow_up_date?: string | null
          id?: string
          intent?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_score_breakdown?: Json | null
          notes?: string | null
          outcome?: string | null
          preferred_area?: string | null
          property_type?: string | null
          start_time: string
          status: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          budget?: string | null
          conversation_summary?: string | null
          conversion_value?: number | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          follow_up_date?: string | null
          id?: string
          intent?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_score_breakdown?: Json | null
          notes?: string | null
          outcome?: string | null
          preferred_area?: string | null
          property_type?: string | null
          start_time?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          name: string
          price_range: string | null
          properties_count: number | null
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          price_range?: string | null
          properties_count?: number | null
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          price_range?: string | null
          properties_count?: number | null
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          amenities: Json
          area: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          completion_date: string | null
          completion_status: string | null
          created_at: string
          description: string
          developer: string | null
          features: Json
          featured: boolean
          featured_abu_dhabi: boolean
          featured_image: string | null
          featured_dubai: boolean
          featured_ras_al_khaimah: boolean
          floor_number: number | null
          furnished: string | null
          id: string
          images: Json
          location: string
          meta_description: string | null
          meta_title: string | null
          parking_spaces: number | null
          price: number | null
          price_display: string | null
          property_type: string
          published: boolean
          purpose: string
          size_sqft: number | null
          size_sqm: number | null
          slug: string
          title: string
          building_description: string | null
          plot_area: string | null
          unit_types: Json
          updated_at: string
          views: number
        }
        Insert: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          amenities?: Json
          area?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          completion_date?: string | null
          completion_status?: string | null
          created_at?: string
          description: string
          developer?: string | null
          features?: Json
          featured?: boolean
          featured_abu_dhabi?: boolean
          featured_image?: string | null
          featured_dubai?: boolean
          featured_ras_al_khaimah?: boolean
          floor_number?: number | null
          furnished?: string | null
          id?: string
          images?: Json
          location: string
          meta_description?: string | null
          meta_title?: string | null
          parking_spaces?: number | null
          price?: number | null
          price_display?: string | null
          property_type: string
          published?: boolean
          purpose: string
          size_sqft?: number | null
          size_sqm?: number | null
          slug: string
          title: string
          building_description?: string | null
          plot_area?: string | null
          unit_types?: Json
          updated_at?: string
          views?: number
        }
        Update: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          amenities?: Json
          area?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          completion_date?: string | null
          completion_status?: string | null
          created_at?: string
          description?: string
          developer?: string | null
          features?: Json
          featured?: boolean
          featured_abu_dhabi?: boolean
          featured_image?: string | null
          featured_dubai?: boolean
          featured_ras_al_khaimah?: boolean
          floor_number?: number | null
          furnished?: string | null
          id?: string
          images?: Json
          location?: string
          meta_description?: string | null
          meta_title?: string | null
          parking_spaces?: number | null
          price?: number | null
          price_display?: string | null
          property_type?: string
          published?: boolean
          purpose?: string
          size_sqft?: number | null
          size_sqm?: number | null
          slug?: string
          title?: string
          building_description?: string | null
          plot_area?: string | null
          unit_types?: Json
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      follow_up_tasks: {
        Row: {
          assigned_agent_id: string | null
          conversation_id: string
          created_at: string
          follow_up_date: string
          id: string
          priority: string
          reminder_text: string | null
          reminder_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          conversation_id: string
          created_at?: string
          follow_up_date: string
          id?: string
          priority: string
          reminder_text?: string | null
          reminder_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          conversation_id?: string
          created_at?: string
          follow_up_date?: string
          id?: string
          priority?: string
          reminder_text?: string | null
          reminder_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_tags: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_auto_generated: boolean | null
          tag_name: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_auto_generated?: boolean | null
          tag_name: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_auto_generated?: boolean | null
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      fetch_conversation_analytics: {
        Args: {
          date_from?: string
          date_to?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
