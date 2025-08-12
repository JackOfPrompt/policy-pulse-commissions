export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      login_roles: {
        Row: {
          created_at: string
          default_landing_page: string | null
          description: string | null
          is_tenant_level: boolean | null
          permissions_json: Json | null
          role_id: string
          role_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_landing_page?: string | null
          description?: string | null
          is_tenant_level?: boolean | null
          permissions_json?: Json | null
          role_id?: string
          role_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_landing_page?: string | null
          description?: string | null
          is_tenant_level?: boolean | null
          permissions_json?: Json | null
          role_id?: string
          role_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mdm_addons: {
        Row: {
          addon_id: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          status: Database["public"]["Enums"]["mdm_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          addon_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          addon_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mdm_lobs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lob_code: string
          lob_id: string | null
          lob_name: string
          status: Database["public"]["Enums"]["mdm_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lob_code: string
          lob_id?: string | null
          lob_name: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lob_code?: string
          lob_id?: string | null
          lob_name?: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mdm_plan_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          plan_type_code: string
          plan_type_id: string | null
          plan_type_name: string
          policy_type_id: string
          status: Database["public"]["Enums"]["mdm_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          plan_type_code: string
          plan_type_id?: string | null
          plan_type_name: string
          policy_type_id: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          plan_type_code?: string
          plan_type_id?: string | null
          plan_type_name?: string
          policy_type_id?: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdm_plan_types_policy_type_id_fkey"
            columns: ["policy_type_id"]
            isOneToOne: false
            referencedRelation: "mdm_policy_types"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_policy_sub_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          plan_type_id: string
          policy_sub_type_id: string | null
          status: Database["public"]["Enums"]["mdm_status"]
          sub_type_code: string
          sub_type_name: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          plan_type_id: string
          policy_sub_type_id?: string | null
          status?: Database["public"]["Enums"]["mdm_status"]
          sub_type_code: string
          sub_type_name: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          plan_type_id?: string
          policy_sub_type_id?: string | null
          status?: Database["public"]["Enums"]["mdm_status"]
          sub_type_code?: string
          sub_type_name?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdm_policy_sub_types_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "mdm_plan_types"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_policy_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          policy_type_code: string
          policy_type_id: string | null
          policy_type_name: string
          product_type_id: string
          status: Database["public"]["Enums"]["mdm_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          policy_type_code: string
          policy_type_id?: string | null
          policy_type_name: string
          product_type_id: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          policy_type_code?: string
          policy_type_id?: string | null
          policy_type_name?: string
          product_type_id?: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdm_policy_types_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "mdm_product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_product_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lob_id: string
          product_type_code: string
          product_type_id: string | null
          product_type_name: string
          status: Database["public"]["Enums"]["mdm_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lob_id: string
          product_type_code: string
          product_type_id?: string | null
          product_type_name: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lob_id?: string
          product_type_code?: string
          product_type_id?: string | null
          product_type_name?: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdm_product_types_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "mdm_lobs"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_products: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          product_id: string | null
          product_type_id: string
          provider_id: string
          status: Database["public"]["Enums"]["mdm_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          product_id?: string | null
          product_type_id: string
          provider_id: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          product_id?: string | null
          product_type_id?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdm_products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "mdm_product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdm_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "mdm_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_providers: {
        Row: {
          address: string | null
          contact_email: string | null
          created_at: string
          id: string
          phone_number: string | null
          provider_code: string
          provider_id: string | null
          provider_name: string
          status: Database["public"]["Enums"]["mdm_status"]
          tenant_id: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          provider_code: string
          provider_id?: string | null
          provider_name: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          provider_code?: string
          provider_id?: string | null
          provider_name?: string
          status?: Database["public"]["Enums"]["mdm_status"]
          tenant_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          description: string | null
          module_name: string
          permission_id: string
          status: Database["public"]["Enums"]["permission_status"]
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          module_name: string
          permission_id?: string
          status?: Database["public"]["Enums"]["permission_status"]
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          module_name?: string
          permission_id?: string
          status?: Database["public"]["Enums"]["permission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          permission_id: string
          role_id: string
          role_permission_id: string
          updated_at: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          permission_id: string
          role_id: string
          role_permission_id?: string
          updated_at?: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          permission_id?: string
          role_id?: string
          role_permission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission_id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "login_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number | null
          api_access: boolean | null
          available_add_ons: Json | null
          created_at: string
          created_by: string | null
          currency_code: string | null
          description: string | null
          features: Json | null
          includes_trial: boolean | null
          is_active: boolean | null
          is_default_plan: boolean | null
          max_agents: number | null
          max_products: number | null
          max_users: number | null
          monthly_price: number
          plan_code: string
          plan_id: string
          plan_name: string
          regional_prices: Json | null
          reporting_tools: boolean | null
          support_level: string
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          annual_price?: number | null
          api_access?: boolean | null
          available_add_ons?: Json | null
          created_at?: string
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          features?: Json | null
          includes_trial?: boolean | null
          is_active?: boolean | null
          is_default_plan?: boolean | null
          max_agents?: number | null
          max_products?: number | null
          max_users?: number | null
          monthly_price?: number
          plan_code: string
          plan_id?: string
          plan_name: string
          regional_prices?: Json | null
          reporting_tools?: boolean | null
          support_level?: string
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          annual_price?: number | null
          api_access?: boolean | null
          available_add_ons?: Json | null
          created_at?: string
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          features?: Json | null
          includes_trial?: boolean | null
          is_active?: boolean | null
          is_default_plan?: boolean | null
          max_agents?: number | null
          max_products?: number | null
          max_users?: number | null
          monthly_price?: number
          plan_code?: string
          plan_id?: string
          plan_name?: string
          regional_prices?: Json | null
          reporting_tools?: boolean | null
          support_level?: string
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_cycle: string
          cancellation_reason: string | null
          cancelled_on: string | null
          created_at: string
          created_by: string | null
          current_add_ons: Json | null
          discount_code: string | null
          end_date: string
          invoice_reference: string | null
          is_active: boolean | null
          last_payment_date: string | null
          next_renewal_date: string | null
          payment_method: string | null
          payment_status: string
          plan_id: string
          plan_snapshot: Json | null
          start_date: string
          subscription_id: string
          tenant_id: string
          trial_end_date: string | null
          trial_start_date: string | null
          trial_used: boolean | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          billing_cycle: string
          cancellation_reason?: string | null
          cancelled_on?: string | null
          created_at?: string
          created_by?: string | null
          current_add_ons?: Json | null
          discount_code?: string | null
          end_date: string
          invoice_reference?: string | null
          is_active?: boolean | null
          last_payment_date?: string | null
          next_renewal_date?: string | null
          payment_method?: string | null
          payment_status: string
          plan_id: string
          plan_snapshot?: Json | null
          start_date: string
          subscription_id?: string
          tenant_id: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          billing_cycle?: string
          cancellation_reason?: string | null
          cancelled_on?: string | null
          created_at?: string
          created_by?: string | null
          current_add_ons?: Json | null
          discount_code?: string | null
          end_date?: string
          invoice_reference?: string | null
          is_active?: boolean | null
          last_payment_date?: string | null
          next_renewal_date?: string | null
          payment_method?: string | null
          payment_status?: string
          plan_id?: string
          plan_snapshot?: Json | null
          start_date?: string
          subscription_id?: string
          tenant_id?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_email: string
          contact_person: string | null
          created_at: string
          industry_type: string | null
          logo_url: string | null
          notes: string | null
          phone_number: string | null
          status: string
          tenant_code: string
          tenant_id: string
          tenant_name: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_person?: string | null
          created_at?: string
          industry_type?: string | null
          logo_url?: string | null
          notes?: string | null
          phone_number?: string | null
          status?: string
          tenant_code: string
          tenant_id?: string
          tenant_name: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_person?: string | null
          created_at?: string
          industry_type?: string | null
          logo_url?: string | null
          notes?: string | null
          phone_number?: string | null
          status?: string
          tenant_code?: string
          tenant_id?: string
          tenant_name?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          failed_login_attempts: number
          is_email_verified: boolean | null
          locked_until: string | null
          role_id: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_login_attempts?: number
          is_email_verified?: boolean | null
          locked_until?: string | null
          role_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_login_attempts?: number
          is_email_verified?: boolean | null
          locked_until?: string | null
          role_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "login_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_role_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_permission: {
        Args: { _module: string; _action: string; _user_id?: string }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      is_tenant_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      mdm_apply_policies: {
        Args: { tbl: unknown }
        Returns: undefined
      }
    }
    Enums: {
      mdm_status: "active" | "inactive"
      permission_status: "active" | "inactive"
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
      mdm_status: ["active", "inactive"],
      permission_status: ["active", "inactive"],
    },
  },
} as const
