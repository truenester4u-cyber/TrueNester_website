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
          description: string
          property_type: string
          purpose: string
          price: number
          location: string
          city: string | null
          bedrooms: number | null
          bathrooms: number | null
          size: number | null
          images: string[]
          featured_image: string | null
          amenities: string[]
          features: string[]
          developer: string | null
          completion_date: string | null
          payment_plan: Json | null
          floor_plans: string[] | null
          virtual_tour_url: string | null
          video_url: string | null
          published: boolean
          featured: boolean
          views: number
          created_at: string
          updated_at: string
          price_display: string | null
          payment_terms: string | null
          handover_date: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string
          property_type: string
          purpose?: string
          price: number
          location: string
          city?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          size?: number | null
          images?: string[]
          featured_image?: string | null
          amenities?: string[]
          features?: string[]
          developer?: string | null
          completion_date?: string | null
          payment_plan?: Json | null
          floor_plans?: string[] | null
          virtual_tour_url?: string | null
          video_url?: string | null
          published?: boolean
          featured?: boolean
          views?: number
          created_at?: string
          updated_at?: string
          price_display?: string | null
          payment_terms?: string | null
          handover_date?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          property_type?: string
          purpose?: string
          price?: number
          location?: string
          city?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          size?: number | null
          images?: string[]
          featured_image?: string | null
          amenities?: string[]
          features?: string[]
          developer?: string | null
          completion_date?: string | null
          payment_plan?: Json | null
          floor_plans?: string[] | null
          virtual_tour_url?: string | null
          video_url?: string | null
          published?: boolean
          featured?: boolean
          views?: number
          created_at?: string
          updated_at?: string
          price_display?: string | null
          payment_terms?: string | null
          handover_date?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string
          slug: string
          city: string | null
          description: string | null
          image: string | null
          property_count: number
          featured: boolean
          created_at: string
          updated_at: string
          featured_city: boolean | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          city?: string | null
          description?: string | null
          image?: string | null
          property_count?: number
          featured?: boolean
          created_at?: string
          updated_at?: string
          featured_city?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          city?: string | null
          description?: string | null
          image?: string | null
          property_count?: number
          featured?: boolean
          created_at?: string
          updated_at?: string
          featured_city?: boolean | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          customer_id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number
          status: string
          lead_score: number
          lead_quality: string | null
          intent: string | null
          budget: string | null
          preferred_area: string | null
          tags: string[]
          notes: string | null
          follow_up_date: string | null
          assigned_agent_id: string | null
          created_at: string
          updated_at: string
          lead_score_breakdown: Json | null
        }
        Insert: {
          id?: string
          customer_id: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number
          status?: string
          lead_score?: number
          lead_quality?: string | null
          intent?: string | null
          budget?: string | null
          preferred_area?: string | null
          tags?: string[]
          notes?: string | null
          follow_up_date?: string | null
          assigned_agent_id?: string | null
          created_at?: string
          updated_at?: string
          lead_score_breakdown?: Json | null
        }
        Update: {
          id?: string
          customer_id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number
          status?: string
          lead_score?: number
          lead_quality?: string | null
          intent?: string | null
          budget?: string | null
          preferred_area?: string | null
          tags?: string[]
          notes?: string | null
          follow_up_date?: string | null
          assigned_agent_id?: string | null
          created_at?: string
          updated_at?: string
          lead_score_breakdown?: Json | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender: string
          message_text: string
          message_type: string
          timestamp: string
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender: string
          message_text: string
          message_type?: string
          timestamp?: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender?: string
          message_text?: string
          message_type?: string
          timestamp?: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_inquiries: {
        Row: {
          id: string
          user_id: string
          property_id: string | null
          inquiry_type: string
          message: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id?: string | null
          inquiry_type: string
          message: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string | null
          inquiry_type?: string
          message?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          user_id: string | null
          property_id: string | null
          rating: number
          comment: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          property_id?: string | null
          rating: number
          comment?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          property_id?: string | null
          rating?: number
          comment?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      site_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          role: string
          status: string
          requires_mfa: boolean
          mfa_enabled: boolean
          mfa_verified_at: string | null
          password_changed_at: string
          password_expires_at: string
          last_login_at: string | null
          last_login_ip: string | null
          failed_login_attempts: number
          locked_until: string | null
          invited_by_admin_id: string | null
          invitation_token: string | null
          invitation_accepted_at: string | null
          invitation_expires_at: string | null
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          role?: string
          status?: string
          requires_mfa?: boolean
          mfa_enabled?: boolean
          mfa_verified_at?: string | null
          password_changed_at?: string
          password_expires_at?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          failed_login_attempts?: number
          locked_until?: string | null
          invited_by_admin_id?: string | null
          invitation_token?: string | null
          invitation_accepted_at?: string | null
          invitation_expires_at?: string | null
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          role?: string
          status?: string
          requires_mfa?: boolean
          mfa_enabled?: boolean
          mfa_verified_at?: string | null
          password_changed_at?: string
          password_expires_at?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          failed_login_attempts?: number
          locked_until?: string | null
          invited_by_admin_id?: string | null
          invitation_token?: string | null
          invitation_accepted_at?: string | null
          invitation_expires_at?: string | null
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_invited_by_admin_id_fkey"
            columns: ["invited_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_login_attempts: {
        Row: {
          id: string
          admin_user_id: string | null
          email: string
          ip_address: string
          user_agent: string | null
          success: boolean
          failure_reason: string | null
          attempted_at: string
        }
        Insert: {
          id?: string
          admin_user_id?: string | null
          email: string
          ip_address: string
          user_agent?: string | null
          success?: boolean
          failure_reason?: string | null
          attempted_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string | null
          email?: string
          ip_address?: string
          user_agent?: string | null
          success?: boolean
          failure_reason?: string | null
          attempted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_login_attempts_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_user_id: string
          action: string
          resource_type: string | null
          resource_id: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action: string
          resource_type?: string | null
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_invitations: {
        Row: {
          id: string
          email: string
          role: string
          invited_by_admin_id: string
          token: string
          status: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: string
          invited_by_admin_id: string
          token: string
          status?: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          invited_by_admin_id?: string
          token?: string
          status?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invitations_invited_by_admin_id_fkey"
            columns: ["invited_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      ip_whitelist: {
        Row: {
          id: string
          ip_address: string
          description: string | null
          is_active: boolean
          created_by_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ip_address: string
          description?: string | null
          is_active?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ip_address?: string
          description?: string | null
          is_active?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_whitelist_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_sessions: {
        Row: {
          id: string
          admin_user_id: string
          session_token: string
          ip_address: string
          user_agent: string | null
          is_active: boolean
          expires_at: string
          last_activity_at: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          session_token: string
          ip_address: string
          user_agent?: string | null
          is_active?: boolean
          expires_at: string
          last_activity_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          session_token?: string
          ip_address?: string
          user_agent?: string | null
          is_active?: boolean
          expires_at?: string
          last_activity_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      security_alerts: {
        Row: {
          id: string
          alert_type: string
          severity: string
          title: string
          description: string
          related_admin_user_id: string | null
          ip_address: string | null
          metadata: Json | null
          acknowledged: boolean
          acknowledged_by_admin_id: string | null
          acknowledged_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          alert_type: string
          severity?: string
          title: string
          description: string
          related_admin_user_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          acknowledged?: boolean
          acknowledged_by_admin_id?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          alert_type?: string
          severity?: string
          title?: string
          description?: string
          related_admin_user_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          acknowledged?: boolean
          acknowledged_by_admin_id?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_acknowledged_by_admin_id_fkey"
            columns: ["acknowledged_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_related_admin_user_id_fkey"
            columns: ["related_admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_mfa: {
        Row: {
          id: string
          admin_user_id: string
          secret: string
          backup_codes: string[]
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          secret: string
          backup_codes?: string[]
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          secret?: string
          backup_codes?: string[]
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_mfa_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: true
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
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
