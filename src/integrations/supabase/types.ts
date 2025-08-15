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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      addon_category_map: {
        Row: {
          addon_id: string
          category_id: string | null
          created_at: string
          is_active: boolean | null
          map_id: string
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          addon_id: string
          category_id?: string | null
          created_at?: string
          is_active?: boolean | null
          map_id?: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          addon_id?: string
          category_id?: string | null
          created_at?: string
          is_active?: boolean | null
          map_id?: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_category_map_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "master_addon"
            referencedColumns: ["addon_id"]
          },
          {
            foreignKeyName: "addon_category_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "master_product_category"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "addon_category_map_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategory"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
      master_addon: {
        Row: {
          addon_category: Database["public"]["Enums"]["addon_category_type"]
          addon_code: string
          addon_id: string
          addon_name: string
          calc_value: number | null
          created_at: string
          description: string | null
          eligibility_json: Json | null
          is_active: boolean
          is_mandatory: boolean
          max_amount: number | null
          min_amount: number | null
          premium_basis: Database["public"]["Enums"]["premium_basis"]
          premium_type: Database["public"]["Enums"]["premium_type"]
          updated_at: string
          waiting_period_months: number | null
        }
        Insert: {
          addon_category?: Database["public"]["Enums"]["addon_category_type"]
          addon_code: string
          addon_id?: string
          addon_name: string
          calc_value?: number | null
          created_at?: string
          description?: string | null
          eligibility_json?: Json | null
          is_active?: boolean
          is_mandatory?: boolean
          max_amount?: number | null
          min_amount?: number | null
          premium_basis?: Database["public"]["Enums"]["premium_basis"]
          premium_type?: Database["public"]["Enums"]["premium_type"]
          updated_at?: string
          waiting_period_months?: number | null
        }
        Update: {
          addon_category?: Database["public"]["Enums"]["addon_category_type"]
          addon_code?: string
          addon_id?: string
          addon_name?: string
          calc_value?: number | null
          created_at?: string
          description?: string | null
          eligibility_json?: Json | null
          is_active?: boolean
          is_mandatory?: boolean
          max_amount?: number | null
          min_amount?: number | null
          premium_basis?: Database["public"]["Enums"]["premium_basis"]
          premium_type?: Database["public"]["Enums"]["premium_type"]
          updated_at?: string
          waiting_period_months?: number | null
        }
        Relationships: []
      }
      master_business_categories: {
        Row: {
          category_code: string
          category_id: number
          category_name: string
          created_at: string | null
          description: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          category_id?: number
          category_name: string
          created_at?: string | null
          description?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          category_id?: number
          category_name?: string
          created_at?: string | null
          description?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      master_health_conditions: {
        Row: {
          category: string
          condition_id: string
          condition_name: string
          created_at: string
          created_by: string | null
          description: string | null
          is_active: boolean
          updated_at: string
          updated_by: string | null
          waiting_period: string | null
        }
        Insert: {
          category: string
          condition_id?: string
          condition_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
          waiting_period?: string | null
        }
        Update: {
          category?: string
          condition_id?: string
          condition_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
          waiting_period?: string | null
        }
        Relationships: []
      }
      master_insurance_providers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          irda_license_number: string
          irda_license_valid_till: string
          logo_file_path: string | null
          notes: string | null
          parent_provider_id: string | null
          provider_code: string
          provider_id: string
          provider_name: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          state: string | null
          status: Database["public"]["Enums"]["provider_status"] | null
          trade_name: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          irda_license_number: string
          irda_license_valid_till: string
          logo_file_path?: string | null
          notes?: string | null
          parent_provider_id?: string | null
          provider_code: string
          provider_id?: string
          provider_name: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["provider_status"] | null
          trade_name?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          irda_license_number?: string
          irda_license_valid_till?: string
          logo_file_path?: string | null
          notes?: string | null
          parent_provider_id?: string | null
          provider_code?: string
          provider_id?: string
          provider_name?: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["provider_status"] | null
          trade_name?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_insurance_providers_parent_provider_id_fkey"
            columns: ["parent_provider_id"]
            isOneToOne: false
            referencedRelation: "master_insurance_providers"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      master_line_of_business: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon_file_path: string | null
          lob_code: string
          lob_id: string
          lob_name: string
          status: Database["public"]["Enums"]["lob_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_file_path?: string | null
          lob_code: string
          lob_id?: string
          lob_name: string
          status?: Database["public"]["Enums"]["lob_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_file_path?: string | null
          lob_code?: string
          lob_id?: string
          lob_name?: string
          status?: Database["public"]["Enums"]["lob_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      master_locations: {
        Row: {
          block: string | null
          country: string
          created_at: string
          created_by: string | null
          district: string | null
          division: string | null
          id: string
          pincode: string
          region: string | null
          state: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          division?: string | null
          id?: string
          pincode: string
          region?: string | null
          state: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          division?: string | null
          id?: string
          pincode?: string
          region?: string | null
          state?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      master_occupations: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          name: string
          occupation_id: number
          status: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          name: string
          occupation_id?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          name?: string
          occupation_id?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_plan_types: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean | null
          lob_id: string
          plan_type_id: string
          plan_type_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean | null
          lob_id: string
          plan_type_id?: string
          plan_type_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean | null
          lob_id?: string
          plan_type_id?: string
          plan_type_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_plan_types_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "master_line_of_business"
            referencedColumns: ["lob_id"]
          },
        ]
      }
      master_policy_tenure: {
        Row: {
          created_at: string | null
          duration_unit: string
          duration_value: number
          is_active: boolean | null
          tenure_id: number
          tenure_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_unit: string
          duration_value: number
          is_active?: boolean | null
          tenure_id?: number
          tenure_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_unit?: string
          duration_value?: number
          is_active?: boolean | null
          tenure_id?: number
          tenure_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_policy_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          policy_type_description: string | null
          policy_type_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          policy_type_description?: string | null
          policy_type_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          policy_type_description?: string | null
          policy_type_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_premium_frequency: {
        Row: {
          created_at: string | null
          description: string | null
          frequency_code: string
          frequency_days: number
          frequency_id: number
          frequency_name: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          frequency_code: string
          frequency_days: number
          frequency_id?: number
          frequency_name: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          frequency_code?: string
          frequency_days?: number
          frequency_id?: number
          frequency_name?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      master_premium_terms: {
        Row: {
          created_at: string | null
          description: string | null
          premium_term_code: string
          premium_term_id: number
          premium_term_name: string
          status: string
          term_duration_years: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          premium_term_code: string
          premium_term_id?: number
          premium_term_name: string
          status?: string
          term_duration_years: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          premium_term_code?: string
          premium_term_id?: number
          premium_term_name?: string
          status?: string
          term_duration_years?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      master_premium_types: {
        Row: {
          created_at: string | null
          description: string | null
          premium_type_code: string
          premium_type_id: number
          premium_type_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          premium_type_code: string
          premium_type_id?: number
          premium_type_name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          premium_type_code?: string
          premium_type_id?: number
          premium_type_name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_product_category: {
        Row: {
          category_code: string
          category_desc: string | null
          category_id: string
          category_name: string
          created_at: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category_code: string
          category_desc?: string | null
          category_id?: string
          category_name: string
          created_at?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category_code?: string
          category_desc?: string | null
          category_id?: string
          category_name?: string
          created_at?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      master_product_name: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          lob_id: string
          plan_type_id: string | null
          policy_type_id: string
          product_code: string
          product_id: string
          product_name: string
          provider_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          lob_id: string
          plan_type_id?: string | null
          policy_type_id: string
          product_code: string
          product_id?: string
          product_name: string
          provider_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          lob_id?: string
          plan_type_id?: string | null
          policy_type_id?: string
          product_code?: string
          product_id?: string
          product_name?: string
          provider_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "master_insurance_providers"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "master_product_name_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "master_line_of_business"
            referencedColumns: ["lob_id"]
          },
          {
            foreignKeyName: "master_product_name_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "master_plan_types"
            referencedColumns: ["plan_type_id"]
          },
          {
            foreignKeyName: "master_product_name_policy_type_id_fkey"
            columns: ["policy_type_id"]
            isOneToOne: false
            referencedRelation: "master_policy_types"
            referencedColumns: ["id"]
          },
        ]
      }
      master_relationship_codes: {
        Row: {
          created_at: string | null
          description: string | null
          is_active: boolean | null
          relationship_code: string
          relationship_id: number
          relationship_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          relationship_code: string
          relationship_id?: number
          relationship_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          relationship_code?: string
          relationship_id?: number
          relationship_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_vehicle_data: {
        Row: {
          created_at: string | null
          cubic_capacity: number | null
          fuel_type: string | null
          make: string
          model: string
          status: boolean | null
          updated_at: string | null
          variant: string | null
          vehicle_id: number
          vehicle_type_id: number
        }
        Insert: {
          created_at?: string | null
          cubic_capacity?: number | null
          fuel_type?: string | null
          make: string
          model: string
          status?: boolean | null
          updated_at?: string | null
          variant?: string | null
          vehicle_id?: number
          vehicle_type_id: number
        }
        Update: {
          created_at?: string | null
          cubic_capacity?: number | null
          fuel_type?: string | null
          make?: string
          model?: string
          status?: boolean | null
          updated_at?: string | null
          variant?: string | null
          vehicle_id?: number
          vehicle_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "master_vehicle_data_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "master_vehicle_types"
            referencedColumns: ["vehicle_type_id"]
          },
        ]
      }
      master_vehicle_types: {
        Row: {
          created_at: string | null
          description: string | null
          status: boolean | null
          updated_at: string | null
          vehicle_type_id: number
          vehicle_type_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          status?: boolean | null
          updated_at?: string | null
          vehicle_type_id?: number
          vehicle_type_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          status?: boolean | null
          updated_at?: string | null
          vehicle_type_id?: number
          vehicle_type_name?: string
        }
        Relationships: []
      }
      product_subcategory: {
        Row: {
          category_id: string
          created_at: string
          is_active: boolean
          subcategory_code: string
          subcategory_desc: string | null
          subcategory_id: string
          subcategory_name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          is_active?: boolean
          subcategory_code: string
          subcategory_desc?: string | null
          subcategory_id?: string
          subcategory_name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          is_active?: boolean
          subcategory_code?: string
          subcategory_desc?: string | null
          subcategory_id?: string
          subcategory_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_subcategory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "master_product_category"
            referencedColumns: ["category_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          must_change_password: boolean
          password_changed_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          must_change_password?: boolean
          password_changed_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          must_change_password?: boolean
          password_changed_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_lob_map: {
        Row: {
          created_at: string
          lob_id: string
          map_id: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          lob_id: string
          map_id?: string
          provider_id: string
        }
        Update: {
          created_at?: string
          lob_id?: string
          map_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_lob_map_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "master_line_of_business"
            referencedColumns: ["lob_id"]
          },
          {
            foreignKeyName: "provider_lob_map_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "master_insurance_providers"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number
          created_at: string
          currency_code: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          is_default_plan: boolean
          max_policies: number | null
          max_users: number | null
          monthly_price: number
          plan_code: string
          plan_name: string
          updated_at: string
        }
        Insert: {
          annual_price: number
          created_at?: string
          currency_code?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_default_plan?: boolean
          max_policies?: number | null
          max_users?: number | null
          monthly_price: number
          plan_code: string
          plan_name: string
          updated_at?: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          currency_code?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_default_plan?: boolean
          max_policies?: number | null
          max_users?: number | null
          monthly_price?: number
          plan_code?: string
          plan_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          notes: string | null
          status: string | null
          tenant_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          notes?: string | null
          status?: string | null
          tenant_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          tenant_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          plan_id: string
          start_date: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          plan_id: string
          start_date: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          plan_id?: string
          start_date?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credentials: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_system_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_master_cities_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          city_code: string
          city_id: string
          city_name: string
          country_code: string
          country_name: string
          created_at: string
          created_by: string
          state_code: string
          state_id: string
          state_name: string
          status: string
          updated_at: string
          updated_by: string
        }[]
      }
      get_master_pincodes_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          area_name: string
          city_id: string
          created_at: string
          created_by: string
          latitude: number
          longitude: number
          pincode: string
          pincode_id: string
          status: string
          updated_at: string
          updated_by: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_system_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      addon_category_type: "Rider" | "Add-on"
      app_role:
        | "system_admin"
        | "tenant_admin"
        | "tenant_employee"
        | "tenant_agent"
        | "customer"
      lob_status: "Active" | "Inactive"
      location_status: "Active" | "Inactive"
      premium_basis: "PerPolicy" | "PerMember"
      premium_type: "Flat" | "PercentOfBase" | "AgeBand" | "Slab"
      provider_status: "Active" | "Inactive" | "Pending"
      provider_type: "Life" | "General" | "Health" | "Composite"
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
      addon_category_type: ["Rider", "Add-on"],
      app_role: [
        "system_admin",
        "tenant_admin",
        "tenant_employee",
        "tenant_agent",
        "customer",
      ],
      lob_status: ["Active", "Inactive"],
      location_status: ["Active", "Inactive"],
      premium_basis: ["PerPolicy", "PerMember"],
      premium_type: ["Flat", "PercentOfBase", "AgeBand", "Slab"],
      provider_status: ["Active", "Inactive", "Pending"],
      provider_type: ["Life", "General", "Health", "Composite"],
    },
  },
} as const
