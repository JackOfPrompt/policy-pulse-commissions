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
      agent_commission_history: {
        Row: {
          agent_id: string | null
          applied_grid_id: string | null
          applied_grid_table: string | null
          applied_tier_id: string | null
          base_commission_rate: number | null
          bonus_commission_rate: number | null
          commission_amount: number
          commission_percentage: number
          created_at: string | null
          id: string
          is_reporting_employee_applied: boolean | null
          misp_id: string | null
          org_id: string
          policy_id: string
          reward_commission_rate: number | null
          total_commission_rate: number | null
          used_override: boolean | null
        }
        Insert: {
          agent_id?: string | null
          applied_grid_id?: string | null
          applied_grid_table?: string | null
          applied_tier_id?: string | null
          base_commission_rate?: number | null
          bonus_commission_rate?: number | null
          commission_amount: number
          commission_percentage: number
          created_at?: string | null
          id?: string
          is_reporting_employee_applied?: boolean | null
          misp_id?: string | null
          org_id: string
          policy_id: string
          reward_commission_rate?: number | null
          total_commission_rate?: number | null
          used_override?: boolean | null
        }
        Update: {
          agent_id?: string | null
          applied_grid_id?: string | null
          applied_grid_table?: string | null
          applied_tier_id?: string | null
          base_commission_rate?: number | null
          bonus_commission_rate?: number | null
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          id?: string
          is_reporting_employee_applied?: boolean | null
          misp_id?: string | null
          org_id?: string
          policy_id?: string
          reward_commission_rate?: number | null
          total_commission_rate?: number | null
          used_override?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_commission_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commission_history_applied_tier_id_fkey"
            columns: ["applied_tier_id"]
            isOneToOne: false
            referencedRelation: "commission_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commission_history_misp_id_fkey"
            columns: ["misp_id"]
            isOneToOne: false
            referencedRelation: "misps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commission_history_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          aadhar_card: string | null
          aadhar_url: string | null
          account_name: string | null
          account_number: string | null
          account_type: string | null
          address: string | null
          agent_code: string | null
          agent_name: string
          agent_type: string | null
          bank_name: string | null
          branch_name: string | null
          cheque_doc: string | null
          city: string | null
          commission_tier_id: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          degree_doc: string | null
          district: string | null
          dob: string | null
          email: string | null
          emailpermissions: boolean | null
          employee_id: string | null
          gender: string | null
          id: string
          ifsc_code: string | null
          mobilepermissions: boolean | null
          org_id: string
          other_doc: string | null
          override_percentage: number | null
          pan_card: string | null
          pan_url: string | null
          percentage: number | null
          phone: string | null
          pincode: string | null
          profile_doc: string | null
          qualification: string | null
          reference: string | null
          reporting_manager_id: string | null
          reporting_manager_name: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          aadhar_card?: string | null
          aadhar_url?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          agent_code?: string | null
          agent_name: string
          agent_type?: string | null
          bank_name?: string | null
          branch_name?: string | null
          cheque_doc?: string | null
          city?: string | null
          commission_tier_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          degree_doc?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emailpermissions?: boolean | null
          employee_id?: string | null
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          mobilepermissions?: boolean | null
          org_id: string
          other_doc?: string | null
          override_percentage?: number | null
          pan_card?: string | null
          pan_url?: string | null
          percentage?: number | null
          phone?: string | null
          pincode?: string | null
          profile_doc?: string | null
          qualification?: string | null
          reference?: string | null
          reporting_manager_id?: string | null
          reporting_manager_name?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          aadhar_card?: string | null
          aadhar_url?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          agent_code?: string | null
          agent_name?: string
          agent_type?: string | null
          bank_name?: string | null
          branch_name?: string | null
          cheque_doc?: string | null
          city?: string | null
          commission_tier_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          degree_doc?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emailpermissions?: boolean | null
          employee_id?: string | null
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          mobilepermissions?: boolean | null
          org_id?: string
          other_doc?: string | null
          override_percentage?: number | null
          pan_card?: string | null
          pan_url?: string | null
          percentage?: number | null
          phone?: string | null
          pincode?: string | null
          profile_doc?: string | null
          qualification?: string | null
          reference?: string | null
          reporting_manager_id?: string | null
          reporting_manager_name?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_commission_tier_id_fkey"
            columns: ["commission_tier_id"]
            isOneToOne: false
            referencedRelation: "commission_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_name: string
          city: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          district: string | null
          id: string
          landmark: string | null
          org_id: string
          pincode: string | null
          region: string | null
          state: string | null
          status: string | null
          sub_department: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_name: string
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          district?: string | null
          id?: string
          landmark?: string | null
          org_id: string
          pincode?: string | null
          region?: string | null
          state?: string | null
          status?: string | null
          sub_department?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_name?: string
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          district?: string | null
          id?: string
          landmark?: string | null
          org_id?: string
          pincode?: string | null
          region?: string | null
          state?: string | null
          status?: string | null
          sub_department?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          base_percentage: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_premium: number | null
          min_premium: number | null
          name: string
          org_id: string
          product_type_id: string | null
          provider_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_percentage?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          min_premium?: number | null
          name: string
          org_id: string
          product_type_id?: string | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_percentage?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          min_premium?: number | null
          name?: string
          org_id?: string
          product_type_id?: string | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coverage_types: {
        Row: {
          category: string | null
          code: string
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          code: string
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          code?: string
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          aadhar_number: string | null
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          customer_code: string | null
          customer_type: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          gstin: string | null
          id: string
          last_name: string | null
          org_id: string
          pan_number: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          aadhar_number?: string | null
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_code?: string | null
          customer_type?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          gstin?: string | null
          id?: string
          last_name?: string | null
          org_id: string
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          aadhar_number?: string | null
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_code?: string | null
          customer_type?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          gstin?: string | null
          id?: string
          last_name?: string | null
          org_id?: string
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_commission_history: {
        Row: {
          applied_grid_id: string | null
          applied_grid_table: string | null
          base_commission_rate: number | null
          bonus_commission_rate: number | null
          commission_amount: number
          created_at: string | null
          employee_id: string | null
          id: string
          is_reporting_employee: boolean | null
          org_id: string
          policy_id: string
          reward_commission_rate: number | null
          total_commission_rate: number | null
        }
        Insert: {
          applied_grid_id?: string | null
          applied_grid_table?: string | null
          base_commission_rate?: number | null
          bonus_commission_rate?: number | null
          commission_amount: number
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_reporting_employee?: boolean | null
          org_id: string
          policy_id: string
          reward_commission_rate?: number | null
          total_commission_rate?: number | null
        }
        Update: {
          applied_grid_id?: string | null
          applied_grid_table?: string | null
          base_commission_rate?: number | null
          bonus_commission_rate?: number | null
          commission_amount?: number
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_reporting_employee?: boolean | null
          org_id?: string
          policy_id?: string
          reward_commission_rate?: number | null
          total_commission_rate?: number | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          aadhar_card: string | null
          aadhar_url: string | null
          account_name: string | null
          account_number: string | null
          account_type: string | null
          address: string | null
          bank_name: string | null
          branch_id: string | null
          branch_name: string | null
          cheque_doc: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          degree_doc: string | null
          department: string | null
          designation: string | null
          district: string | null
          dob: string | null
          email: string | null
          emailpermissions: boolean | null
          employee_code: string | null
          gender: string | null
          id: string
          ifsc_code: string | null
          mobilepermissions: boolean | null
          name: string
          org_id: string
          other_doc: string | null
          pan_card: string | null
          pan_url: string | null
          phone: string | null
          pincode: string | null
          profile_doc: string | null
          qualification: string | null
          reference: string | null
          reporting_employee_id: string | null
          reporting_manager: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          aadhar_card?: string | null
          aadhar_url?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          bank_name?: string | null
          branch_id?: string | null
          branch_name?: string | null
          cheque_doc?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          degree_doc?: string | null
          department?: string | null
          designation?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emailpermissions?: boolean | null
          employee_code?: string | null
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          mobilepermissions?: boolean | null
          name: string
          org_id: string
          other_doc?: string | null
          pan_card?: string | null
          pan_url?: string | null
          phone?: string | null
          pincode?: string | null
          profile_doc?: string | null
          qualification?: string | null
          reference?: string | null
          reporting_employee_id?: string | null
          reporting_manager?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          aadhar_card?: string | null
          aadhar_url?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          bank_name?: string | null
          branch_id?: string | null
          branch_name?: string | null
          cheque_doc?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          degree_doc?: string | null
          department?: string | null
          designation?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emailpermissions?: boolean | null
          employee_code?: string | null
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          mobilepermissions?: boolean | null
          name?: string
          org_id?: string
          other_doc?: string | null
          pan_card?: string | null
          pan_url?: string | null
          phone?: string | null
          pincode?: string | null
          profile_doc?: string | null
          qualification?: string | null
          reference?: string | null
          reporting_employee_id?: string | null
          reporting_manager?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_reporting_manager_fkey"
            columns: ["reporting_manager"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_types: {
        Row: {
          code: string
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      health_payout_grid: {
        Row: {
          age_group: string | null
          bonus_commission_rate: number | null
          commission_rate: number
          created_at: string | null
          created_by: string | null
          effective_from: string
          effective_to: string | null
          family_size: number | null
          id: string
          is_active: boolean | null
          max_premium: number | null
          min_premium: number | null
          org_id: string
          plan_name: string
          product_sub_type: string
          product_type: string
          product_type_id: string | null
          provider: string
          provider_id: string | null
          reward_rate: number
          sum_insured_max: number | null
          sum_insured_min: number | null
          updated_at: string | null
          updated_by: string | null
          version_no: number
        }
        Insert: {
          age_group?: string | null
          bonus_commission_rate?: number | null
          commission_rate: number
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          family_size?: number | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          min_premium?: number | null
          org_id: string
          plan_name: string
          product_sub_type: string
          product_type: string
          product_type_id?: string | null
          provider: string
          provider_id?: string | null
          reward_rate?: number
          sum_insured_max?: number | null
          sum_insured_min?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version_no?: number
        }
        Update: {
          age_group?: string | null
          bonus_commission_rate?: number | null
          commission_rate?: number
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          family_size?: number | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          min_premium?: number | null
          org_id?: string
          plan_name?: string
          product_sub_type?: string
          product_type?: string
          product_type_id?: string | null
          provider?: string
          provider_id?: string | null
          reward_rate?: number
          sum_insured_max?: number | null
          sum_insured_min?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version_no?: number
        }
        Relationships: []
      }
      health_policy_details: {
        Row: {
          benefits: Json | null
          co_pay: number | null
          cover_type: string | null
          created_at: string | null
          exclusions: Json | null
          policy_id: string
          policy_type: string | null
          uin: string | null
          updated_at: string | null
          waiting_period: number | null
        }
        Insert: {
          benefits?: Json | null
          co_pay?: number | null
          cover_type?: string | null
          created_at?: string | null
          exclusions?: Json | null
          policy_id: string
          policy_type?: string | null
          uin?: string | null
          updated_at?: string | null
          waiting_period?: number | null
        }
        Update: {
          benefits?: Json | null
          co_pay?: number | null
          cover_type?: string | null
          created_at?: string | null
          exclusions?: Json | null
          policy_id?: string
          policy_type?: string | null
          uin?: string | null
          updated_at?: string | null
          waiting_period?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_policy_details_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insured_members: {
        Row: {
          created_at: string | null
          dob: string | null
          gender: string | null
          id: string
          member_id: string | null
          name: string
          policy_id: string
          pre_existing_diseases: string | null
          relationship: string | null
          sum_insured: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dob?: string | null
          gender?: string | null
          id?: string
          member_id?: string | null
          name: string
          policy_id: string
          pre_existing_diseases?: string | null
          relationship?: string | null
          sum_insured?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dob?: string | null
          gender?: string | null
          id?: string
          member_id?: string | null
          name?: string
          policy_id?: string
          pre_existing_diseases?: string | null
          relationship?: string | null
          sum_insured?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insured_members_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "health_policy_details"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      life_payout_grid: {
        Row: {
          bonus_commission_rate: number | null
          commission_end_date: string | null
          commission_rate: number
          commission_start_date: string
          created_at: string | null
          created_by: string | null
          grid_effective_from: string | null
          grid_effective_to: string | null
          id: string
          is_active: boolean | null
          max_premium: number | null
          min_premium: number | null
          org_id: string
          plan_name: string | null
          plan_type: string | null
          ppt: number | null
          product_sub_type: string | null
          product_type: string
          product_type_id: string | null
          provider: string
          provider_id: string | null
          pt: number | null
          reward_rate: number | null
          total_rate: number | null
          updated_at: string | null
          updated_by: string | null
          variable_end_date: string | null
          variable_start_date: string | null
          version_no: number
        }
        Insert: {
          bonus_commission_rate?: number | null
          commission_end_date?: string | null
          commission_rate: number
          commission_start_date?: string
          created_at?: string | null
          created_by?: string | null
          grid_effective_from?: string | null
          grid_effective_to?: string | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          min_premium?: number | null
          org_id: string
          plan_name?: string | null
          plan_type?: string | null
          ppt?: number | null
          product_sub_type?: string | null
          product_type: string
          product_type_id?: string | null
          provider: string
          provider_id?: string | null
          pt?: number | null
          reward_rate?: number | null
          total_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          variable_end_date?: string | null
          variable_start_date?: string | null
          version_no?: number
        }
        Update: {
          bonus_commission_rate?: number | null
          commission_end_date?: string | null
          commission_rate?: number
          commission_start_date?: string
          created_at?: string | null
          created_by?: string | null
          grid_effective_from?: string | null
          grid_effective_to?: string | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          min_premium?: number | null
          org_id?: string
          plan_name?: string | null
          plan_type?: string | null
          ppt?: number | null
          product_sub_type?: string | null
          product_type?: string
          product_type_id?: string | null
          provider?: string
          provider_id?: string | null
          pt?: number | null
          reward_rate?: number | null
          total_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          variable_end_date?: string | null
          variable_start_date?: string | null
          version_no?: number
        }
        Relationships: []
      }
      life_policy_details: {
        Row: {
          benefits: Json | null
          created_at: string | null
          maturity_date: string | null
          plan_type: string | null
          policy_id: string
          policy_term: number | null
          premium_frequency: string | null
          premium_payment_term: number | null
          sum_assured: number | null
          tax_benefits: string | null
          uin: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          maturity_date?: string | null
          plan_type?: string | null
          policy_id: string
          policy_term?: number | null
          premium_frequency?: string | null
          premium_payment_term?: number | null
          sum_assured?: number | null
          tax_benefits?: string | null
          uin?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          maturity_date?: string | null
          plan_type?: string | null
          policy_id?: string
          policy_term?: number | null
          premium_frequency?: string | null
          premium_payment_term?: number | null
          sum_assured?: number | null
          tax_benefits?: string | null
          uin?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_policy_details_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      misps: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          account_type: string | null
          address: string | null
          bank_name: string | null
          channel_partner_name: string
          cheque_doc: string | null
          city: string | null
          commission_tier_id: string | null
          company_back_photo: string | null
          company_front_photo: string | null
          company_left_photo: string | null
          company_right_photo: string | null
          created_at: string | null
          created_by: string | null
          dealer_gst_certificate_doc: string | null
          dealer_gst_number: string | null
          dealer_pan_card_doc: string | null
          dealer_pan_number: string | null
          dealer_principal_email_id: string | null
          dealer_principal_firstname: string | null
          dealer_principal_kyc: string | null
          dealer_principal_kyc_doc: string | null
          dealer_principal_lastname: string | null
          dealer_principal_phone_number: string | null
          dealer_principal_photo: string | null
          district: string | null
          emailpermissions: boolean | null
          employee_id: string | null
          id: string
          ifsc_code: string | null
          landmark: string | null
          misp_agreement_doc: string | null
          mobilepermissions: boolean | null
          org_id: string
          override_percentage: number | null
          percentage: number | null
          pincode: string | null
          reporting_manager_id: string | null
          reporting_manager_name: string | null
          sales_person_educational_certificate: string | null
          sales_person_educational_certificate_doc: string | null
          sales_person_email_id: string | null
          sales_person_firstname: string | null
          sales_person_kyc: string | null
          sales_person_kyc_doc: string | null
          sales_person_lastname: string | null
          sales_person_mobile_number: string | null
          sales_person_photo: string | null
          state: string | null
          type_of_dealer: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          bank_name?: string | null
          channel_partner_name: string
          cheque_doc?: string | null
          city?: string | null
          commission_tier_id?: string | null
          company_back_photo?: string | null
          company_front_photo?: string | null
          company_left_photo?: string | null
          company_right_photo?: string | null
          created_at?: string | null
          created_by?: string | null
          dealer_gst_certificate_doc?: string | null
          dealer_gst_number?: string | null
          dealer_pan_card_doc?: string | null
          dealer_pan_number?: string | null
          dealer_principal_email_id?: string | null
          dealer_principal_firstname?: string | null
          dealer_principal_kyc?: string | null
          dealer_principal_kyc_doc?: string | null
          dealer_principal_lastname?: string | null
          dealer_principal_phone_number?: string | null
          dealer_principal_photo?: string | null
          district?: string | null
          emailpermissions?: boolean | null
          employee_id?: string | null
          id?: string
          ifsc_code?: string | null
          landmark?: string | null
          misp_agreement_doc?: string | null
          mobilepermissions?: boolean | null
          org_id: string
          override_percentage?: number | null
          percentage?: number | null
          pincode?: string | null
          reporting_manager_id?: string | null
          reporting_manager_name?: string | null
          sales_person_educational_certificate?: string | null
          sales_person_educational_certificate_doc?: string | null
          sales_person_email_id?: string | null
          sales_person_firstname?: string | null
          sales_person_kyc?: string | null
          sales_person_kyc_doc?: string | null
          sales_person_lastname?: string | null
          sales_person_mobile_number?: string | null
          sales_person_photo?: string | null
          state?: string | null
          type_of_dealer?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          bank_name?: string | null
          channel_partner_name?: string
          cheque_doc?: string | null
          city?: string | null
          commission_tier_id?: string | null
          company_back_photo?: string | null
          company_front_photo?: string | null
          company_left_photo?: string | null
          company_right_photo?: string | null
          created_at?: string | null
          created_by?: string | null
          dealer_gst_certificate_doc?: string | null
          dealer_gst_number?: string | null
          dealer_pan_card_doc?: string | null
          dealer_pan_number?: string | null
          dealer_principal_email_id?: string | null
          dealer_principal_firstname?: string | null
          dealer_principal_kyc?: string | null
          dealer_principal_kyc_doc?: string | null
          dealer_principal_lastname?: string | null
          dealer_principal_phone_number?: string | null
          dealer_principal_photo?: string | null
          district?: string | null
          emailpermissions?: boolean | null
          employee_id?: string | null
          id?: string
          ifsc_code?: string | null
          landmark?: string | null
          misp_agreement_doc?: string | null
          mobilepermissions?: boolean | null
          org_id?: string
          override_percentage?: number | null
          percentage?: number | null
          pincode?: string | null
          reporting_manager_id?: string | null
          reporting_manager_name?: string | null
          sales_person_educational_certificate?: string | null
          sales_person_educational_certificate_doc?: string | null
          sales_person_email_id?: string | null
          sales_person_firstname?: string | null
          sales_person_kyc?: string | null
          sales_person_kyc_doc?: string | null
          sales_person_lastname?: string | null
          sales_person_mobile_number?: string | null
          sales_person_photo?: string | null
          state?: string | null
          type_of_dealer?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "misps_commission_tier_id_fkey"
            columns: ["commission_tier_id"]
            isOneToOne: false
            referencedRelation: "commission_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "misps_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "misps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "misps_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_payout_grid: {
        Row: {
          bonus_commission_rate: number | null
          business_type_id: number | null
          cc_range: string | null
          commission_rate: number
          coverage_type_id: number | null
          created_at: string | null
          created_by: string | null
          effective_from: string
          effective_to: string | null
          fuel_type_id: number | null
          gvw_range: string | null
          gwp_slab: string | null
          id: string
          is_active: boolean | null
          max_premium: number | null
          mcv_type: string | null
          min_premium: number | null
          ncb_percentage: number | null
          org_id: string
          pcv_type: string | null
          product_subtype: string
          product_type: string
          product_type_id: string | null
          provider: string
          provider_id: string | null
          reward_rate: number | null
          rto_location: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_make: string | null
          vehicle_type_id: number | null
          version_no: number
        }
        Insert: {
          bonus_commission_rate?: number | null
          business_type_id?: number | null
          cc_range?: string | null
          commission_rate: number
          coverage_type_id?: number | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          fuel_type_id?: number | null
          gvw_range?: string | null
          gwp_slab?: string | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          mcv_type?: string | null
          min_premium?: number | null
          ncb_percentage?: number | null
          org_id: string
          pcv_type?: string | null
          product_subtype: string
          product_type: string
          product_type_id?: string | null
          provider: string
          provider_id?: string | null
          reward_rate?: number | null
          rto_location?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_make?: string | null
          vehicle_type_id?: number | null
          version_no?: number
        }
        Update: {
          bonus_commission_rate?: number | null
          business_type_id?: number | null
          cc_range?: string | null
          commission_rate?: number
          coverage_type_id?: number | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          fuel_type_id?: number | null
          gvw_range?: string | null
          gwp_slab?: string | null
          id?: string
          is_active?: boolean | null
          max_premium?: number | null
          mcv_type?: string | null
          min_premium?: number | null
          ncb_percentage?: number | null
          org_id?: string
          pcv_type?: string | null
          product_subtype?: string
          product_type?: string
          product_type_id?: string | null
          provider?: string
          provider_id?: string | null
          reward_rate?: number | null
          rto_location?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_make?: string | null
          vehicle_type_id?: number | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "motor_payout_grid_coverage_type_id_fkey"
            columns: ["coverage_type_id"]
            isOneToOne: false
            referencedRelation: "coverage_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motor_payout_grid_fuel_type_id_fkey"
            columns: ["fuel_type_id"]
            isOneToOne: false
            referencedRelation: "fuel_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motor_payout_grid_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_policy_details: {
        Row: {
          created_at: string | null
          idv: number | null
          ncb: number | null
          policy_id: string
          policy_sub_type: string | null
          policy_type: string | null
          previous_claim: boolean | null
          previous_insurer_name: string | null
          previous_policy_number: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          idv?: number | null
          ncb?: number | null
          policy_id: string
          policy_sub_type?: string | null
          policy_type?: string | null
          previous_claim?: boolean | null
          previous_insurer_name?: string | null
          previous_policy_number?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          idv?: number | null
          ncb?: number | null
          policy_id?: string
          policy_sub_type?: string | null
          policy_type?: string | null
          previous_claim?: boolean | null
          previous_insurer_name?: string | null
          previous_policy_number?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motor_policy_details_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motor_policy_details_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_config: {
        Row: {
          broker_share_percentage: number | null
          created_at: string | null
          default_commission_rate: number | null
          employee_share_percentage: number | null
          id: string
          org_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          broker_share_percentage?: number | null
          created_at?: string | null
          default_commission_rate?: number | null
          employee_share_percentage?: number | null
          id?: string
          org_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          broker_share_percentage?: number | null
          created_at?: string | null
          default_commission_rate?: number | null
          employee_share_percentage?: number | null
          id?: string
          org_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          annual_revenue: string | null
          api_settings: Json | null
          billing_address: Json | null
          business_type: string | null
          city: string | null
          code: string
          compliance_info: Json | null
          contact_email: string | null
          contact_name: string | null
          contact_person: Json | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          employee_count: string | null
          id: string
          industry_type: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          pincode: string | null
          registration_number: string | null
          state: string | null
          status: string | null
          subscription_plan: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: string | null
          api_settings?: Json | null
          billing_address?: Json | null
          business_type?: string | null
          city?: string | null
          code: string
          compliance_info?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_person?: Json | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: string | null
          id?: string
          industry_type?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          pincode?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string | null
          subscription_plan?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: string | null
          api_settings?: Json | null
          billing_address?: Json | null
          business_type?: string | null
          city?: string | null
          code?: string
          compliance_info?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_person?: Json | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: string | null
          id?: string
          industry_type?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          pincode?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string | null
          subscription_plan?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          name: string
          price_monthly: number | null
          price_yearly: number | null
          trial_period_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          agent_id: string | null
          broker_company: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          dynamic_details: Json | null
          employee_id: string | null
          end_date: string | null
          gross_premium: number | null
          gst: number | null
          id: string
          issue_date: string | null
          misp_id: string | null
          org_id: string
          pdf_link: string | null
          plan_name: string | null
          policy_number: string
          policy_status: string | null
          posp_id: string | null
          premium_with_gst: number | null
          premium_without_gst: number | null
          product_type_id: string
          provider: string | null
          provider_id: string | null
          source_type: string | null
          start_date: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          agent_id?: string | null
          broker_company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          dynamic_details?: Json | null
          employee_id?: string | null
          end_date?: string | null
          gross_premium?: number | null
          gst?: number | null
          id?: string
          issue_date?: string | null
          misp_id?: string | null
          org_id: string
          pdf_link?: string | null
          plan_name?: string | null
          policy_number: string
          policy_status?: string | null
          posp_id?: string | null
          premium_with_gst?: number | null
          premium_without_gst?: number | null
          product_type_id: string
          provider?: string | null
          provider_id?: string | null
          source_type?: string | null
          start_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          agent_id?: string | null
          broker_company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          dynamic_details?: Json | null
          employee_id?: string | null
          end_date?: string | null
          gross_premium?: number | null
          gst?: number | null
          id?: string
          issue_date?: string | null
          misp_id?: string | null
          org_id?: string
          pdf_link?: string | null
          plan_name?: string | null
          policy_number?: string
          policy_status?: string | null
          posp_id?: string | null
          premium_with_gst?: number | null
          premium_without_gst?: number | null
          product_type_id?: string
          provider?: string | null
          provider_id?: string | null
          source_type?: string | null
          start_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_misp_id_fkey"
            columns: ["misp_id"]
            isOneToOne: false
            referencedRelation: "misps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_posp_id_fkey"
            columns: ["posp_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          org_id: string | null
          primary_org_id: string | null
          role: string
          sub_department: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          org_id?: string | null
          primary_org_id?: string | null
          role: string
          sub_department?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          primary_org_id?: string | null
          role?: string
          sub_department?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_table: {
        Row: {
          agent_commission: number | null
          agent_id: string | null
          agent_name: string | null
          base_rate: number | null
          bonus_rate: number | null
          broker_share: number | null
          calc_date: string | null
          commission_status: string | null
          created_at: string | null
          customer_name: string | null
          employee_commission: number | null
          employee_id: string | null
          employee_name: string | null
          id: string
          insurer_commission: number | null
          misp_id: string | null
          misp_name: string | null
          org_id: string | null
          policy_id: string | null
          policy_number: string | null
          premium: number | null
          product_type: string | null
          provider: string | null
          reporting_employee_commission: number | null
          reporting_employee_id: string | null
          reporting_employee_name: string | null
          reward_rate: number | null
          source_type: string | null
          total_rate: number | null
          updated_at: string | null
        }
        Insert: {
          agent_commission?: number | null
          agent_id?: string | null
          agent_name?: string | null
          base_rate?: number | null
          bonus_rate?: number | null
          broker_share?: number | null
          calc_date?: string | null
          commission_status?: string | null
          created_at?: string | null
          customer_name?: string | null
          employee_commission?: number | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          insurer_commission?: number | null
          misp_id?: string | null
          misp_name?: string | null
          org_id?: string | null
          policy_id?: string | null
          policy_number?: string | null
          premium?: number | null
          product_type?: string | null
          provider?: string | null
          reporting_employee_commission?: number | null
          reporting_employee_id?: string | null
          reporting_employee_name?: string | null
          reward_rate?: number | null
          source_type?: string | null
          total_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_commission?: number | null
          agent_id?: string | null
          agent_name?: string | null
          base_rate?: number | null
          bonus_rate?: number | null
          broker_share?: number | null
          calc_date?: string | null
          commission_status?: string | null
          created_at?: string | null
          customer_name?: string | null
          employee_commission?: number | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          insurer_commission?: number | null
          misp_id?: string | null
          misp_name?: string | null
          org_id?: string | null
          policy_id?: string | null
          policy_number?: string | null
          premium?: number | null
          product_type?: string | null
          provider?: string | null
          reporting_employee_commission?: number | null
          reporting_employee_id?: string | null
          reporting_employee_name?: string | null
          reward_rate?: number | null
          source_type?: string | null
          total_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          requested_plan_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          requested_plan_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          requested_plan_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_requests_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_upgrade_requests: {
        Row: {
          attachment_urls: string[] | null
          created_at: string | null
          created_by: string
          current_plan_id: string
          id: string
          justification: string | null
          org_id: string
          requested_plan_id: string
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string | null
          created_by: string
          current_plan_id: string
          id?: string
          justification?: string | null
          org_id: string
          requested_plan_id: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string | null
          created_by?: string
          current_plan_id?: string
          id?: string
          justification?: string | null
          org_id?: string
          requested_plan_id?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_upgrade_requests_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_upgrade_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_upgrade_requests_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          created_at: string | null
          end_date: string | null
          id: string
          org_id: string
          plan_id: string
          start_date: string
          status: string
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          org_id: string
          plan_id: string
          start_date?: string
          status: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          org_id?: string
          plan_id?: string
          start_date?: string
          status?: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          org_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          org_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          org_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          device: string | null
          id: number
          ip_address: string | null
          login_at: string | null
          logout_at: string | null
          session_token: string | null
          user_id: string | null
        }
        Insert: {
          device?: string | null
          id?: number
          ip_address?: string | null
          login_at?: string | null
          logout_at?: string | null
          session_token?: string | null
          user_id?: string | null
        }
        Update: {
          device?: string | null
          id?: number
          ip_address?: string | null
          login_at?: string | null
          logout_at?: string | null
          session_token?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          org_id: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          org_id?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          org_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_types: {
        Row: {
          code: string
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_type: string | null
          cc: number | null
          chassis_number: string | null
          created_at: string | null
          customer_id: string | null
          engine_number: string | null
          fuel_type: string | null
          id: string
          make: string | null
          manufacture_date: string | null
          model: string | null
          org_id: string
          permit_type: string | null
          registration_date: string | null
          registration_number: string | null
          updated_at: string | null
          variant: string | null
        }
        Insert: {
          body_type?: string | null
          cc?: number | null
          chassis_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          manufacture_date?: string | null
          model?: string | null
          org_id: string
          permit_type?: string | null
          registration_date?: string | null
          registration_number?: string | null
          updated_at?: string | null
          variant?: string | null
        }
        Update: {
          body_type?: string | null
          cc?: number | null
          chassis_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          manufacture_date?: string | null
          model?: string | null
          org_id?: string
          permit_type?: string | null
          registration_date?: string | null
          registration_number?: string | null
          updated_at?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_commission_amount: {
        Args: { policy_id_param: string }
        Returns: {
          calculation_status: string
          commission_amount: number
          commission_rate: number
          premium_base: number
          product_type: string
          reward_amount: number
          reward_rate: number
          total_amount: number
          total_rate: number
        }[]
      }
      calculate_commission_splits: {
        Args: { p_policy_id: string }
        Returns: {
          agent_commission: number
          broker_share: number
          employee_commission: number
          insurer_commission: number
          misp_commission: number
        }[]
      }
      calculate_comprehensive_commission_report: {
        Args: { p_org_id?: string; p_policy_id?: string }
        Returns: {
          agent_commission: number
          applied_tier_id: string
          base_rate: number
          bonus_rate: number
          broker_share: number
          calc_date: string
          employee_commission: number
          grid_id: string
          grid_table: string
          insurer_commission: number
          misp_commission: number
          plan_name: string
          policy_id: string
          policy_number: string
          product_category: string
          product_name: string
          provider: string
          reporting_employee_commission: number
          reward_rate: number
          source_type: string
          total_rate: number
          used_override: boolean
        }[]
      }
      calculate_comprehensive_commission_report_normalized: {
        Args: { p_org_id?: string; p_policy_id?: string }
        Returns: {
          agent_commission: number
          broker_share: number
          calc_date: string
          commission_rate: number
          employee_commission: number
          grid_id: string
          grid_table: string
          insurer_commission: number
          misp_commission: number
          plan_name: string
          policy_id: string
          policy_number: string
          product_category: string
          product_name: string
          provider: string
          reward_rate: number
          source_type: string
        }[]
      }
      calculate_enhanced_commission_distribution: {
        Args: { p_policy_id: string }
        Returns: {
          agent_commission_amount: number
          agent_commission_rate: number
          broker_share_amount: number
          broker_share_rate: number
          calc_date: string
          commission_status: string
          customer_name: string
          employee_commission_amount: number
          employee_commission_rate: number
          grid_source: string
          insurer_commission_amount: number
          insurer_commission_rate: number
          misp_commission_amount: number
          misp_commission_rate: number
          policy_id: string
          policy_number: string
          premium_amount: number
          product_type: string
          provider: string
          source_name: string
          source_type: string
        }[]
      }
      calculate_enhanced_commission_distribution_updated: {
        Args: { p_policy_id: string }
        Returns: {
          agent_commission_amount: number
          agent_commission_rate: number
          broker_share_amount: number
          broker_share_rate: number
          calc_date: string
          commission_rate: number
          commission_status: string
          customer_name: string
          employee_commission_amount: number
          employee_commission_rate: number
          grid_source: string
          insurer_commission_amount: number
          misp_commission_amount: number
          misp_commission_rate: number
          policy_id: string
          policy_number: string
          premium_amount: number
          product_type: string
          provider: string
          reward_rate: number
          source_name: string
          source_type: string
          total_commission_rate: number
        }[]
      }
      calculate_enhanced_comprehensive_commission_report: {
        Args: { p_org_id?: string; p_policy_id?: string }
        Returns: {
          agent_commission: number
          base_commission_rate: number
          bonus_commission_rate: number
          broker_share: number
          calc_date: string
          employee_commission: number
          grid_id: string
          grid_table: string
          insurer_commission: number
          misp_commission: number
          plan_name: string
          policy_id: string
          policy_number: string
          product_category: string
          product_name: string
          provider: string
          reporting_employee_commission: number
          reward_commission_rate: number
          source_type: string
          total_commission_rate: number
        }[]
      }
      calculate_policy_commission_enhanced: {
        Args: { p_policy_id: string }
        Returns: {
          agent_commission: number
          broker_share: number
          commission_rate: number
          commission_status: string
          employee_commission: number
          insurer_commission: number
          matched_grid_id: string
          misp_commission: number
          policy_id: string
        }[]
      }
      calculate_policy_commission_with_grids: {
        Args: { p_policy_id: string }
        Returns: {
          calculation_status: string
          commission_amount: number
          commission_rate: number
          matched_grid_id: string
          policy_id: string
        }[]
      }
      check_user_in_org: {
        Args: { check_org_id: string }
        Returns: boolean
      }
      get_commission: {
        Args: { p_policy_id: string }
        Returns: {
          commission_rate: number
          grid_id: string
          grid_table: string
          policy_id: string
          product_type: string
          reward_rate: number
          total_rate: number
        }[]
      }
      get_commission_distribution_report: {
        Args: {
          p_commission_status?: string
          p_date_from?: string
          p_date_to?: string
          p_org_id?: string
          p_product_type?: string
        }
        Returns: {
          agent_commission_amount: number
          agent_commission_rate: number
          broker_share_amount: number
          broker_share_rate: number
          calc_date: string
          commission_status: string
          customer_name: string
          employee_commission_amount: number
          employee_commission_rate: number
          grid_source: string
          insurer_commission_amount: number
          insurer_commission_rate: number
          misp_commission_amount: number
          misp_commission_rate: number
          policy_id: string
          policy_number: string
          premium_amount: number
          product_type: string
          provider: string
          source_name: string
          source_type: string
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          org_id: string | null
          primary_org_id: string | null
          role: string
          sub_department: string | null
          updated_at: string | null
        }
      }
      get_user_role_in_org: {
        Args: { organization_id: string; user_uuid: string }
        Returns: string
      }
      has_role: {
        Args: { _role: string }
        Returns: boolean
      }
      is_same_org: {
        Args: { _org_id: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_superadmin_by_email: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      manual_calculate_policy_commission: {
        Args: { p_policy_id: string }
        Returns: undefined
      }
      persist_policy_commission: {
        Args: { p_policy_id: string }
        Returns: undefined
      }
      recalculate_all_policy_commissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_all_policy_commissions_with_grids: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      save_policy_commission_enhanced: {
        Args: {
          p_agent_commission?: number
          p_broker_share?: number
          p_commission_rate?: number
          p_employee_commission?: number
          p_grid_id?: string
          p_insurer_commission: number
          p_misp_commission?: number
          p_policy_id: string
          p_status?: string
        }
        Returns: boolean
      }
      sync_comprehensive_commissions: {
        Args: { p_org_id?: string }
        Returns: undefined
      }
      sync_comprehensive_commissions_updated: {
        Args: { p_org_id?: string }
        Returns: undefined
      }
      sync_enhanced_comprehensive_commissions: {
        Args: { p_org_id?: string }
        Returns: undefined
      }
      sync_revenue_table: {
        Args: { p_org_id?: string }
        Returns: undefined
      }
      user_has_role_in_any_org: {
        Args: { check_role: string; user_uuid: string }
        Returns: boolean
      }
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
