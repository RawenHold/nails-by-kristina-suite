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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          id: string
          price: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          id?: string
          price?: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          id?: string
          price?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string | null
          created_at: string
          end_time: string
          expected_price: number
          final_price: number | null
          id: string
          notes: string | null
          owner_id: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          end_time: string
          expected_price?: number
          final_price?: number | null
          id?: string
          notes?: string | null
          owner_id: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          end_time?: string
          expected_price?: number
          final_price?: number | null
          id?: string
          notes?: string | null
          owner_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tags: {
        Row: {
          client_id: string
          id: string
          tag_id: string
        }
        Insert: {
          client_id: string
          id?: string
          tag_id: string
        }
        Update: {
          client_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          allergies: string | null
          avatar_url: string | null
          average_check: number
          created_at: string
          days_since_last_visit: number | null
          favorite_colors: string[] | null
          favorite_designs: string[] | null
          favorite_length: string | null
          favorite_shape: string | null
          full_name: string
          id: string
          is_archived: boolean
          last_visit_date: string | null
          lifecycle_status: Database["public"]["Enums"]["client_lifecycle_status"]
          loyalty_level: Database["public"]["Enums"]["loyalty_level"]
          manual_reminder_date: string | null
          notes: string | null
          owner_id: string
          phone: string | null
          recommended_next_visit: string | null
          telegram_link: string | null
          telegram_username: string | null
          total_spent: number
          total_visits: number
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          avatar_url?: string | null
          average_check?: number
          created_at?: string
          days_since_last_visit?: number | null
          favorite_colors?: string[] | null
          favorite_designs?: string[] | null
          favorite_length?: string | null
          favorite_shape?: string | null
          full_name: string
          id?: string
          is_archived?: boolean
          last_visit_date?: string | null
          lifecycle_status?: Database["public"]["Enums"]["client_lifecycle_status"]
          loyalty_level?: Database["public"]["Enums"]["loyalty_level"]
          manual_reminder_date?: string | null
          notes?: string | null
          owner_id: string
          phone?: string | null
          recommended_next_visit?: string | null
          telegram_link?: string | null
          telegram_username?: string | null
          total_spent?: number
          total_visits?: number
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          avatar_url?: string | null
          average_check?: number
          created_at?: string
          days_since_last_visit?: number | null
          favorite_colors?: string[] | null
          favorite_designs?: string[] | null
          favorite_length?: string | null
          favorite_shape?: string | null
          full_name?: string
          id?: string
          is_archived?: boolean
          last_visit_date?: string | null
          lifecycle_status?: Database["public"]["Enums"]["client_lifecycle_status"]
          loyalty_level?: Database["public"]["Enums"]["loyalty_level"]
          manual_reminder_date?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
          recommended_next_visit?: string | null
          telegram_link?: string | null
          telegram_username?: string | null
          total_spent?: number
          total_visits?: number
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          id: string
          note: string | null
          owner_id: string
          spent_at: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          owner_id: string
          spent_at?: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          owner_id?: string
          spent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          appointment_id: string | null
          client_id: string | null
          created_at: string
          id: string
          note: string | null
          owner_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          received_at: string
          visit_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          owner_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          received_at?: string
          visit_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          owner_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          received_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incomes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          reminder_date: string
          status: Database["public"]["Enums"]["reminder_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          reminder_date: string
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          reminder_date?: string
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          default_price: number
          display_order: number
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_price?: number
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_price?: number
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          tag_type: Database["public"]["Enums"]["tag_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          tag_type?: Database["public"]["Enums"]["tag_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          tag_type?: Database["public"]["Enums"]["tag_type"]
        }
        Relationships: []
      }
      timer_sessions: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          created_at: string
          duration_seconds: number
          ended_at: string | null
          id: string
          note: string | null
          owner_id: string
          started_at: string
          status: Database["public"]["Enums"]["timer_status"]
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          note?: string | null
          owner_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["timer_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          note?: string | null
          owner_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["timer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timer_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timer_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_cover: boolean
          is_favorite: boolean
          owner_id: string
          storage_path: string
          visit_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          is_favorite?: boolean
          owner_id: string
          storage_path: string
          visit_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          is_favorite?: boolean
          owner_id?: string
          storage_path?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_tags: {
        Row: {
          id: string
          tag_id: string
          visit_id: string
        }
        Insert: {
          id?: string
          tag_id: string
          visit_id: string
        }
        Update: {
          id?: string
          tag_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_tags_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          appointment_id: string | null
          client_id: string
          colors_used: string[] | null
          created_at: string
          design_notes: string | null
          id: string
          nail_length: string | null
          nail_shape: string | null
          owner_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_received: boolean
          private_notes: string | null
          services_performed: string[] | null
          total_price: number
          updated_at: string
          visit_date: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          colors_used?: string[] | null
          created_at?: string
          design_notes?: string | null
          id?: string
          nail_length?: string | null
          nail_shape?: string | null
          owner_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_received?: boolean
          private_notes?: string | null
          services_performed?: string[] | null
          total_price?: number
          updated_at?: string
          visit_date?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          colors_used?: string[] | null
          created_at?: string
          design_notes?: string | null
          id?: string
          nail_length?: string | null
          nail_shape?: string | null
          owner_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_received?: boolean
          private_notes?: string | null
          services_performed?: string[] | null
          total_price?: number
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      appointment_status:
        | "planned"
        | "confirmed"
        | "completed"
        | "canceled"
        | "no_show"
      client_lifecycle_status: "new" | "active" | "inactive" | "lost" | "vip"
      loyalty_level: "bronze" | "silver" | "gold" | "vip"
      payment_method: "cash" | "card" | "transfer" | "other"
      reminder_status: "upcoming" | "today" | "overdue" | "sent"
      tag_type:
        | "color"
        | "style"
        | "shape"
        | "length"
        | "preference"
        | "design"
        | "other"
      timer_status: "running" | "paused" | "completed"
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
      appointment_status: [
        "planned",
        "confirmed",
        "completed",
        "canceled",
        "no_show",
      ],
      client_lifecycle_status: ["new", "active", "inactive", "lost", "vip"],
      loyalty_level: ["bronze", "silver", "gold", "vip"],
      payment_method: ["cash", "card", "transfer", "other"],
      reminder_status: ["upcoming", "today", "overdue", "sent"],
      tag_type: [
        "color",
        "style",
        "shape",
        "length",
        "preference",
        "design",
        "other",
      ],
      timer_status: ["running", "paused", "completed"],
    },
  },
} as const
