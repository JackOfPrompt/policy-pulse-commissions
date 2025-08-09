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
      add_ons: {
        Row: {
          add_on_id: string
          add_on_name: string
          applicable_to: string[] | null
          approval_status: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          is_active: boolean | null
          is_mandatory: boolean | null
          pricing_type: string | null
          pricing_value: number | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          add_on_id?: string
          add_on_name: string
          applicable_to?: string[] | null
          approval_status?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          is_mandatory?: boolean | null
          pricing_type?: string | null
          pricing_value?: number | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          add_on_id?: string
          add_on_name?: string
          applicable_to?: string[] | null
          approval_status?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          is_mandatory?: boolean | null
          pricing_type?: string | null
          pricing_value?: number | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "add_ons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "add_ons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      agent_commission_mapping: {
        Row: {
          agent_id: string
          assigned_on: string | null
          is_active: boolean | null
          mapping_id: string
          product_id: string | null
          slab_id: string
          tenant_id: string
        }
        Insert: {
          agent_id: string
          assigned_on?: string | null
          is_active?: boolean | null
          mapping_id?: string
          product_id?: string | null
          slab_id: string
          tenant_id: string
        }
        Update: {
          agent_id?: string
          assigned_on?: string | null
          is_active?: boolean | null
          mapping_id?: string
          product_id?: string | null
          slab_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_commission_mapping_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_commission_mapping_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_commission_mapping_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "agent_commission_mapping_slab_id_fkey"
            columns: ["slab_id"]
            isOneToOne: false
            referencedRelation: "commission_slabs"
            referencedColumns: ["slab_id"]
          },
          {
            foreignKeyName: "agent_commission_mapping_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "agent_commission_mapping_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "agent_commission_mapping_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      agents: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          agent_code: string | null
          agent_id: string
          agent_type: string | null
          bank_account_details: Json | null
          branch_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          is_commission_eligible: boolean | null
          kyc_documents: Json | null
          kyc_verified: boolean | null
          license_number: string | null
          license_type: string | null
          license_valid_from: string | null
          license_valid_to: string | null
          linked_user_id: string | null
          pan_number: string | null
          payout_mode: string | null
          phone_number: string | null
          photo_url: string | null
          pincode: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          agent_code?: string | null
          agent_id?: string
          agent_type?: string | null
          bank_account_details?: Json | null
          branch_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          is_commission_eligible?: boolean | null
          kyc_documents?: Json | null
          kyc_verified?: boolean | null
          license_number?: string | null
          license_type?: string | null
          license_valid_from?: string | null
          license_valid_to?: string | null
          linked_user_id?: string | null
          pan_number?: string | null
          payout_mode?: string | null
          phone_number?: string | null
          photo_url?: string | null
          pincode?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          agent_code?: string | null
          agent_id?: string
          agent_type?: string | null
          bank_account_details?: Json | null
          branch_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          is_commission_eligible?: boolean | null
          kyc_documents?: Json | null
          kyc_verified?: boolean | null
          license_number?: string | null
          license_type?: string | null
          license_valid_from?: string | null
          license_valid_to?: string | null
          linked_user_id?: string | null
          pan_number?: string | null
          payout_mode?: string | null
          phone_number?: string | null
          photo_url?: string | null
          pincode?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "agents_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      audit_event_types: {
        Row: {
          action: string | null
          created_at: string | null
          description: string | null
          event_code: string | null
          event_type_id: string
          is_active: boolean | null
          is_visible_to_tenant: boolean | null
          module_name: string | null
          updated_at: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          description?: string | null
          event_code?: string | null
          event_type_id?: string
          is_active?: boolean | null
          is_visible_to_tenant?: boolean | null
          module_name?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          description?: string | null
          event_code?: string | null
          event_type_id?: string
          is_active?: boolean | null
          is_visible_to_tenant?: boolean | null
          module_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          event_type_id: string | null
          ip_address: unknown | null
          log_id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          session_id: string | null
          table_name: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          event_type_id?: string | null
          ip_address?: unknown | null
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          event_type_id?: string | null
          ip_address?: unknown | null
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "audit_event_types"
            referencedColumns: ["event_type_id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      branches: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          branch_code: string | null
          branch_id: string
          branch_name: string
          city: string | null
          contact_person: string | null
          created_at: string | null
          district: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          pincode: string | null
          region: string | null
          state: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          branch_code?: string | null
          branch_id?: string
          branch_name: string
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          pincode?: string | null
          region?: string | null
          state?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          branch_code?: string | null
          branch_id?: string
          branch_name?: string
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          pincode?: string | null
          region?: string | null
          state?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      channel_partners: {
        Row: {
          contact_email: string | null
          is_active: boolean | null
          joined_on: string | null
          partner_id: string
          partner_name: string
          phone: string | null
          tenant_id: string
        }
        Insert: {
          contact_email?: string | null
          is_active?: boolean | null
          joined_on?: string | null
          partner_id?: string
          partner_name: string
          phone?: string | null
          tenant_id: string
        }
        Update: {
          contact_email?: string | null
          is_active?: boolean | null
          joined_on?: string | null
          partner_id?: string
          partner_name?: string
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "channel_partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "channel_partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      claim_rules: {
        Row: {
          applicable_event: string | null
          claim_type: string | null
          condition_logic: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          is_blocking: boolean | null
          product_id: string
          rule_id: string
          rule_name: string
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicable_event?: string | null
          claim_type?: string | null
          condition_logic?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_blocking?: boolean | null
          product_id: string
          rule_id?: string
          rule_name: string
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicable_event?: string | null
          claim_type?: string | null
          condition_logic?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_blocking?: boolean | null
          product_id?: string
          rule_id?: string
          rule_name?: string
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "claim_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      claim_statuses: {
        Row: {
          created_at: string | null
          description: string | null
          is_active: boolean | null
          is_reopenable: boolean | null
          is_terminal: boolean | null
          sequence_order: number | null
          status_code: string
          status_id: string
          status_label: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          is_reopenable?: boolean | null
          is_terminal?: boolean | null
          sequence_order?: number | null
          status_code: string
          status_id?: string
          status_label: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          is_reopenable?: boolean | null
          is_terminal?: boolean | null
          sequence_order?: number | null
          status_code?: string
          status_id?: string
          status_label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      claims: {
        Row: {
          adjuster_id: string | null
          claim_amount: number | null
          claim_id: string
          claim_intimation_date: string | null
          claim_type: string | null
          created_at: string | null
          incident_date: string | null
          policy_id: string
          rejection_reason_id: string | null
          remarks: string | null
          reported_by: string | null
          settled_amount: number | null
          settled_date: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          adjuster_id?: string | null
          claim_amount?: number | null
          claim_id?: string
          claim_intimation_date?: string | null
          claim_type?: string | null
          created_at?: string | null
          incident_date?: string | null
          policy_id: string
          rejection_reason_id?: string | null
          remarks?: string | null
          reported_by?: string | null
          settled_amount?: number | null
          settled_date?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          adjuster_id?: string | null
          claim_amount?: number | null
          claim_id?: string
          claim_intimation_date?: string | null
          claim_type?: string | null
          created_at?: string | null
          incident_date?: string | null
          policy_id?: string
          rejection_reason_id?: string | null
          remarks?: string | null
          reported_by?: string | null
          settled_amount?: number | null
          settled_date?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_adjuster_id_fkey"
            columns: ["adjuster_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "claims_rejection_reason_id_fkey"
            columns: ["rejection_reason_id"]
            isOneToOne: false
            referencedRelation: "rejection_reasons"
            referencedColumns: ["reason_id"]
          },
          {
            foreignKeyName: "claims_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      commission_payout_splits: {
        Row: {
          net_payable: number | null
          payout_date: string | null
          payout_status: string | null
          recipient_id: string | null
          recipient_type: string | null
          split_amount: number | null
          split_id: string
          split_percentage: number | null
          tds_deducted: number | null
          txn_id: string
        }
        Insert: {
          net_payable?: number | null
          payout_date?: string | null
          payout_status?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          split_amount?: number | null
          split_id?: string
          split_percentage?: number | null
          tds_deducted?: number | null
          txn_id: string
        }
        Update: {
          net_payable?: number | null
          payout_date?: string | null
          payout_status?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          split_amount?: number | null
          split_id?: string
          split_percentage?: number | null
          tds_deducted?: number | null
          txn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payout_splits_txn_id_fkey"
            columns: ["txn_id"]
            isOneToOne: false
            referencedRelation: "commission_transactions"
            referencedColumns: ["txn_id"]
          },
        ]
      }
      commission_slab_rules: {
        Row: {
          commission_type: string | null
          commission_value: number | null
          insurance_product_id: string | null
          line_of_business_id: string | null
          max_premium_amount: number | null
          min_premium_amount: number | null
          policy_type_id: string | null
          rule_id: string
          slab_id: string
          valid_from: string | null
          valid_to: string | null
          vehicle_type_id: string | null
        }
        Insert: {
          commission_type?: string | null
          commission_value?: number | null
          insurance_product_id?: string | null
          line_of_business_id?: string | null
          max_premium_amount?: number | null
          min_premium_amount?: number | null
          policy_type_id?: string | null
          rule_id?: string
          slab_id: string
          valid_from?: string | null
          valid_to?: string | null
          vehicle_type_id?: string | null
        }
        Update: {
          commission_type?: string | null
          commission_value?: number | null
          insurance_product_id?: string | null
          line_of_business_id?: string | null
          max_premium_amount?: number | null
          min_premium_amount?: number | null
          policy_type_id?: string | null
          rule_id?: string
          slab_id?: string
          valid_from?: string | null
          valid_to?: string | null
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_slab_rules_insurance_product_id_fkey"
            columns: ["insurance_product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "commission_slab_rules_line_of_business_id_fkey"
            columns: ["line_of_business_id"]
            isOneToOne: false
            referencedRelation: "lines_of_business"
            referencedColumns: ["lob_id"]
          },
          {
            foreignKeyName: "commission_slab_rules_policy_type_id_fkey"
            columns: ["policy_type_id"]
            isOneToOne: false
            referencedRelation: "policy_types"
            referencedColumns: ["policy_type_id"]
          },
          {
            foreignKeyName: "commission_slab_rules_slab_id_fkey"
            columns: ["slab_id"]
            isOneToOne: false
            referencedRelation: "commission_slabs"
            referencedColumns: ["slab_id"]
          },
          {
            foreignKeyName: "commission_slab_rules_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["vehicle_type_id"]
          },
        ]
      }
      commission_slabs: {
        Row: {
          created_at: string | null
          description: string | null
          is_active: boolean | null
          name: string
          slab_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name: string
          slab_id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name?: string
          slab_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_slabs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "commission_slabs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "commission_slabs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      commission_transactions: {
        Row: {
          agent_id: string
          calculated_at: string | null
          commission_rate: number | null
          commission_value: number | null
          policy_id: string
          status: string | null
          txn_id: string
        }
        Insert: {
          agent_id: string
          calculated_at?: string | null
          commission_rate?: number | null
          commission_value?: number | null
          policy_id: string
          status?: string | null
          txn_id?: string
        }
        Update: {
          agent_id?: string
          calculated_at?: string | null
          commission_rate?: number | null
          commission_value?: number | null
          policy_id?: string
          status?: string | null
          txn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "commission_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "commission_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "commission_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "commission_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      coverage_types: {
        Row: {
          coverage_code: string
          coverage_id: string
          coverage_name: string
          created_at: string | null
          description: string | null
          is_mandatory: boolean | null
          lob_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          coverage_code: string
          coverage_id?: string
          coverage_name: string
          created_at?: string | null
          description?: string | null
          is_mandatory?: boolean | null
          lob_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          coverage_code?: string
          coverage_id?: string
          coverage_name?: string
          created_at?: string | null
          description?: string | null
          is_mandatory?: boolean | null
          lob_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_types_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lines_of_business"
            referencedColumns: ["lob_id"]
          },
        ]
      }
      customer_communications: {
        Row: {
          channel: string | null
          communication_id: string
          created_at: string | null
          customer_id: string
          delivered_at: string | null
          direction: string | null
          message_body: string | null
          read_at: string | null
          related_id: string | null
          related_module: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          tenant_id: string
        }
        Insert: {
          channel?: string | null
          communication_id?: string
          created_at?: string | null
          customer_id: string
          delivered_at?: string | null
          direction?: string | null
          message_body?: string | null
          read_at?: string | null
          related_id?: string | null
          related_module?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tenant_id: string
        }
        Update: {
          channel?: string | null
          communication_id?: string
          created_at?: string | null
          customer_id?: string
          delivered_at?: string | null
          direction?: string | null
          message_body?: string | null
          read_at?: string | null
          related_id?: string | null
          related_module?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customer_communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customer_communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      customers: {
        Row: {
          aadhaar_number: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string | null
          customer_id: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          is_active: boolean | null
          kyc_status: string | null
          last_name: string | null
          pan_number: string | null
          phone_number: string | null
          pincode: string | null
          state: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          customer_id?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          is_active?: boolean | null
          kyc_status?: string | null
          last_name?: string | null
          pan_number?: string | null
          phone_number?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          customer_id?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          is_active?: boolean | null
          kyc_status?: string | null
          last_name?: string | null
          pan_number?: string | null
          phone_number?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string | null
          department_id: string
          description: string | null
          head_user_id: string | null
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          department_id?: string
          description?: string | null
          head_user_id?: string | null
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          department_id?: string
          description?: string | null
          head_user_id?: string | null
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_user_id_fkey"
            columns: ["head_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      document_types: {
        Row: {
          applicable_products: string[] | null
          applicable_roles: string[] | null
          category: string | null
          created_at: string | null
          description: string | null
          document_type_id: string
          expires: boolean | null
          is_active: boolean | null
          is_mandatory: boolean | null
          max_file_size_mb: number | null
          name: string
          supported_formats: string[] | null
          updated_at: string | null
        }
        Insert: {
          applicable_products?: string[] | null
          applicable_roles?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          document_type_id?: string
          expires?: boolean | null
          is_active?: boolean | null
          is_mandatory?: boolean | null
          max_file_size_mb?: number | null
          name: string
          supported_formats?: string[] | null
          updated_at?: string | null
        }
        Update: {
          applicable_products?: string[] | null
          applicable_roles?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          document_type_id?: string
          expires?: boolean | null
          is_active?: boolean | null
          is_mandatory?: boolean | null
          max_file_size_mb?: number | null
          name?: string
          supported_formats?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      endorsement_events: {
        Row: {
          approved_by: string | null
          created_at: string | null
          effective_date: string | null
          endorsement_id: string
          endorsement_type: string | null
          new_values: Json | null
          old_values: Json | null
          policy_id: string
          reason: string | null
          requested_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          effective_date?: string | null
          endorsement_id?: string
          endorsement_type?: string | null
          new_values?: Json | null
          old_values?: Json | null
          policy_id: string
          reason?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          effective_date?: string | null
          endorsement_id?: string
          endorsement_type?: string | null
          new_values?: Json | null
          old_values?: Json | null
          policy_id?: string
          reason?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "endorsement_events_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "endorsement_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "endorsement_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "endorsement_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "endorsement_events_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      endorsement_requests: {
        Row: {
          created_at: string | null
          effective_date: string | null
          endorsement_id: string
          endorsement_type_id: string
          policy_id: string
          remarks: string | null
          requested_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          effective_date?: string | null
          endorsement_id?: string
          endorsement_type_id: string
          policy_id: string
          remarks?: string | null
          requested_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          effective_date?: string | null
          endorsement_id?: string
          endorsement_type_id?: string
          policy_id?: string
          remarks?: string | null
          requested_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "endorsement_requests_endorsement_type_id_fkey"
            columns: ["endorsement_type_id"]
            isOneToOne: false
            referencedRelation: "endorsement_types"
            referencedColumns: ["endorsement_type_id"]
          },
          {
            foreignKeyName: "endorsement_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "endorsement_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "endorsement_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "endorsement_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      endorsement_types: {
        Row: {
          allowed_policy_types: string[] | null
          applicable_lobs: string[] | null
          approval_required: boolean | null
          created_at: string | null
          description: string | null
          document_required: boolean | null
          endorsement_type_id: string
          is_pricing_impact: boolean | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_policy_types?: string[] | null
          applicable_lobs?: string[] | null
          approval_required?: boolean | null
          created_at?: string | null
          description?: string | null
          document_required?: boolean | null
          endorsement_type_id?: string
          is_pricing_impact?: boolean | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_policy_types?: string[] | null
          applicable_lobs?: string[] | null
          approval_required?: boolean | null
          created_at?: string | null
          description?: string | null
          document_required?: boolean | null
          endorsement_type_id?: string
          is_pricing_impact?: boolean | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          default_value: boolean | null
          description: string | null
          feature_id: string
          feature_key: string
          feature_name: string
          is_globally_enabled: boolean | null
          module_name: string | null
          requires_plan: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: boolean | null
          description?: string | null
          feature_id?: string
          feature_key: string
          feature_name: string
          is_globally_enabled?: boolean | null
          module_name?: string | null
          requires_plan?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: boolean | null
          description?: string | null
          feature_id?: string
          feature_key?: string
          feature_name?: string
          is_globally_enabled?: boolean | null
          module_name?: string | null
          requires_plan?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insurance_products: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          is_standard_product: boolean | null
          lob_id: string
          product_code: string | null
          product_id: string
          product_name: string
          product_type: string | null
          provider_id: string
          status: string | null
          supported_policy_types: string[] | null
          uin_code: string | null
          updated_at: string | null
          vehicle_types: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_standard_product?: boolean | null
          lob_id: string
          product_code?: string | null
          product_id?: string
          product_name: string
          product_type?: string | null
          provider_id: string
          status?: string | null
          supported_policy_types?: string[] | null
          uin_code?: string | null
          updated_at?: string | null
          vehicle_types?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_standard_product?: boolean | null
          lob_id?: string
          product_code?: string | null
          product_id?: string
          product_name?: string
          product_type?: string | null
          provider_id?: string
          status?: string | null
          supported_policy_types?: string[] | null
          uin_code?: string | null
          updated_at?: string | null
          vehicle_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "insurance_products_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lines_of_business"
            referencedColumns: ["lob_id"]
          },
          {
            foreignKeyName: "insurance_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          head_office_location: string | null
          insurer_name: string
          insurer_type: string | null
          irdai_registration_number: string | null
          lob_types: string[] | null
          logo_url: string | null
          onboarded_by: string | null
          phone_number: string | null
          provider_id: string
          status: string | null
          support_email: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          head_office_location?: string | null
          insurer_name: string
          insurer_type?: string | null
          irdai_registration_number?: string | null
          lob_types?: string[] | null
          logo_url?: string | null
          onboarded_by?: string | null
          phone_number?: string | null
          provider_id?: string
          status?: string | null
          support_email?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          head_office_location?: string | null
          insurer_name?: string
          insurer_type?: string | null
          irdai_registration_number?: string | null
          lob_types?: string[] | null
          logo_url?: string | null
          onboarded_by?: string | null
          phone_number?: string | null
          provider_id?: string
          status?: string | null
          support_email?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_providers_onboarded_by_fkey"
            columns: ["onboarded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lines_of_business: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          is_active: boolean | null
          lob_code: string
          lob_id: string
          lob_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          lob_code: string
          lob_id?: string
          lob_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          lob_code?: string
          lob_id?: string
          lob_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lines_of_business_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      login_roles: {
        Row: {
          created_at: string | null
          default_landing_page: string | null
          description: string | null
          is_editable: boolean | null
          is_tenant_level: boolean | null
          permissions_json: Json | null
          role_id: string
          role_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_landing_page?: string | null
          description?: string | null
          is_editable?: boolean | null
          is_tenant_level?: boolean | null
          permissions_json?: Json | null
          role_id?: string
          role_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_landing_page?: string | null
          description?: string | null
          is_editable?: boolean | null
          is_tenant_level?: boolean | null
          permissions_json?: Json | null
          role_id?: string
          role_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      master_addons: {
        Row: {
          addon_code: string | null
          addon_name: string
          addon_type: string | null
          applicable_age_max: number | null
          applicable_age_min: number | null
          base_premium: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_mandatory: boolean | null
          last_updated_by: string | null
          line_of_business: string
          premium_percentage: number | null
          source_file_name: string | null
          sum_insured_limit: number | null
          updated_at: string
        }
        Insert: {
          addon_code?: string | null
          addon_name: string
          addon_type?: string | null
          applicable_age_max?: number | null
          applicable_age_min?: number | null
          base_premium?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean | null
          last_updated_by?: string | null
          line_of_business: string
          premium_percentage?: number | null
          source_file_name?: string | null
          sum_insured_limit?: number | null
          updated_at?: string
        }
        Update: {
          addon_code?: string | null
          addon_name?: string
          addon_type?: string | null
          applicable_age_max?: number | null
          applicable_age_min?: number | null
          base_premium?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean | null
          last_updated_by?: string | null
          line_of_business?: string
          premium_percentage?: number | null
          source_file_name?: string | null
          sum_insured_limit?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      master_benefits: {
        Row: {
          benefit_amount: number | null
          benefit_code: string | null
          benefit_name: string
          benefit_percentage: number | null
          benefit_type: string | null
          coverage_limit: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_updated_by: string | null
          line_of_business: string
          source_file_name: string | null
          updated_at: string
        }
        Insert: {
          benefit_amount?: number | null
          benefit_code?: string | null
          benefit_name: string
          benefit_percentage?: number | null
          benefit_type?: string | null
          coverage_limit?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          line_of_business: string
          source_file_name?: string | null
          updated_at?: string
        }
        Update: {
          benefit_amount?: number | null
          benefit_code?: string | null
          benefit_name?: string
          benefit_percentage?: number | null
          benefit_type?: string | null
          coverage_limit?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          line_of_business?: string
          source_file_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      master_business_categories: {
        Row: {
          category_code: string | null
          category_name: string
          created_at: string
          created_by: string | null
          description: string | null
          hazard_class: string | null
          id: string
          industry_type: string | null
          is_active: boolean
          last_updated_by: string | null
          risk_category: string | null
          source_file_name: string | null
          updated_at: string
        }
        Insert: {
          category_code?: string | null
          category_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          hazard_class?: string | null
          id?: string
          industry_type?: string | null
          is_active?: boolean
          last_updated_by?: string | null
          risk_category?: string | null
          source_file_name?: string | null
          updated_at?: string
        }
        Update: {
          category_code?: string | null
          category_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          hazard_class?: string | null
          id?: string
          industry_type?: string | null
          is_active?: boolean
          last_updated_by?: string | null
          risk_category?: string | null
          source_file_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      master_cities: {
        Row: {
          city_name: string
          created_at: string
          created_by: string | null
          district: string | null
          id: string
          is_active: boolean
          last_updated_by: string | null
          pincode: string
          region: string | null
          source_file_name: string | null
          state_name: string
          tier: string | null
          updated_at: string
        }
        Insert: {
          city_name: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          pincode: string
          region?: string | null
          source_file_name?: string | null
          state_name: string
          tier?: string | null
          updated_at?: string
        }
        Update: {
          city_name?: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          pincode?: string
          region?: string | null
          source_file_name?: string | null
          state_name?: string
          tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      master_health_conditions: {
        Row: {
          category: string | null
          condition_code: string | null
          condition_name: string
          coverage_percentage: number | null
          created_at: string
          created_by: string | null
          description: string | null
          exclusion_period_months: number | null
          id: string
          is_active: boolean
          last_updated_by: string | null
          source_file_name: string | null
          updated_at: string
          waiting_period_months: number | null
        }
        Insert: {
          category?: string | null
          condition_code?: string | null
          condition_name: string
          coverage_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exclusion_period_months?: number | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          source_file_name?: string | null
          updated_at?: string
          waiting_period_months?: number | null
        }
        Update: {
          category?: string | null
          condition_code?: string | null
          condition_name?: string
          coverage_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exclusion_period_months?: number | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          source_file_name?: string | null
          updated_at?: string
          waiting_period_months?: number | null
        }
        Relationships: []
      }
      master_occupations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_updated_by: string | null
          loading_percentage: number | null
          occupation_category: string | null
          occupation_code: string | null
          occupation_name: string
          risk_class: string | null
          source_file_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          loading_percentage?: number | null
          occupation_category?: string | null
          occupation_code?: string | null
          occupation_name: string
          risk_class?: string | null
          source_file_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          loading_percentage?: number | null
          occupation_category?: string | null
          occupation_code?: string | null
          occupation_name?: string
          risk_class?: string | null
          source_file_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      master_premium_bands: {
        Row: {
          age_group_end: number | null
          age_group_start: number | null
          band_name: string
          base_premium: number | null
          created_at: string
          created_by: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_updated_by: string | null
          line_of_business: string
          premium_rate: number | null
          product_type: string | null
          source_file_name: string | null
          sum_insured_end: number | null
          sum_insured_start: number | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          age_group_end?: number | null
          age_group_start?: number | null
          band_name: string
          base_premium?: number | null
          created_at?: string
          created_by?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          line_of_business: string
          premium_rate?: number | null
          product_type?: string | null
          source_file_name?: string | null
          sum_insured_end?: number | null
          sum_insured_start?: number | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          age_group_end?: number | null
          age_group_start?: number | null
          band_name?: string
          base_premium?: number | null
          created_at?: string
          created_by?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          line_of_business?: string
          premium_rate?: number | null
          product_type?: string | null
          source_file_name?: string | null
          sum_insured_end?: number | null
          sum_insured_start?: number | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      master_relationship_types: {
        Row: {
          applicable_for: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_blood_relation: boolean | null
          last_updated_by: string | null
          relationship_code: string | null
          relationship_name: string
          source_file_name: string | null
          updated_at: string
        }
        Insert: {
          applicable_for?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_blood_relation?: boolean | null
          last_updated_by?: string | null
          relationship_code?: string | null
          relationship_name: string
          source_file_name?: string | null
          updated_at?: string
        }
        Update: {
          applicable_for?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_blood_relation?: boolean | null
          last_updated_by?: string | null
          relationship_code?: string | null
          relationship_name?: string
          source_file_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      master_uin_codes: {
        Row: {
          approval_date: string | null
          created_at: string
          created_by: string | null
          effective_date: string | null
          expiry_date: string | null
          filing_date: string | null
          id: string
          insurer_name: string
          is_active: boolean
          is_verified: boolean
          last_updated_by: string | null
          line_of_business: string
          product_name: string
          product_type: string | null
          source_file_name: string | null
          status: string
          uin_code: string
          updated_at: string
          version: number | null
        }
        Insert: {
          approval_date?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          filing_date?: string | null
          id?: string
          insurer_name: string
          is_active?: boolean
          is_verified?: boolean
          last_updated_by?: string | null
          line_of_business: string
          product_name: string
          product_type?: string | null
          source_file_name?: string | null
          status?: string
          uin_code: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          approval_date?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          filing_date?: string | null
          id?: string
          insurer_name?: string
          is_active?: boolean
          is_verified?: boolean
          last_updated_by?: string | null
          line_of_business?: string
          product_name?: string
          product_type?: string | null
          source_file_name?: string | null
          status?: string
          uin_code?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      master_vehicle_data: {
        Row: {
          abs_available: boolean | null
          airbags_count: number | null
          api_mapping_key: string | null
          body_type: string | null
          boot_space_litres: number | null
          created_at: string
          created_by: string | null
          cubic_capacity: number | null
          depreciation_rate: number | null
          ebd_available: boolean | null
          engine_capacity_litres: number | null
          esp_available: boolean | null
          ex_showroom_price: number | null
          fuel_tank_capacity: number | null
          fuel_type: string | null
          ground_clearance: number | null
          id: string
          idv_percentage: number | null
          is_active: boolean
          is_commercial_use: boolean | null
          isofix_available: boolean | null
          last_updated_by: string | null
          make: string
          manufacturing_year_end: number | null
          manufacturing_year_start: number | null
          max_gvw: number | null
          max_payload: number | null
          max_power_bhp: number | null
          max_torque_nm: number | null
          mileage_kmpl: number | null
          model: string
          ncap_rating: string | null
          provider_id: string | null
          provider_vehicle_code: string | null
          registration_type: string | null
          remarks: string | null
          reverse_camera: boolean | null
          reverse_sensors: boolean | null
          rto_applicable: string | null
          safety_rating: string | null
          seating_capacity: number | null
          source_file_name: string | null
          special_attributes: string | null
          tpms_available: boolean | null
          transmission_type: string | null
          turning_radius: number | null
          updated_at: string
          variant: string | null
          vehicle_category: string | null
          vehicle_type: string
          wheelbase: number | null
          zone_classification: string | null
        }
        Insert: {
          abs_available?: boolean | null
          airbags_count?: number | null
          api_mapping_key?: string | null
          body_type?: string | null
          boot_space_litres?: number | null
          created_at?: string
          created_by?: string | null
          cubic_capacity?: number | null
          depreciation_rate?: number | null
          ebd_available?: boolean | null
          engine_capacity_litres?: number | null
          esp_available?: boolean | null
          ex_showroom_price?: number | null
          fuel_tank_capacity?: number | null
          fuel_type?: string | null
          ground_clearance?: number | null
          id?: string
          idv_percentage?: number | null
          is_active?: boolean
          is_commercial_use?: boolean | null
          isofix_available?: boolean | null
          last_updated_by?: string | null
          make: string
          manufacturing_year_end?: number | null
          manufacturing_year_start?: number | null
          max_gvw?: number | null
          max_payload?: number | null
          max_power_bhp?: number | null
          max_torque_nm?: number | null
          mileage_kmpl?: number | null
          model: string
          ncap_rating?: string | null
          provider_id?: string | null
          provider_vehicle_code?: string | null
          registration_type?: string | null
          remarks?: string | null
          reverse_camera?: boolean | null
          reverse_sensors?: boolean | null
          rto_applicable?: string | null
          safety_rating?: string | null
          seating_capacity?: number | null
          source_file_name?: string | null
          special_attributes?: string | null
          tpms_available?: boolean | null
          transmission_type?: string | null
          turning_radius?: number | null
          updated_at?: string
          variant?: string | null
          vehicle_category?: string | null
          vehicle_type: string
          wheelbase?: number | null
          zone_classification?: string | null
        }
        Update: {
          abs_available?: boolean | null
          airbags_count?: number | null
          api_mapping_key?: string | null
          body_type?: string | null
          boot_space_litres?: number | null
          created_at?: string
          created_by?: string | null
          cubic_capacity?: number | null
          depreciation_rate?: number | null
          ebd_available?: boolean | null
          engine_capacity_litres?: number | null
          esp_available?: boolean | null
          ex_showroom_price?: number | null
          fuel_tank_capacity?: number | null
          fuel_type?: string | null
          ground_clearance?: number | null
          id?: string
          idv_percentage?: number | null
          is_active?: boolean
          is_commercial_use?: boolean | null
          isofix_available?: boolean | null
          last_updated_by?: string | null
          make?: string
          manufacturing_year_end?: number | null
          manufacturing_year_start?: number | null
          max_gvw?: number | null
          max_payload?: number | null
          max_power_bhp?: number | null
          max_torque_nm?: number | null
          mileage_kmpl?: number | null
          model?: string
          ncap_rating?: string | null
          provider_id?: string | null
          provider_vehicle_code?: string | null
          registration_type?: string | null
          remarks?: string | null
          reverse_camera?: boolean | null
          reverse_sensors?: boolean | null
          rto_applicable?: string | null
          safety_rating?: string | null
          seating_capacity?: number | null
          source_file_name?: string | null
          special_attributes?: string | null
          tpms_available?: boolean | null
          transmission_type?: string | null
          turning_radius?: number | null
          updated_at?: string
          variant?: string | null
          vehicle_category?: string | null
          vehicle_type?: string
          wheelbase?: number | null
          zone_classification?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string | null
          channel: string | null
          created_at: string | null
          created_by: string | null
          event_type: string | null
          is_active: boolean | null
          sms_template: string | null
          subject_template: string | null
          template_id: string
          template_name: string
          tenant_id: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          body_template?: string | null
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          event_type?: string | null
          is_active?: boolean | null
          sms_template?: string | null
          subject_template?: string | null
          template_id?: string
          template_name: string
          tenant_id?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          body_template?: string | null
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          event_type?: string | null
          is_active?: boolean | null
          sms_template?: string | null
          subject_template?: string | null
          template_id?: string
          template_name?: string
          tenant_id?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notification_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notification_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number | null
          body: string | null
          channel: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          notification_id: string
          recipient_email: string | null
          recipient_phone: string | null
          response_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          body?: string | null
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          notification_id?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          response_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          body?: string | null
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          notification_id?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          response_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      online_policies: {
        Row: {
          agent_id: string | null
          cancellation_reason: string | null
          coverage_type_id: string | null
          created_at: string | null
          customer_id: string
          discount_amount: number | null
          documents_uploaded: boolean | null
          insured_person: Json | null
          nominee_details: Json | null
          payment_id: string | null
          payment_status: string | null
          pdf_url: string | null
          plan_type: string | null
          policy_end_date: string
          policy_id: string
          policy_number: string | null
          policy_start_date: string
          premium_amount: number | null
          product_id: string
          purchase_channel: string | null
          purchase_date: string | null
          status: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          uin_code: string | null
          updated_at: string | null
          vehicle_details: Json | null
          vehicle_type_id: string | null
        }
        Insert: {
          agent_id?: string | null
          cancellation_reason?: string | null
          coverage_type_id?: string | null
          created_at?: string | null
          customer_id: string
          discount_amount?: number | null
          documents_uploaded?: boolean | null
          insured_person?: Json | null
          nominee_details?: Json | null
          payment_id?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          plan_type?: string | null
          policy_end_date: string
          policy_id?: string
          policy_number?: string | null
          policy_start_date: string
          premium_amount?: number | null
          product_id: string
          purchase_channel?: string | null
          purchase_date?: string | null
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          uin_code?: string | null
          updated_at?: string | null
          vehicle_details?: Json | null
          vehicle_type_id?: string | null
        }
        Update: {
          agent_id?: string | null
          cancellation_reason?: string | null
          coverage_type_id?: string | null
          created_at?: string | null
          customer_id?: string
          discount_amount?: number | null
          documents_uploaded?: boolean | null
          insured_person?: Json | null
          nominee_details?: Json | null
          payment_id?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          plan_type?: string | null
          policy_end_date?: string
          policy_id?: string
          policy_number?: string | null
          policy_start_date?: string
          premium_amount?: number | null
          product_id?: string
          purchase_channel?: string | null
          purchase_date?: string | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          uin_code?: string | null
          updated_at?: string | null
          vehicle_details?: Json | null
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "online_policies_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "online_policies_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "online_policies_coverage_type_id_fkey"
            columns: ["coverage_type_id"]
            isOneToOne: false
            referencedRelation: "coverage_types"
            referencedColumns: ["coverage_id"]
          },
          {
            foreignKeyName: "online_policies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "online_policies_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "policy_payments"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "online_policies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "online_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "online_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "online_policies_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["vehicle_type_id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          api_key: string | null
          api_secret: string | null
          created_at: string | null
          gateway_id: string
          mode: string | null
          name: string
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string | null
          gateway_id?: string
          mode?: string | null
          name: string
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string | null
          gateway_id?: string
          mode?: string | null
          name?: string
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          customer_id: string | null
          error_message: string | null
          gateway_id: string
          gateway_response: Json | null
          gateway_transaction_id: string | null
          payment_date: string | null
          payment_method: string | null
          policy_id: string | null
          status: string | null
          subscription_id: string | null
          tenant_id: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          error_message?: string | null
          gateway_id: string
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          policy_id?: string | null
          status?: string | null
          subscription_id?: string | null
          tenant_id: string
          transaction_id?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          error_message?: string | null
          gateway_id?: string
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          policy_id?: string | null
          status?: string | null
          subscription_id?: string | null
          tenant_id?: string
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["gateway_id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          error_log: string | null
          event_payload: Json | null
          event_type: string | null
          gateway_id: string
          linked_transaction_id: string | null
          processed_status: boolean | null
          received_at: string | null
          webhook_id: string
        }
        Insert: {
          error_log?: string | null
          event_payload?: Json | null
          event_type?: string | null
          gateway_id: string
          linked_transaction_id?: string | null
          processed_status?: boolean | null
          received_at?: string | null
          webhook_id?: string
        }
        Update: {
          error_log?: string | null
          event_payload?: Json | null
          event_type?: string | null
          gateway_id?: string
          linked_transaction_id?: string | null
          processed_status?: boolean | null
          received_at?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["gateway_id"]
          },
          {
            foreignKeyName: "payment_webhook_events_linked_transaction_id_fkey"
            columns: ["linked_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      pincode_data: {
        Row: {
          area_type: string | null
          city_name: string | null
          created_at: string | null
          district_name: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          pincode: string
          pincode_id: string
          region: string | null
          state_name: string | null
          updated_at: string | null
          zone_classification: string | null
        }
        Insert: {
          area_type?: string | null
          city_name?: string | null
          created_at?: string | null
          district_name?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          pincode: string
          pincode_id?: string
          region?: string | null
          state_name?: string | null
          updated_at?: string | null
          zone_classification?: string | null
        }
        Update: {
          area_type?: string | null
          city_name?: string | null
          created_at?: string | null
          district_name?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          pincode?: string
          pincode_id?: string
          region?: string | null
          state_name?: string | null
          updated_at?: string | null
          zone_classification?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          discount_amount: number | null
          end_date: string
          gst_amount: number | null
          issued_on: string | null
          net_premium: number | null
          payment_mode: string | null
          policy_id: string
          policy_number: string | null
          policy_source: string | null
          policy_type_id: string | null
          premium_amount: number | null
          product_id: string
          start_date: string
          status: string | null
          tenant_id: string
          uin_code: string | null
          vehicle_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          discount_amount?: number | null
          end_date: string
          gst_amount?: number | null
          issued_on?: string | null
          net_premium?: number | null
          payment_mode?: string | null
          policy_id?: string
          policy_number?: string | null
          policy_source?: string | null
          policy_type_id?: string | null
          premium_amount?: number | null
          product_id: string
          start_date: string
          status?: string | null
          tenant_id: string
          uin_code?: string | null
          vehicle_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          discount_amount?: number | null
          end_date?: string
          gst_amount?: number | null
          issued_on?: string | null
          net_premium?: number | null
          payment_mode?: string | null
          policy_id?: string
          policy_number?: string | null
          policy_source?: string | null
          policy_type_id?: string | null
          premium_amount?: number | null
          product_id?: string
          start_date?: string
          status?: string | null
          tenant_id?: string
          uin_code?: string | null
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "policies_policy_type_id_fkey"
            columns: ["policy_type_id"]
            isOneToOne: false
            referencedRelation: "policy_types"
            referencedColumns: ["policy_type_id"]
          },
          {
            foreignKeyName: "policies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policies_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["vehicle_type_id"]
          },
        ]
      }
      policy_addons: {
        Row: {
          addon_id: string
          addon_type: string | null
          amount: number | null
          policy_id: string
        }
        Insert: {
          addon_id?: string
          addon_type?: string | null
          amount?: number | null
          policy_id: string
        }
        Update: {
          addon_id?: string
          addon_type?: string | null
          amount?: number | null
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_addons_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_addons_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_addons_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      policy_contacts: {
        Row: {
          contact_id: string
          contact_type: string | null
          dob: string | null
          email: string | null
          gender: string | null
          name: string | null
          phone: string | null
          policy_id: string
          relation: string | null
        }
        Insert: {
          contact_id?: string
          contact_type?: string | null
          dob?: string | null
          email?: string | null
          gender?: string | null
          name?: string | null
          phone?: string | null
          policy_id: string
          relation?: string | null
        }
        Update: {
          contact_id?: string
          contact_type?: string | null
          dob?: string | null
          email?: string | null
          gender?: string | null
          name?: string | null
          phone?: string | null
          policy_id?: string
          relation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_contacts_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_contacts_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_contacts_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      policy_document_uploads: {
        Row: {
          document_id: string
          document_type_id: string
          file_url: string | null
          policy_id: string
          remarks: string | null
          tenant_id: string
          uploaded_by: string | null
          uploaded_on: string | null
          verified: boolean | null
          verified_by: string | null
          verified_on: string | null
        }
        Insert: {
          document_id?: string
          document_type_id: string
          file_url?: string | null
          policy_id: string
          remarks?: string | null
          tenant_id: string
          uploaded_by?: string | null
          uploaded_on?: string | null
          verified?: boolean | null
          verified_by?: string | null
          verified_on?: string | null
        }
        Update: {
          document_id?: string
          document_type_id?: string
          file_url?: string | null
          policy_id?: string
          remarks?: string | null
          tenant_id?: string
          uploaded_by?: string | null
          uploaded_on?: string | null
          verified?: boolean | null
          verified_by?: string | null
          verified_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_document_uploads_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["document_type_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policy_document_uploads_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      policy_documents: {
        Row: {
          doc_id: string
          doc_type_id: string
          file_url: string | null
          policy_id: string
          uploaded_at: string | null
        }
        Insert: {
          doc_id?: string
          doc_type_id: string
          file_url?: string | null
          policy_id: string
          uploaded_at?: string | null
        }
        Update: {
          doc_id?: string
          doc_type_id?: string
          file_url?: string | null
          policy_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_documents_doc_type_id_fkey"
            columns: ["doc_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["document_type_id"]
          },
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      policy_fulfillments: {
        Row: {
          document_type: string | null
          download_count: number | null
          expires_on: string | null
          file_url: string | null
          fulfillment_id: string
          is_signed: boolean | null
          issued_by: string | null
          issued_on: string | null
          last_downloaded: string | null
          policy_id: string
          tenant_id: string
        }
        Insert: {
          document_type?: string | null
          download_count?: number | null
          expires_on?: string | null
          file_url?: string | null
          fulfillment_id?: string
          is_signed?: boolean | null
          issued_by?: string | null
          issued_on?: string | null
          last_downloaded?: string | null
          policy_id: string
          tenant_id: string
        }
        Update: {
          document_type?: string | null
          download_count?: number | null
          expires_on?: string | null
          file_url?: string | null
          fulfillment_id?: string
          is_signed?: boolean | null
          issued_by?: string | null
          issued_on?: string | null
          last_downloaded?: string | null
          policy_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_fulfillments_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policy_fulfillments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_fulfillments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_fulfillments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_fulfillments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_fulfillments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_fulfillments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      policy_payments: {
        Row: {
          addon_charges: number | null
          amount_paid: number
          base_premium: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          discount_amount: number | null
          gst_amount: number | null
          invoice_number: string | null
          is_policy_refund: boolean | null
          is_renewal_payment: boolean | null
          payer_entity_id: string | null
          payer_type: string | null
          payment_gateway: string | null
          payment_id: string
          payment_mode: string | null
          payment_reference: string | null
          policy_id: string
          receipt_url: string | null
          remarks: string | null
          tenant_id: string
          transaction_date: string | null
          transaction_status: string | null
          updated_at: string | null
        }
        Insert: {
          addon_charges?: number | null
          amount_paid: number
          base_premium?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          discount_amount?: number | null
          gst_amount?: number | null
          invoice_number?: string | null
          is_policy_refund?: boolean | null
          is_renewal_payment?: boolean | null
          payer_entity_id?: string | null
          payer_type?: string | null
          payment_gateway?: string | null
          payment_id?: string
          payment_mode?: string | null
          payment_reference?: string | null
          policy_id: string
          receipt_url?: string | null
          remarks?: string | null
          tenant_id: string
          transaction_date?: string | null
          transaction_status?: string | null
          updated_at?: string | null
        }
        Update: {
          addon_charges?: number | null
          amount_paid?: number
          base_premium?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          discount_amount?: number | null
          gst_amount?: number | null
          invoice_number?: string | null
          is_policy_refund?: boolean | null
          is_renewal_payment?: boolean | null
          payer_entity_id?: string | null
          payer_type?: string | null
          payment_gateway?: string | null
          payment_id?: string
          payment_mode?: string | null
          payment_reference?: string | null
          policy_id?: string
          receipt_url?: string | null
          remarks?: string | null
          tenant_id?: string
          transaction_date?: string | null
          transaction_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policy_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "policy_payments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_payments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_payments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      policy_refunds: {
        Row: {
          amount: number | null
          payment_id: string | null
          policy_id: string
          processed_by: string | null
          processed_date: string | null
          reference_number: string | null
          refund_id: string
          refund_method: string | null
          refund_reason: string | null
          remarks: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          payment_id?: string | null
          policy_id: string
          processed_by?: string | null
          processed_date?: string | null
          reference_number?: string | null
          refund_id?: string
          refund_method?: string | null
          refund_reason?: string | null
          remarks?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          payment_id?: string | null
          policy_id?: string
          processed_by?: string | null
          processed_date?: string | null
          reference_number?: string | null
          refund_id?: string
          refund_method?: string | null
          refund_reason?: string | null
          remarks?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "policy_payments"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "policy_refunds_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_refunds_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_refunds_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      policy_renewals: {
        Row: {
          created_at: string | null
          customer_id: string
          due_date: string | null
          initiated_by: string | null
          original_policy_id: string
          payment_id: string | null
          payment_status: string | null
          reminder_count: number | null
          reminder_sent: boolean | null
          renewal_id: string
          renewal_mode: string | null
          renewal_status: string | null
          renewal_type: string | null
          renewed_policy_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          due_date?: string | null
          initiated_by?: string | null
          original_policy_id: string
          payment_id?: string | null
          payment_status?: string | null
          reminder_count?: number | null
          reminder_sent?: boolean | null
          renewal_id?: string
          renewal_mode?: string | null
          renewal_status?: string | null
          renewal_type?: string | null
          renewed_policy_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          due_date?: string | null
          initiated_by?: string | null
          original_policy_id?: string
          payment_id?: string | null
          payment_status?: string | null
          reminder_count?: number | null
          reminder_sent?: boolean | null
          renewal_id?: string
          renewal_mode?: string | null
          renewal_status?: string | null
          renewal_type?: string | null
          renewed_policy_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_renewals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "policy_renewals_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policy_renewals_original_policy_id_fkey"
            columns: ["original_policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_original_policy_id_fkey"
            columns: ["original_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_original_policy_id_fkey"
            columns: ["original_policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "policy_payments"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "policy_renewals_renewed_policy_id_fkey"
            columns: ["renewed_policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_renewed_policy_id_fkey"
            columns: ["renewed_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_renewed_policy_id_fkey"
            columns: ["renewed_policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_renewals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_renewals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      policy_transactions: {
        Row: {
          created_at: string | null
          event_date: string | null
          metadata: Json | null
          performed_by: string | null
          policy_id: string
          remarks: string | null
          status: string | null
          tenant_id: string
          transaction_id: string
          transaction_type: string | null
          trigger_source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_date?: string | null
          metadata?: Json | null
          performed_by?: string | null
          policy_id: string
          remarks?: string | null
          status?: string | null
          tenant_id: string
          transaction_id?: string
          transaction_type?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_date?: string | null
          metadata?: Json | null
          performed_by?: string | null
          policy_id?: string
          remarks?: string | null
          status?: string | null
          tenant_id?: string
          transaction_id?: string
          transaction_type?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policy_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_transactions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policy_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      policy_types: {
        Row: {
          created_at: string | null
          description: string | null
          is_default: boolean | null
          lob_id: string
          policy_code: string
          policy_name: string
          policy_type_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_default?: boolean | null
          lob_id: string
          policy_code: string
          policy_name: string
          policy_type_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_default?: boolean | null
          lob_id?: string
          policy_code?: string
          policy_name?: string
          policy_type_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_types_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lines_of_business"
            referencedColumns: ["lob_id"]
          },
        ]
      }
      premium_calculation_rules: {
        Row: {
          approval_status: string | null
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          effective_to: string | null
          formula_expression: string | null
          input_parameters: Json | null
          is_active: boolean | null
          output_field: string | null
          product_id: string
          rule_id: string
          rule_name: string
          rule_type: string | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          formula_expression?: string | null
          input_parameters?: Json | null
          is_active?: boolean | null
          output_field?: string | null
          product_id: string
          rule_id?: string
          rule_name: string
          rule_type?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          formula_expression?: string | null
          input_parameters?: Json | null
          is_active?: boolean | null
          output_field?: string | null
          product_id?: string
          rule_id?: string
          rule_name?: string
          rule_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_calculation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "premium_calculation_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_features: {
        Row: {
          applicable_lob: string | null
          applicable_vehicle_types: string[] | null
          created_at: string | null
          default_enabled: boolean | null
          description: string | null
          feature_id: string
          is_optional: boolean | null
          name: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          applicable_lob?: string | null
          applicable_vehicle_types?: string[] | null
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          feature_id?: string
          is_optional?: boolean | null
          name: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          applicable_lob?: string | null
          applicable_vehicle_types?: string[] | null
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          feature_id?: string
          is_optional?: boolean | null
          name?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      rate_cards: {
        Row: {
          addons_json: Json | null
          approval_date: string | null
          approved_by: string | null
          base_premium_rate: number | null
          commission_rate: number | null
          created_at: string | null
          created_by: string | null
          is_active: boolean | null
          personal_accident_cover: number | null
          product_id: string
          rate_card_id: string
          region: string | null
          remarks: string | null
          status: string | null
          third_party_premium: number | null
          updated_at: string | null
          valid_from: string
          valid_to: string | null
          vehicle_type_id: string | null
          version: number | null
          zone: string | null
        }
        Insert: {
          addons_json?: Json | null
          approval_date?: string | null
          approved_by?: string | null
          base_premium_rate?: number | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          is_active?: boolean | null
          personal_accident_cover?: number | null
          product_id: string
          rate_card_id?: string
          region?: string | null
          remarks?: string | null
          status?: string | null
          third_party_premium?: number | null
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
          vehicle_type_id?: string | null
          version?: number | null
          zone?: string | null
        }
        Update: {
          addons_json?: Json | null
          approval_date?: string | null
          approved_by?: string | null
          base_premium_rate?: number | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          is_active?: boolean | null
          personal_accident_cover?: number | null
          product_id?: string
          rate_card_id?: string
          region?: string | null
          remarks?: string | null
          status?: string | null
          third_party_premium?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
          vehicle_type_id?: string | null
          version?: number | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_cards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rate_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rate_cards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "rate_cards_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["vehicle_type_id"]
          },
        ]
      }
      rejection_reasons: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          is_active: boolean | null
          is_customer_visible: boolean | null
          reason_code: string | null
          reason_id: string
          reason_title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          is_customer_visible?: boolean | null
          reason_code?: string | null
          reason_id?: string
          reason_title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          is_customer_visible?: boolean | null
          reason_code?: string | null
          reason_id?: string
          reason_title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rejection_reasons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number | null
          api_access: boolean | null
          available_add_ons: Json | null
          created_at: string | null
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
          monthly_price: number | null
          plan_code: string
          plan_id: string
          plan_name: string
          regional_prices: Json | null
          reporting_tools: boolean | null
          support_level: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          annual_price?: number | null
          api_access?: boolean | null
          available_add_ons?: Json | null
          created_at?: string | null
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
          monthly_price?: number | null
          plan_code: string
          plan_id?: string
          plan_name: string
          regional_prices?: Json | null
          reporting_tools?: boolean | null
          support_level?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_price?: number | null
          api_access?: boolean | null
          available_add_ons?: Json | null
          created_at?: string | null
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
          monthly_price?: number | null
          plan_code?: string
          plan_id?: string
          plan_name?: string
          regional_prices?: Json | null
          reporting_tools?: boolean | null
          support_level?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_categories: {
        Row: {
          category_id: string
          category_name: string
          created_at: string | null
          created_by: string | null
          description: string | null
          is_active: boolean | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string
          category_name: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      support_ticket_comments: {
        Row: {
          attachment_url: string | null
          comment_id: string
          comment_text: string
          commented_by_user_id: string
          created_at: string | null
          is_internal_note: boolean | null
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          comment_id?: string
          comment_text: string
          commented_by_user_id: string
          created_at?: string | null
          is_internal_note?: boolean | null
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          comment_id?: string
          comment_text?: string
          commented_by_user_id?: string
          created_at?: string | null
          is_internal_note?: boolean | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_comments_commented_by_user_id_fkey"
            columns: ["commented_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to_user_id: string | null
          attachment_url: string | null
          category_id: string | null
          channel: string | null
          created_at: string | null
          description: string | null
          priority: string | null
          raised_by_user_id: string
          resolution_notes: string | null
          satisfaction_rating: number | null
          status: string | null
          subject: string
          tenant_id: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          attachment_url?: string | null
          category_id?: string | null
          channel?: string | null
          created_at?: string | null
          description?: string | null
          priority?: string | null
          raised_by_user_id: string
          resolution_notes?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject: string
          tenant_id: string
          ticket_id?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          attachment_url?: string | null
          category_id?: string | null
          channel?: string | null
          created_at?: string | null
          description?: string | null
          priority?: string | null
          raised_by_user_id?: string
          resolution_notes?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject?: string
          tenant_id?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "support_tickets_raised_by_user_id_fkey"
            columns: ["raised_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          function_name: string | null
          level: string | null
          log_id: string
          message: string
          metadata: Json | null
          module: string | null
          request_id: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          function_name?: string | null
          level?: string | null
          log_id?: string
          message: string
          metadata?: Json | null
          module?: string | null
          request_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          function_name?: string | null
          level?: string | null
          log_id?: string
          message?: string
          metadata?: Json | null
          module?: string | null
          request_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "system_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "system_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tax_slab_masters: {
        Row: {
          applicable_on: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          is_active: boolean | null
          rate_percentage: number | null
          remarks: string | null
          state: string | null
          tax_slab_id: string
          tax_type: string | null
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          applicable_on?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          is_active?: boolean | null
          rate_percentage?: number | null
          remarks?: string | null
          state?: string | null
          tax_slab_id?: string
          tax_type?: string | null
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          applicable_on?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          is_active?: boolean | null
          rate_percentage?: number | null
          remarks?: string | null
          state?: string | null
          tax_slab_id?: string
          tax_type?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_slab_masters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tds_settings: {
        Row: {
          applicable_to: string | null
          effective_from: string | null
          effective_to: string | null
          percentage: number | null
          tds_id: string
          tenant_id: string
        }
        Insert: {
          applicable_to?: string | null
          effective_from?: string | null
          effective_to?: string | null
          percentage?: number | null
          tds_id?: string
          tenant_id: string
        }
        Update: {
          applicable_to?: string | null
          effective_from?: string | null
          effective_to?: string | null
          percentage?: number | null
          tds_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tds_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tds_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tds_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_add_on_pricing: {
        Row: {
          add_on_id: string
          custom_price: number | null
          id: string
          is_enabled: boolean | null
          tenant_id: string
        }
        Insert: {
          add_on_id: string
          custom_price?: number | null
          id?: string
          is_enabled?: boolean | null
          tenant_id: string
        }
        Update: {
          add_on_id?: string
          custom_price?: number | null
          id?: string
          is_enabled?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_add_on_pricing_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["add_on_id"]
          },
          {
            foreignKeyName: "tenant_add_on_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_add_on_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_add_on_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_gateway_configurations: {
        Row: {
          config_id: string
          created_at: string | null
          enabled_for: Json | null
          gateway_id: string
          is_default: boolean | null
          merchant_id: string | null
          tenant_id: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          config_id?: string
          created_at?: string | null
          enabled_for?: Json | null
          gateway_id: string
          is_default?: boolean | null
          merchant_id?: string | null
          tenant_id: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          config_id?: string
          created_at?: string | null
          enabled_for?: Json | null
          gateway_id?: string
          is_default?: boolean | null
          merchant_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_gateway_configurations_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["gateway_id"]
          },
          {
            foreignKeyName: "tenant_gateway_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_gateway_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_gateway_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_cycle: string | null
          cancellation_reason: string | null
          cancelled_on: string | null
          created_at: string | null
          created_by: string | null
          current_add_ons: Json | null
          discount_code: string | null
          end_date: string | null
          invoice_reference: string | null
          is_active: boolean | null
          last_payment_date: string | null
          next_renewal_date: string | null
          payment_method: string | null
          payment_status: string | null
          plan_id: string
          plan_snapshot: Json | null
          start_date: string
          subscription_id: string
          tenant_id: string
          trial_end_date: string | null
          trial_start_date: string | null
          trial_used: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          cancellation_reason?: string | null
          cancelled_on?: string | null
          created_at?: string | null
          created_by?: string | null
          current_add_ons?: Json | null
          discount_code?: string | null
          end_date?: string | null
          invoice_reference?: string | null
          is_active?: boolean | null
          last_payment_date?: string | null
          next_renewal_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          plan_id: string
          plan_snapshot?: Json | null
          start_date: string
          subscription_id?: string
          tenant_id: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          cancellation_reason?: string | null
          cancelled_on?: string | null
          created_at?: string | null
          created_by?: string | null
          current_add_ons?: Json | null
          discount_code?: string | null
          end_date?: string | null
          invoice_reference?: string | null
          is_active?: boolean | null
          last_payment_date?: string | null
          next_renewal_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          plan_id?: string
          plan_snapshot?: Json | null
          start_date?: string
          subscription_id?: string
          tenant_id?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
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
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
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
      tenant_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          created_at: string | null
          industry_type: string | null
          logo_url: string | null
          notes: string | null
          phone_number: string | null
          status: string | null
          tenant_code: string
          tenant_id: string
          tenant_name: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          industry_type?: string | null
          logo_url?: string | null
          notes?: string | null
          phone_number?: string | null
          status?: string | null
          tenant_code: string
          tenant_id?: string
          tenant_name: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          industry_type?: string | null
          logo_url?: string | null
          notes?: string | null
          phone_number?: string | null
          status?: string | null
          tenant_code?: string
          tenant_id?: string
          tenant_name?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          email: string
          failed_login_attempts: number | null
          full_name: string | null
          is_email_verified: boolean | null
          is_phone_verified: boolean | null
          last_login_at: string | null
          locked_until: string | null
          metadata: Json | null
          password_hash: string | null
          phone_number: string | null
          preferred_channel: string | null
          role_id: string | null
          status: string | null
          tenant_id: string | null
          terms_accepted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          failed_login_attempts?: number | null
          full_name?: string | null
          is_email_verified?: boolean | null
          is_phone_verified?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          metadata?: Json | null
          password_hash?: string | null
          phone_number?: string | null
          preferred_channel?: string | null
          role_id?: string | null
          status?: string | null
          tenant_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          failed_login_attempts?: number | null
          full_name?: string | null
          is_email_verified?: boolean | null
          is_phone_verified?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          metadata?: Json | null
          password_hash?: string | null
          phone_number?: string | null
          preferred_channel?: string | null
          role_id?: string | null
          status?: string | null
          tenant_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "login_roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      vehicle_details: {
        Row: {
          chassis_number: string | null
          engine_number: string | null
          fuel_type: string | null
          insured_declared_value: number | null
          make: string | null
          manufacture_year: number | null
          model: string | null
          policy_id: string
          registration_number: string | null
          variant: string | null
          vehicle_id: string
        }
        Insert: {
          chassis_number?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          insured_declared_value?: number | null
          make?: string | null
          manufacture_year?: number | null
          model?: string | null
          policy_id: string
          registration_number?: string | null
          variant?: string | null
          vehicle_id?: string
        }
        Update: {
          chassis_number?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          insured_declared_value?: number | null
          make?: string | null
          manufacture_year?: number | null
          model?: string | null
          policy_id?: string
          registration_number?: string | null
          variant?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_details_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies_view"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "vehicle_details_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "vehicle_details_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_renewal_reminders"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      vehicle_makes: {
        Row: {
          country: string | null
          created_at: string | null
          make_id: string
          name: string
          status: boolean | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          make_id?: string
          name: string
          status?: boolean | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          make_id?: string
          name?: string
          status?: boolean | null
        }
        Relationships: []
      }
      vehicle_models: {
        Row: {
          fuel_types: string[] | null
          make_id: string
          model_id: string
          name: string
          status: boolean | null
          transmission_types: string[] | null
          vehicle_type_id: string
        }
        Insert: {
          fuel_types?: string[] | null
          make_id: string
          model_id?: string
          name: string
          status?: boolean | null
          transmission_types?: string[] | null
          vehicle_type_id: string
        }
        Update: {
          fuel_types?: string[] | null
          make_id?: string
          model_id?: string
          name?: string
          status?: boolean | null
          transmission_types?: string[] | null
          vehicle_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_makes"
            referencedColumns: ["make_id"]
          },
          {
            foreignKeyName: "vehicle_models_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["vehicle_type_id"]
          },
        ]
      }
      vehicle_types: {
        Row: {
          created_at: string | null
          description: string | null
          is_active: boolean | null
          name: string
          updated_at: string | null
          vehicle_type_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          vehicle_type_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          vehicle_type_id?: string
        }
        Relationships: []
      }
      vehicle_variants: {
        Row: {
          engine_capacity: number | null
          ex_showroom_price: number | null
          fuel_type: string | null
          model_id: string
          seating_capacity: number | null
          status: boolean | null
          variant_id: string
          variant_name: string
        }
        Insert: {
          engine_capacity?: number | null
          ex_showroom_price?: number | null
          fuel_type?: string | null
          model_id: string
          seating_capacity?: number | null
          status?: boolean | null
          variant_id?: string
          variant_name: string
        }
        Update: {
          engine_capacity?: number | null
          ex_showroom_price?: number | null
          fuel_type?: string | null
          model_id?: string
          seating_capacity?: number | null
          status?: boolean | null
          variant_id?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_variants_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
            referencedColumns: ["model_id"]
          },
        ]
      }
    }
    Views: {
      active_policies_view: {
        Row: {
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          end_date: string | null
          lob_name: string | null
          net_premium: number | null
          policy_id: string | null
          policy_number: string | null
          premium_amount: number | null
          product_name: string | null
          provider_name: string | null
          start_date: string | null
          status: string | null
          tenant_id: string | null
          vehicle_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      agent_commission_summary: {
        Row: {
          agent_code: string | null
          agent_id: string | null
          full_name: string | null
          paid_commission: number | null
          pending_commission: number | null
          tenant_id: string | null
          tenant_name: string | null
          total_commission_earned: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
      claims_dashboard: {
        Row: {
          claim_amount: number | null
          claim_id: string | null
          claim_type: string | null
          created_at: string | null
          customer_name: string | null
          days_since_filed: number | null
          incident_date: string | null
          insurer_name: string | null
          policy_number: string | null
          product_name: string | null
          settled_amount: number | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      policy_renewal_reminders: {
        Row: {
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          days_to_expiry: number | null
          end_date: string | null
          policy_id: string | null
          policy_number: string | null
          product_name: string | null
          provider_name: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscription_status"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_subscription_status: {
        Row: {
          end_date: string | null
          payment_status: string | null
          plan_name: string | null
          start_date: string | null
          subscription_active: boolean | null
          subscription_id: string | null
          subscription_status: string | null
          tenant_code: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_status: string | null
        }
        Relationships: []
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
      auto_escalate_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      can_transition_policy_status: {
        Args: {
          current_status: Database["public"]["Enums"]["policy_status_enum"]
          new_status: Database["public"]["Enums"]["policy_status_enum"]
          user_id: string
        }
        Returns: boolean
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
      current_user_tenant_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      generate_policy_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_current_user_agent: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_employee: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_commission_rule_version: {
        Args: {
          p_insurer_id: string
          p_product_id: string
          p_line_of_business: string
        }
        Returns: number
      }
      get_user_profile: {
        Args: { user_id?: string }
        Returns: {
          id: string
          email: string
          phone: string
          full_name: string
          user_type: string
          employee_role: string
          agent_type: string
          branch_name: string
          is_active: boolean
          kyc_status: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_tenant_admin_for: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      trigger_commission_payout: {
        Args: { p_policy_id: string }
        Returns: boolean
      }
      update_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_policy_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "manager" | "user" | "ops" | "finance"
      assigned_to_type: "Employee" | "Agent"
      billing_cycle_enum: "Monthly" | "Yearly"
      created_by_type: "Agent" | "Employee"
      lead_source:
        | "Walk-in"
        | "Website"
        | "Referral"
        | "Tele-calling"
        | "Campaign"
        | "API"
      lead_status: "New" | "Contacted" | "In Progress" | "Converted" | "Dropped"
      line_of_business_type:
        | "Health"
        | "Motor"
        | "Life"
        | "Travel"
        | "Loan"
        | "Pet"
        | "Commercial"
      motor_vehicle_type_enum:
        | "Two-Wheeler"
        | "Private Car"
        | "Commercial Vehicle"
        | "Miscellaneous"
      payment_mode: "UPI" | "Bank Transfer" | "Cheque" | "Cash"
      payment_mode_enum: "Cash" | "UPI" | "Cheque" | "Online" | "Bank Transfer"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      payment_status_enum: "Paid" | "Pending" | "Overdue" | "Failed"
      payout_status: "Pending" | "Paid" | "Failed" | "On Hold"
      policy_status_enum:
        | "Underwriting"
        | "Issued"
        | "Rejected"
        | "Cancelled"
        | "Free Look Cancellation"
      policy_type_enum:
        | "New"
        | "Renewal"
        | "Portability"
        | "Top-Up"
        | "Rollover"
        | "Converted"
      premium_frequency_enum: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly"
      quote_status:
        | "draft"
        | "quotes_generated"
        | "quote_selected"
        | "proposal_submitted"
        | "payment_pending"
        | "payment_completed"
        | "policy_issued"
        | "cancelled"
      recurrence_pattern: "Daily" | "Weekly" | "Monthly"
      reminder_status: "Sent" | "Failed"
      reminder_via: "Email" | "SMS" | "In-app"
      source_type: "admin" | "agent" | "employee" | "customer" | "api"
      support_level_enum: "Basic" | "Priority" | "Dedicated"
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
        | "Review"
        | "Underwriting"
        | "Verification"
      tenant_status_enum: "Active" | "Inactive" | "Pending"
      vehicle_category_enum: "2W" | "Car" | "Commercial" | "Miscellaneous"
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
      app_role: ["admin", "agent", "manager", "user", "ops", "finance"],
      assigned_to_type: ["Employee", "Agent"],
      billing_cycle_enum: ["Monthly", "Yearly"],
      created_by_type: ["Agent", "Employee"],
      lead_source: [
        "Walk-in",
        "Website",
        "Referral",
        "Tele-calling",
        "Campaign",
        "API",
      ],
      lead_status: ["New", "Contacted", "In Progress", "Converted", "Dropped"],
      line_of_business_type: [
        "Health",
        "Motor",
        "Life",
        "Travel",
        "Loan",
        "Pet",
        "Commercial",
      ],
      motor_vehicle_type_enum: [
        "Two-Wheeler",
        "Private Car",
        "Commercial Vehicle",
        "Miscellaneous",
      ],
      payment_mode: ["UPI", "Bank Transfer", "Cheque", "Cash"],
      payment_mode_enum: ["Cash", "UPI", "Cheque", "Online", "Bank Transfer"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      payment_status_enum: ["Paid", "Pending", "Overdue", "Failed"],
      payout_status: ["Pending", "Paid", "Failed", "On Hold"],
      policy_status_enum: [
        "Underwriting",
        "Issued",
        "Rejected",
        "Cancelled",
        "Free Look Cancellation",
      ],
      policy_type_enum: [
        "New",
        "Renewal",
        "Portability",
        "Top-Up",
        "Rollover",
        "Converted",
      ],
      premium_frequency_enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],
      quote_status: [
        "draft",
        "quotes_generated",
        "quote_selected",
        "proposal_submitted",
        "payment_pending",
        "payment_completed",
        "policy_issued",
        "cancelled",
      ],
      recurrence_pattern: ["Daily", "Weekly", "Monthly"],
      reminder_status: ["Sent", "Failed"],
      reminder_via: ["Email", "SMS", "In-app"],
      source_type: ["admin", "agent", "employee", "customer", "api"],
      support_level_enum: ["Basic", "Priority", "Dedicated"],
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
        "Review",
        "Underwriting",
        "Verification",
      ],
      tenant_status_enum: ["Active", "Inactive", "Pending"],
      vehicle_category_enum: ["2W", "Car", "Commercial", "Miscellaneous"],
    },
  },
} as const
