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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agent_tiers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          aadhar_file_path: string | null
          aadhar_number: string | null
          agent_code: string
          agent_type: string | null
          branch_id: string | null
          commission_rate: number | null
          created_at: string
          email: string | null
          hire_date: string | null
          id: string
          irdai_cert_number: string | null
          irdai_certified: boolean | null
          irdai_file_path: string | null
          joining_date: string | null
          name: string
          pan_file_path: string | null
          pan_number: string | null
          phone: string | null
          referred_by_employee_id: string | null
          status: string | null
          tier_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aadhar_file_path?: string | null
          aadhar_number?: string | null
          agent_code: string
          agent_type?: string | null
          branch_id?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          hire_date?: string | null
          id?: string
          irdai_cert_number?: string | null
          irdai_certified?: boolean | null
          irdai_file_path?: string | null
          joining_date?: string | null
          name: string
          pan_file_path?: string | null
          pan_number?: string | null
          phone?: string | null
          referred_by_employee_id?: string | null
          status?: string | null
          tier_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aadhar_file_path?: string | null
          aadhar_number?: string | null
          agent_code?: string
          agent_type?: string | null
          branch_id?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          hire_date?: string | null
          id?: string
          irdai_cert_number?: string | null
          irdai_certified?: boolean | null
          irdai_file_path?: string | null
          joining_date?: string | null
          name?: string
          pan_file_path?: string | null
          pan_number?: string | null
          phone?: string | null
          referred_by_employee_id?: string | null
          status?: string | null
          tier_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agents_referred_by_employee"
            columns: ["referred_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agents_tier"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "agent_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          manager_name: string | null
          manager_phone: string | null
          name: string
          phone: string | null
          pincode: string | null
          state: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commercial_policies: {
        Row: {
          building_type: string | null
          business_type: string | null
          claims_history: string | null
          coverage_type: string | null
          created_at: string
          fire_safety_equipment: boolean | null
          id: string
          machinery_details: string | null
          number_of_employees: number | null
          policy_category: string | null
          policy_id: string
          proposer_details: Json | null
          risk_address: string | null
          risk_inspection_done: boolean | null
          sum_insured: number | null
          updated_at: string
        }
        Insert: {
          building_type?: string | null
          business_type?: string | null
          claims_history?: string | null
          coverage_type?: string | null
          created_at?: string
          fire_safety_equipment?: boolean | null
          id?: string
          machinery_details?: string | null
          number_of_employees?: number | null
          policy_category?: string | null
          policy_id: string
          proposer_details?: Json | null
          risk_address?: string | null
          risk_inspection_done?: boolean | null
          sum_insured?: number | null
          updated_at?: string
        }
        Update: {
          building_type?: string | null
          business_type?: string | null
          claims_history?: string | null
          coverage_type?: string | null
          created_at?: string
          fire_safety_equipment?: boolean | null
          id?: string
          machinery_details?: string | null
          number_of_employees?: number | null
          policy_category?: string | null
          policy_id?: string
          proposer_details?: Json | null
          risk_address?: string | null
          risk_inspection_done?: boolean | null
          sum_insured?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_commercial_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "fk_commercial_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commercial_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rule_tiers: {
        Row: {
          commission_rule_id: string
          commission_tier_id: string
          created_at: string
          id: string
        }
        Insert: {
          commission_rule_id: string
          commission_tier_id: string
          created_at?: string
          id?: string
        }
        Update: {
          commission_rule_id?: string
          commission_tier_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rule_tiers_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "active_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rule_tiers_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rule_tiers_commission_tier_id_fkey"
            columns: ["commission_tier_id"]
            isOneToOne: false
            referencedRelation: "commission_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          created_at: string
          description: string | null
          effective_from: string
          effective_to: string | null
          first_year_amount: number | null
          first_year_rate: number | null
          frequency: string | null
          id: string
          insurer_id: string
          is_active: boolean
          line_of_business: string
          product_id: string | null
          renewal_amount: number | null
          renewal_rate: number | null
          rule_type: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          first_year_amount?: number | null
          first_year_rate?: number | null
          frequency?: string | null
          id?: string
          insurer_id: string
          is_active?: boolean
          line_of_business: string
          product_id?: string | null
          renewal_amount?: number | null
          renewal_rate?: number | null
          rule_type: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          first_year_amount?: number | null
          first_year_rate?: number | null
          frequency?: string | null
          id?: string
          insurer_id?: string
          is_active?: boolean
          line_of_business?: string
          product_id?: string | null
          renewal_amount?: number | null
          renewal_rate?: number | null
          rule_type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          multiplier: number | null
          name: string
          override_rate: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          multiplier?: number | null
          name: string
          override_rate?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          multiplier?: number | null
          name?: string
          override_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          agent_id: string
          commission_amount: number
          commission_rate: number
          commission_type: string | null
          created_at: string
          id: string
          payment_date: string | null
          policy_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          commission_amount: number
          commission_rate: number
          commission_type?: string | null
          created_at?: string
          id?: string
          payment_date?: string | null
          policy_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          commission_amount?: number
          commission_rate?: number
          commission_type?: string | null
          created_at?: string
          id?: string
          payment_date?: string | null
          policy_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "commissions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          customer_code: string
          date_of_birth: string | null
          email: string | null
          gender: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_code: string
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_code?: string
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          employee_id: string
          has_login: boolean | null
          id: string
          id_proof_file_path: string | null
          joining_date: string
          name: string
          offer_letter_file_path: string | null
          phone: string | null
          resume_file_path: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          employee_id: string
          has_login?: boolean | null
          id?: string
          id_proof_file_path?: string | null
          joining_date?: string
          name: string
          offer_letter_file_path?: string | null
          phone?: string | null
          resume_file_path?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string
          has_login?: boolean | null
          id?: string
          id_proof_file_path?: string | null
          joining_date?: string
          name?: string
          offer_letter_file_path?: string | null
          phone?: string | null
          resume_file_path?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employees_branch_id"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      health_policies: {
        Row: {
          claim_history: string | null
          created_at: string
          critical_illness_cover: boolean | null
          deductible: number | null
          floater_or_individual: string | null
          id: string
          insured_persons: Json | null
          opd_cover: boolean | null
          payment_mode: string | null
          policy_id: string
          policy_term: number | null
          portability: boolean | null
          pre_existing_diseases: string[] | null
          proposer_name: string | null
          room_rent_limit: string | null
          sum_insured: number | null
          updated_at: string
          wellness_benefits: string[] | null
        }
        Insert: {
          claim_history?: string | null
          created_at?: string
          critical_illness_cover?: boolean | null
          deductible?: number | null
          floater_or_individual?: string | null
          id?: string
          insured_persons?: Json | null
          opd_cover?: boolean | null
          payment_mode?: string | null
          policy_id: string
          policy_term?: number | null
          portability?: boolean | null
          pre_existing_diseases?: string[] | null
          proposer_name?: string | null
          room_rent_limit?: string | null
          sum_insured?: number | null
          updated_at?: string
          wellness_benefits?: string[] | null
        }
        Update: {
          claim_history?: string | null
          created_at?: string
          critical_illness_cover?: boolean | null
          deductible?: number | null
          floater_or_individual?: string | null
          id?: string
          insured_persons?: Json | null
          opd_cover?: boolean | null
          payment_mode?: string | null
          policy_id?: string
          policy_term?: number | null
          portability?: boolean | null
          pre_existing_diseases?: string[] | null
          proposer_name?: string | null
          room_rent_limit?: string | null
          sum_insured?: number | null
          updated_at?: string
          wellness_benefits?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_health_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "fk_health_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_health_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_products: {
        Row: {
          api_mapping_key: string | null
          brochure_file_path: string | null
          category: string
          code: string
          coverage_type: string
          created_at: string
          description: string | null
          eligibility_criteria: string | null
          features: string[] | null
          id: string
          max_sum_insured: number
          min_sum_insured: number
          name: string
          premium_type: string
          provider_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          api_mapping_key?: string | null
          brochure_file_path?: string | null
          category: string
          code: string
          coverage_type: string
          created_at?: string
          description?: string | null
          eligibility_criteria?: string | null
          features?: string[] | null
          id?: string
          max_sum_insured: number
          min_sum_insured: number
          name: string
          premium_type: string
          provider_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          api_mapping_key?: string | null
          brochure_file_path?: string | null
          category?: string
          code?: string
          coverage_type?: string
          created_at?: string
          description?: string | null
          eligibility_criteria?: string | null
          features?: string[] | null
          id?: string
          max_sum_insured?: number
          min_sum_insured?: number
          name?: string
          premium_type?: string
          provider_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          contact_person: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          documents_folder: string | null
          id: string
          irdai_code: string
          phone_number: string | null
          provider_name: string
          provider_type: string
          status: string | null
          support_email: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          documents_folder?: string | null
          id?: string
          irdai_code: string
          phone_number?: string | null
          provider_name: string
          provider_type: string
          status?: string | null
          support_email?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          documents_folder?: string | null
          id?: string
          irdai_code?: string
          phone_number?: string | null
          provider_name?: string
          provider_type?: string
          status?: string | null
          support_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      life_policies: {
        Row: {
          created_at: string
          id: string
          life_assured_name: string | null
          medical_required: boolean | null
          nominee_name: string | null
          nominee_relation: string | null
          payment_frequency: string | null
          plan_type: string | null
          policy_id: string
          policy_mode: string | null
          policy_term: number | null
          premium_paying_term: number | null
          proposer_name: string | null
          relationship: string | null
          rider_options: string[] | null
          sum_assured: number | null
          underwriting_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          life_assured_name?: string | null
          medical_required?: boolean | null
          nominee_name?: string | null
          nominee_relation?: string | null
          payment_frequency?: string | null
          plan_type?: string | null
          policy_id: string
          policy_mode?: string | null
          policy_term?: number | null
          premium_paying_term?: number | null
          proposer_name?: string | null
          relationship?: string | null
          rider_options?: string[] | null
          sum_assured?: number | null
          underwriting_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          life_assured_name?: string | null
          medical_required?: boolean | null
          nominee_name?: string | null
          nominee_relation?: string | null
          payment_frequency?: string | null
          plan_type?: string | null
          policy_id?: string
          policy_mode?: string | null
          policy_term?: number | null
          premium_paying_term?: number | null
          proposer_name?: string | null
          relationship?: string | null
          rider_options?: string[] | null
          sum_assured?: number | null
          underwriting_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_life_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "fk_life_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_life_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      line_commission_configs: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          line_of_business: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          line_of_business: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          line_of_business?: string
          updated_at?: string
        }
        Relationships: []
      }
      motor_policies: {
        Row: {
          add_on_covers: string[] | null
          chassis_number: string | null
          created_at: string
          cubic_capacity: number | null
          engine_number: string | null
          fuel_type: string | null
          id: string
          idv: number | null
          is_break_in: boolean | null
          manufacturer: string | null
          model: string | null
          ncb_percent: number | null
          own_damage_premium: number | null
          policy_id: string
          previous_insurer: string | null
          previous_policy_number: string | null
          registration_number: string | null
          third_party_premium: number | null
          updated_at: string
          variant: string | null
          vehicle_age: number | null
          vehicle_type: string | null
        }
        Insert: {
          add_on_covers?: string[] | null
          chassis_number?: string | null
          created_at?: string
          cubic_capacity?: number | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          idv?: number | null
          is_break_in?: boolean | null
          manufacturer?: string | null
          model?: string | null
          ncb_percent?: number | null
          own_damage_premium?: number | null
          policy_id: string
          previous_insurer?: string | null
          previous_policy_number?: string | null
          registration_number?: string | null
          third_party_premium?: number | null
          updated_at?: string
          variant?: string | null
          vehicle_age?: number | null
          vehicle_type?: string | null
        }
        Update: {
          add_on_covers?: string[] | null
          chassis_number?: string | null
          created_at?: string
          cubic_capacity?: number | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          idv?: number | null
          is_break_in?: boolean | null
          manufacturer?: string | null
          model?: string | null
          ncb_percent?: number | null
          own_damage_premium?: number | null
          policy_id?: string
          previous_insurer?: string | null
          previous_policy_number?: string | null
          registration_number?: string | null
          third_party_premium?: number | null
          updated_at?: string
          variant?: string | null
          vehicle_age?: number | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_motor_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "fk_motor_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_motor_policy_id"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_transactions: {
        Row: {
          agent_id: string | null
          commission_rule_id: string | null
          created_at: string
          id: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payout_amount: number
          payout_date: string
          payout_id: string
          payout_status: Database["public"]["Enums"]["payout_status"]
          policy_id: string | null
          processed_by: string | null
          remarks: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          commission_rule_id?: string | null
          created_at?: string
          id?: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payout_amount: number
          payout_date: string
          payout_id?: string
          payout_status?: Database["public"]["Enums"]["payout_status"]
          policy_id?: string | null
          processed_by?: string | null
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          commission_rule_id?: string | null
          created_at?: string
          id?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payout_amount?: number
          payout_date?: string
          payout_id?: string
          payout_status?: Database["public"]["Enums"]["payout_status"]
          policy_id?: string | null
          processed_by?: string | null
          remarks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "payout_transactions_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "active_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_transactions_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "payout_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          agent_id: string
          branch_id: string
          created_at: string
          customer_id: string
          expiry_date: string
          id: string
          payment_frequency: string | null
          policy_number: string
          policy_type: string
          premium_amount: number
          product_name: string
          start_date: string
          status: string | null
          sum_assured: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          branch_id: string
          created_at?: string
          customer_id: string
          expiry_date: string
          id?: string
          payment_frequency?: string | null
          policy_number: string
          policy_type: string
          premium_amount: number
          product_name: string
          start_date: string
          status?: string | null
          sum_assured?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          branch_id?: string
          created_at?: string
          customer_id?: string
          expiry_date?: string
          id?: string
          payment_frequency?: string | null
          policy_number?: string
          policy_type?: string
          premium_amount?: number
          product_name?: string
          start_date?: string
          status?: string | null
          sum_assured?: number | null
          updated_at?: string
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
            foreignKeyName: "policies_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "policies_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      policies_new: {
        Row: {
          agent_id: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          created_by_type: Database["public"]["Enums"]["created_by_type"]
          employee_id: string | null
          id: string
          insurer_id: string
          line_of_business: string
          policy_end_date: string
          policy_mode: string | null
          policy_number: string
          policy_source: string | null
          policy_start_date: string
          policy_type: string | null
          premium_amount: number
          product_id: string
          remarks: string | null
          status: string | null
          sum_assured: number | null
          updated_at: string
          uploaded_document: string | null
        }
        Insert: {
          agent_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_type: Database["public"]["Enums"]["created_by_type"]
          employee_id?: string | null
          id?: string
          insurer_id: string
          line_of_business: string
          policy_end_date: string
          policy_mode?: string | null
          policy_number: string
          policy_source?: string | null
          policy_start_date: string
          policy_type?: string | null
          premium_amount: number
          product_id: string
          remarks?: string | null
          status?: string | null
          sum_assured?: number | null
          updated_at?: string
          uploaded_document?: string | null
        }
        Update: {
          agent_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_type?: Database["public"]["Enums"]["created_by_type"]
          employee_id?: string | null
          id?: string
          insurer_id?: string
          line_of_business?: string
          policy_end_date?: string
          policy_mode?: string | null
          policy_number?: string
          policy_source?: string | null
          policy_start_date?: string
          policy_type?: string | null
          premium_amount?: number
          product_id?: string
          remarks?: string | null
          status?: string | null
          sum_assured?: number | null
          updated_at?: string
          uploaded_document?: string | null
        }
        Relationships: []
      }
      policy_renewal_logs: {
        Row: {
          action: string
          id: string
          notes: string | null
          performed_by: string | null
          renewal_id: string
          timestamp: string
        }
        Insert: {
          action: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          renewal_id: string
          timestamp?: string
        }
        Update: {
          action?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          renewal_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_renewal_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewal_logs_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "policy_renewals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewal_logs_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_renewals: {
        Row: {
          agent_id: string | null
          auto_created_renewal_policy_id: string | null
          branch_id: string | null
          created_at: string
          customer_name: string
          employee_id: string | null
          follow_up_date: string | null
          id: string
          insurer_id: string | null
          original_expiry_date: string
          policy_id: string
          product_id: string | null
          remarks: string | null
          renewal_due_date: string
          renewal_reminder_sent: boolean | null
          renewal_status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          auto_created_renewal_policy_id?: string | null
          branch_id?: string | null
          created_at?: string
          customer_name: string
          employee_id?: string | null
          follow_up_date?: string | null
          id?: string
          insurer_id?: string | null
          original_expiry_date: string
          policy_id: string
          product_id?: string | null
          remarks?: string | null
          renewal_due_date?: string
          renewal_reminder_sent?: boolean | null
          renewal_status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          auto_created_renewal_policy_id?: string | null
          branch_id?: string | null
          created_at?: string
          customer_name?: string
          employee_id?: string | null
          follow_up_date?: string | null
          id?: string
          insurer_id?: string | null
          original_expiry_date?: string
          policy_id?: string
          product_id?: string | null
          remarks?: string | null
          renewal_due_date?: string
          renewal_reminder_sent?: boolean | null
          renewal_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_renewals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "policy_renewals_auto_created_renewal_policy_id_fkey"
            columns: ["auto_created_renewal_policy_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_auto_created_renewal_policy_id_fkey"
            columns: ["auto_created_renewal_policy_id"]
            isOneToOne: false
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_auto_created_renewal_policy_id_fkey"
            columns: ["auto_created_renewal_policy_id"]
            isOneToOne: false
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_conditions: {
        Row: {
          attribute: string
          commission_rule_id: string
          created_at: string
          id: string
          operator: string
          updated_at: string
          value: string
        }
        Insert: {
          attribute: string
          commission_rule_id: string
          created_at?: string
          id?: string
          operator: string
          updated_at?: string
          value: string
        }
        Update: {
          attribute?: string
          commission_rule_id?: string
          created_at?: string
          id?: string
          operator?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_conditions_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "active_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_conditions_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_ranges: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          commission_rule_id: string
          created_at: string
          description: string | null
          id: string
          max_value: number | null
          min_value: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          commission_rule_id: string
          created_at?: string
          description?: string | null
          id?: string
          max_value?: number | null
          min_value: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          commission_rule_id?: string
          created_at?: string
          description?: string | null
          id?: string
          max_value?: number | null
          min_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_ranges_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "active_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_ranges_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      task_reminder_logs: {
        Row: {
          id: string
          message: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string
          status: Database["public"]["Enums"]["reminder_status"]
          task_id: string
          via: Database["public"]["Enums"]["reminder_via"]
        }
        Insert: {
          id?: string
          message?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string
          status: Database["public"]["Enums"]["reminder_status"]
          task_id: string
          via: Database["public"]["Enums"]["reminder_via"]
        }
        Update: {
          id?: string
          message?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["reminder_status"]
          task_id?: string
          via?: Database["public"]["Enums"]["reminder_via"]
        }
        Relationships: [
          {
            foreignKeyName: "task_reminder_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_reminder_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to_agent_id: string | null
          assigned_to_employee_id: string | null
          attachments: string[] | null
          created_at: string
          created_by_id: string | null
          description: string | null
          due_date: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          notification_sent: boolean | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          recurrence_end_date: string | null
          recurrence_pattern:
            | Database["public"]["Enums"]["recurrence_pattern"]
            | null
          related_id: string | null
          related_to: Database["public"]["Enums"]["task_related_to"] | null
          reminder_date_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_title: string
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          assigned_to_agent_id?: string | null
          assigned_to_employee_id?: string | null
          attachments?: string[] | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          notification_sent?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence_end_date?: string | null
          recurrence_pattern?:
            | Database["public"]["Enums"]["recurrence_pattern"]
            | null
          related_id?: string | null
          related_to?: Database["public"]["Enums"]["task_related_to"] | null
          reminder_date_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_title: string
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          assigned_to_agent_id?: string | null
          assigned_to_employee_id?: string | null
          attachments?: string[] | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          notification_sent?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence_end_date?: string | null
          recurrence_pattern?:
            | Database["public"]["Enums"]["recurrence_pattern"]
            | null
          related_id?: string | null
          related_to?: Database["public"]["Enums"]["task_related_to"] | null
          reminder_date_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_title?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_agent_id_fkey"
            columns: ["assigned_to_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_agent_id_fkey"
            columns: ["assigned_to_agent_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_employee_id_fkey"
            columns: ["assigned_to_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_payout_rules: {
        Row: {
          agent_tier_id: string
          agent_type: string
          commission_type: string
          commission_value: number
          created_at: string
          effective_from: string
          id: string
          product_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_tier_id: string
          agent_type: string
          commission_type?: string
          commission_value: number
          created_at?: string
          effective_from?: string
          id?: string
          product_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_tier_id?: string
          agent_type?: string
          commission_type?: string
          commission_value?: number
          created_at?: string
          effective_from?: string
          id?: string
          product_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tier_payout_rules_agent_tier"
            columns: ["agent_tier_id"]
            isOneToOne: false
            referencedRelation: "agent_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tier_payout_rules_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_history: {
        Row: {
          created_at: string
          entity_type: string
          error_report_path: string | null
          failure_count: number
          file_name: string
          id: string
          status: string
          success_count: number
          total_rows: number
          updated_at: string
          upload_datetime: string
          uploader_id: string | null
        }
        Insert: {
          created_at?: string
          entity_type: string
          error_report_path?: string | null
          failure_count?: number
          file_name: string
          id?: string
          status?: string
          success_count?: number
          total_rows?: number
          updated_at?: string
          upload_datetime?: string
          uploader_id?: string | null
        }
        Update: {
          created_at?: string
          entity_type?: string
          error_report_path?: string | null
          failure_count?: number
          file_name?: string
          id?: string
          status?: string
          success_count?: number
          total_rows?: number
          updated_at?: string
          upload_datetime?: string
          uploader_id?: string | null
        }
        Relationships: []
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
      users_auth: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_login: string | null
          otp_code: string | null
          otp_expires_at: string | null
          password_hash: string
          phone_number: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          otp_code?: string | null
          otp_expires_at?: string | null
          password_hash: string
          phone_number: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          otp_code?: string | null
          otp_expires_at?: string | null
          password_hash?: string
          phone_number?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_commission_rules: {
        Row: {
          created_at: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          first_year_amount: number | null
          first_year_rate: number | null
          frequency: string | null
          id: string | null
          insurer_id: string | null
          is_active: boolean | null
          line_of_business: string | null
          product_id: string | null
          product_name: string | null
          provider_name: string | null
          renewal_amount: number | null
          renewal_rate: number | null
          rule_type: string | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_reports: {
        Row: {
          agent_code: string | null
          agent_id: string | null
          agent_name: string | null
          agent_tier_name: string | null
          branch_name: string | null
          commission_amount: number | null
          created_at: string | null
          id: string | null
          insurer_name: string | null
          line_of_business: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"] | null
          payout_amount: number | null
          payout_date: string | null
          payout_id: string | null
          payout_status: Database["public"]["Enums"]["payout_status"] | null
          policy_id: string | null
          policy_number: string | null
          premium_amount: number | null
          processed_by_name: string | null
          product_name: string | null
          remarks: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      policies_with_details: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          branch_id: string | null
          branch_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_type: Database["public"]["Enums"]["created_by_type"] | null
          employee_id: string | null
          employee_name: string | null
          id: string | null
          insurer_id: string | null
          insurer_name: string | null
          line_of_business: string | null
          policy_end_date: string | null
          policy_mode: string | null
          policy_number: string | null
          policy_source: string | null
          policy_start_date: string | null
          policy_type: string | null
          premium_amount: number | null
          product_id: string | null
          product_name: string | null
          remarks: string | null
          status: string | null
          sum_assured: number | null
          updated_at: string | null
          uploaded_document: string | null
        }
        Relationships: []
      }
      renewals_with_details: {
        Row: {
          agent_code: string | null
          agent_id: string | null
          agent_name: string | null
          auto_created_renewal_policy_id: string | null
          branch_id: string | null
          branch_name: string | null
          created_at: string | null
          customer_name: string | null
          days_until_due: number | null
          employee_id: string | null
          employee_name: string | null
          follow_up_date: string | null
          id: string | null
          insurer_id: string | null
          insurer_name: string | null
          original_expiry_date: string | null
          policy_id: string | null
          policy_number: string | null
          premium_amount: number | null
          product_id: string | null
          product_name: string | null
          remarks: string | null
          renewal_due_date: string | null
          renewal_reminder_sent: boolean | null
          renewal_status: string | null
          updated_at: string | null
          urgency_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_renewals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "policy_renewals_auto_created_renewal_policy_id_fkey"
            columns: ["auto_created_renewal_policy_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_auto_created_renewal_policy_id_fkey"
            columns: ["auto_created_renewal_policy_id"]
            isOneToOne: false
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_auto_created_renewal_policy_id_fkey"
            columns: ["auto_created_renewal_policy_id"]
            isOneToOne: false
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_renewals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_with_details: {
        Row: {
          agent_code: string | null
          assigned_agent_name: string | null
          assigned_employee_name: string | null
          assigned_to_agent_id: string | null
          assigned_to_employee_id: string | null
          attachments: string[] | null
          created_at: string | null
          created_by_id: string | null
          created_by_name: string | null
          description: string | null
          due_date: string | null
          hours_until_due: number | null
          id: string | null
          is_recurring: boolean | null
          notes: string | null
          notification_sent: boolean | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          recurrence_end_date: string | null
          recurrence_pattern:
            | Database["public"]["Enums"]["recurrence_pattern"]
            | null
          related_id: string | null
          related_to: Database["public"]["Enums"]["task_related_to"] | null
          reminder_date_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_title: string | null
          task_type: Database["public"]["Enums"]["task_type"] | null
          updated_at: string | null
          urgency_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_agent_id_fkey"
            columns: ["assigned_to_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_agent_id_fkey"
            columns: ["assigned_to_agent_id"]
            isOneToOne: false
            referencedRelation: "payout_reports"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_employee_id_fkey"
            columns: ["assigned_to_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_previous_commission_rule_versions: {
        Args: {
          p_insurer_id: string
          p_product_id: string
          p_line_of_business: string
          p_new_effective_from: string
          p_exclude_rule_id?: string
        }
        Returns: number
      }
      check_commission_rule_overlap: {
        Args: {
          p_insurer_id: string
          p_product_id: string
          p_line_of_business: string
          p_effective_from: string
          p_effective_to: string
          p_rule_id?: string
        }
        Returns: {
          overlapping_rule_id: string
          overlapping_from: string
          overlapping_to: string
          overlapping_version: number
        }[]
      }
      get_active_commission_rules: {
        Args: {
          p_insurer_id: string
          p_product_id?: string
          p_line_of_business?: string
          p_agent_tier_id?: string
          p_check_date?: string
        }
        Returns: {
          rule_id: string
          insurer_id: string
          product_id: string
          line_of_business: string
          rule_type: string
          first_year_rate: number
          first_year_amount: number
          renewal_rate: number
          renewal_amount: number
          effective_from: string
          effective_to: string
          version: number
          frequency: string
        }[]
      }
      get_next_commission_rule_version: {
        Args: {
          p_insurer_id: string
          p_product_id: string
          p_line_of_business: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      update_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "manager" | "user"
      created_by_type: "Agent" | "Employee"
      payment_mode: "UPI" | "Bank Transfer" | "Cheque" | "Cash"
      payout_status: "Pending" | "Paid" | "Failed" | "On Hold"
      recurrence_pattern: "Daily" | "Weekly" | "Monthly"
      reminder_status: "Sent" | "Failed"
      reminder_via: "Email" | "SMS" | "In-app"
      task_priority: "Low" | "Medium" | "High"
      task_related_to:
        | "Lead"
        | "Policy"
        | "Renewal"
        | "Agent"
        | "Customer"
        | "Custom"
      task_status:
        | "Open"
        | "In Progress"
        | "Completed"
        | "Overdue"
        | "Cancelled"
      task_type:
        | "Call"
        | "Visit"
        | "Document Collection"
        | "Follow-up"
        | "Renewal"
        | "Payment Collection"
        | "Custom"
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
      app_role: ["admin", "agent", "manager", "user"],
      created_by_type: ["Agent", "Employee"],
      payment_mode: ["UPI", "Bank Transfer", "Cheque", "Cash"],
      payout_status: ["Pending", "Paid", "Failed", "On Hold"],
      recurrence_pattern: ["Daily", "Weekly", "Monthly"],
      reminder_status: ["Sent", "Failed"],
      reminder_via: ["Email", "SMS", "In-app"],
      task_priority: ["Low", "Medium", "High"],
      task_related_to: [
        "Lead",
        "Policy",
        "Renewal",
        "Agent",
        "Customer",
        "Custom",
      ],
      task_status: ["Open", "In Progress", "Completed", "Overdue", "Cancelled"],
      task_type: [
        "Call",
        "Visit",
        "Document Collection",
        "Follow-up",
        "Renewal",
        "Payment Collection",
        "Custom",
      ],
    },
  },
} as const
