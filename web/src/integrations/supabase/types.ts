/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

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
      app_counters: {
        Row: {
          id: string
          updated_at: string
          value: number
        }
        Insert: {
          id: string
          updated_at?: string
          value?: number
        }
        Update: {
          id?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      certificate_requests: {
        Row: {
          cert_date: string
          cert_email: string | null
          cert_name: string
          cert_position: string
          cert_school: string
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          requester_email: string
          requester_name: string
          resource_code: string
          resource_id: string
          resource_title: string
          resource_type: string
          slip_number: string
          status: string
        }
        Insert: {
          cert_date: string
          cert_email?: string | null
          cert_name: string
          cert_position: string
          cert_school: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          requester_email: string
          requester_name: string
          resource_code: string
          resource_id: string
          resource_title: string
          resource_type: string
          slip_number: string
          status?: string
        }
        Update: {
          cert_date?: string
          cert_email?: string | null
          cert_name?: string
          cert_position?: string
          cert_school?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          requester_email?: string
          requester_name?: string
          resource_code?: string
          resource_id?: string
          resource_title?: string
          resource_type?: string
          slip_number?: string
          status?: string
        }
        Relationships: []
      }
      learning_resources: {
        Row: {
          additional_authors: Json | null
          checking_items: Json | null
          code: string
          created_at: string
          date_submitted: string
          developer: string
          division: string
          evaluation_phase: string | null
          grade_level: string
          id: string
          learning_area: string
          position: string | null
          quarter: string
          resource_type: string
          school: string
          status: string
          sub_office: string
          submitted_by_email: string | null
          title: string
          updated_at: string
          week: string | null
        }
        Insert: {
          additional_authors?: Json | null
          checking_items?: Json | null
          code: string
          created_at?: string
          date_submitted?: string
          developer: string
          division?: string
          evaluation_phase?: string | null
          grade_level: string
          id?: string
          learning_area: string
          position?: string | null
          quarter: string
          resource_type: string
          school?: string
          status?: string
          sub_office?: string
          submitted_by_email?: string | null
          title: string
          updated_at?: string
          week?: string | null
        }
        Update: {
          additional_authors?: Json | null
          checking_items?: Json | null
          code?: string
          created_at?: string
          date_submitted?: string
          developer?: string
          division?: string
          evaluation_phase?: string | null
          grade_level?: string
          id?: string
          learning_area?: string
          position?: string | null
          quarter?: string
          resource_type?: string
          school?: string
          status?: string
          sub_office?: string
          submitted_by_email?: string | null
          title?: string
          updated_at?: string
          week?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          created_at: string
          id: string
          message: string
          read: boolean
          resource_code: string | null
          resource_id: string | null
          resource_status: string | null
          target_email: string | null
          title: string
          type: string
        }
        Insert: {
          audience: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          resource_code?: string | null
          resource_id?: string | null
          resource_status?: string | null
          target_email?: string | null
          title: string
          type: string
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          resource_code?: string | null
          resource_id?: string | null
          resource_status?: string | null
          target_email?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      resource_history: {
        Row: {
          checking_items: Json | null
          created_at: string
          date: string
          evaluation_phase: string | null
          id: string
          remarks: string
          resource_id: string
          status: string
        }
        Insert: {
          checking_items?: Json | null
          created_at?: string
          date?: string
          evaluation_phase?: string | null
          id?: string
          remarks?: string
          resource_id: string
          status: string
        }
        Update: {
          checking_items?: Json | null
          created_at?: string
          date?: string
          evaluation_phase?: string | null
          id?: string
          remarks?: string
          resource_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_history_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "learning_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          visited_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          visited_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          visited_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
