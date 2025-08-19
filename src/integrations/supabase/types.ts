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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          module: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          module: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          module?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      agent_exams: {
        Row: {
          agent_id: number
          created_at: string | null
          exam_date: string | null
          exam_id: number
          score: number | null
          status: string | null
        }
        Insert: {
          agent_id: number
          created_at?: string | null
          exam_date?: string | null
          exam_id?: never
          score?: number | null
          status?: string | null
        }
        Update: {
          agent_id?: number
          created_at?: string | null
          exam_date?: string | null
          exam_id?: never
          score?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_exams_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_id: number
          agent_type: string | null
          channel_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string
          invitation_sent_at: string | null
          is_active: boolean | null
          last_login_at: string | null
          metadata: Json | null
          onboarding_status: string | null
          phone: string | null
          status: string | null
          status_id: string | null
          tenant_id: string
          tenant_id_new: string | null
          updated_at: string | null
          updated_by: string | null
          user_account_id: string | null
        }
        Insert: {
          agent_id?: never
          agent_type?: string | null
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          invitation_sent_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          metadata?: Json | null
          onboarding_status?: string | null
          phone?: string | null
          status?: string | null
          status_id?: string | null
          tenant_id: string
          tenant_id_new?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_account_id?: string | null
        }
        Update: {
          agent_id?: never
          agent_type?: string | null
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          invitation_sent_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          metadata?: Json | null
          onboarding_status?: string | null
          phone?: string | null
          status?: string | null
          status_id?: string | null
          tenant_id?: string
          tenant_id_new?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["channel_id"]
          },
          {
            foreignKeyName: "agents_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_user_account_id_fkey"
            columns: ["user_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      allocation_rules: {
        Row: {
          effective_from: string
          effective_to: string | null
          rule_id: number
          scope_level: string
          scope_ref: number | null
          splits: Json
          tenant_id: number
        }
        Insert: {
          effective_from: string
          effective_to?: string | null
          rule_id?: number
          scope_level: string
          scope_ref?: number | null
          splits: Json
          tenant_id: number
        }
        Update: {
          effective_from?: string
          effective_to?: string | null
          rule_id?: number
          scope_level?: string
          scope_ref?: number | null
          splits?: Json
          tenant_id?: number
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          actor_id: string
          audit_id: string
          module: string
          reference_id: string | null
          timestamp: string | null
          trace_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          audit_id?: string
          module: string
          reference_id?: string | null
          timestamp?: string | null
          trace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          audit_id?: string
          module?: string
          reference_id?: string | null
          timestamp?: string | null
          trace_id?: string | null
        }
        Relationships: []
      }
      branch_departments: {
        Row: {
          assigned_at: string | null
          branch_dept_id: number
          branch_id: number
          dept_id: number
        }
        Insert: {
          assigned_at?: string | null
          branch_dept_id?: never
          branch_id: number
          dept_id: number
        }
        Update: {
          assigned_at?: string | null
          branch_dept_id?: never
          branch_id?: number
          dept_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "branch_departments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_id: number
          branch_name: string
          business_hours: Json | null
          contact_details: Json | null
          created_at: string | null
          created_by: string | null
          manager_id: number | null
          metadata: Json | null
          status: string | null
          status_id: string | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: never
          branch_name: string
          business_hours?: Json | null
          contact_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          manager_id?: number | null
          metadata?: Json | null
          status?: string | null
          status_id?: string | null
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: never
          branch_name?: string
          business_hours?: Json | null
          contact_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          manager_id?: number | null
          metadata?: Json | null
          status?: string | null
          status_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_master"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_code: string
          channel_id: string
          channel_name: string
          channel_type: string
          commission_structure: Json | null
          created_at: string
          description: string | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          channel_code: string
          channel_id?: string
          channel_name: string
          channel_type: string
          commission_structure?: Json | null
          created_at?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          channel_code?: string
          channel_id?: string
          channel_name?: string
          channel_type?: string
          commission_structure?: Json | null
          created_at?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      commission_structures: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          criteria: Json | null
          id: string
          legacy_rule_id: number | null
          rule_name: string
          rule_type: string
          rules: Json
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          id?: string
          legacy_rule_id?: number | null
          rule_name: string
          rule_type: string
          rules: Json
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          id?: string
          legacy_rule_id?: number | null
          rule_name?: string
          rule_type?: string
          rules?: Json
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      commissions_unified: {
        Row: {
          agent_id: number | null
          base_amount: number
          calculation_basis: string
          clawback_details: Json | null
          commission_amount: number
          commission_id: string
          commission_rate: number | null
          commission_type: string
          created_at: string
          currency: string | null
          due_date: string
          override_details: Json | null
          payment_date: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          policy_id: string | null
          status_id: string | null
          tax_details: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_id?: number | null
          base_amount: number
          calculation_basis: string
          clawback_details?: Json | null
          commission_amount: number
          commission_id?: string
          commission_rate?: number | null
          commission_type: string
          created_at?: string
          currency?: string | null
          due_date: string
          override_details?: Json | null
          payment_date?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          policy_id?: string | null
          status_id?: string | null
          tax_details?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: number | null
          base_amount?: number
          calculation_basis?: string
          clawback_details?: Json | null
          commission_amount?: number
          commission_id?: string
          commission_rate?: number | null
          commission_type?: string
          created_at?: string
          currency?: string | null
          due_date?: string
          override_details?: Json | null
          payment_date?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          policy_id?: string | null
          status_id?: string | null
          tax_details?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_unified_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "commissions_unified_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_unified"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "commissions_unified_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_master"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_unified: {
        Row: {
          created_at: string | null
          document_category: string
          document_type: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          processed_at: string | null
          processed_by: string | null
          tenant_id: string
          updated_at: string | null
          uploaded_by: string | null
          verification_status: string | null
        }
        Insert: {
          created_at?: string | null
          document_category: string
          document_type: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          tenant_id: string
          updated_at?: string | null
          uploaded_by?: string | null
          verification_status?: string | null
        }
        Update: {
          created_at?: string | null
          document_category?: string
          document_type?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          tenant_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      fact_claims: {
        Row: {
          cause_of_loss: string | null
          claim_id: number
          claim_number: string
          claim_type: string | null
          created_at: string | null
          decision_date: string | null
          intimation_date: string
          policy_id: number
          settlement_amount: number | null
          status: string | null
          tenant_id: number
        }
        Insert: {
          cause_of_loss?: string | null
          claim_id?: number
          claim_number: string
          claim_type?: string | null
          created_at?: string | null
          decision_date?: string | null
          intimation_date: string
          policy_id: number
          settlement_amount?: number | null
          status?: string | null
          tenant_id: number
        }
        Update: {
          cause_of_loss?: string | null
          claim_id?: number
          claim_number?: string
          claim_type?: string | null
          created_at?: string | null
          decision_date?: string | null
          intimation_date?: string
          policy_id?: number
          settlement_amount?: number | null
          status?: string | null
          tenant_id?: number
        }
        Relationships: []
      }
      fact_invoices: {
        Row: {
          amount_due: number
          amount_paid: number | null
          created_at: string | null
          due_date: string
          invoice_id: number
          invoice_number: string
          invoice_type: string | null
          policy_id: number
          status: string | null
          tenant_id: number
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          created_at?: string | null
          due_date: string
          invoice_id?: number
          invoice_number: string
          invoice_type?: string | null
          policy_id: number
          status?: string | null
          tenant_id: number
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          created_at?: string | null
          due_date?: string
          invoice_id?: number
          invoice_number?: string
          invoice_type?: string | null
          policy_id?: number
          status?: string | null
          tenant_id?: number
        }
        Relationships: []
      }
      fact_premiums: {
        Row: {
          agent_id: number | null
          branch_id: number | null
          currency: string | null
          dim_date_id: number
          gst_amount: number | null
          insurer_id: number | null
          policy_id: number
          premium_amount: number
          product_id: number | null
          tenant_id: number
          txn_date: string
          txn_id: number
          txn_type: string | null
        }
        Insert: {
          agent_id?: number | null
          branch_id?: number | null
          currency?: string | null
          dim_date_id: number
          gst_amount?: number | null
          insurer_id?: number | null
          policy_id: number
          premium_amount: number
          product_id?: number | null
          tenant_id: number
          txn_date: string
          txn_id?: number
          txn_type?: string | null
        }
        Update: {
          agent_id?: number | null
          branch_id?: number | null
          currency?: string | null
          dim_date_id?: number
          gst_amount?: number | null
          insurer_id?: number | null
          policy_id?: number
          premium_amount?: number
          product_id?: number | null
          tenant_id?: number
          txn_date?: string
          txn_id?: number
          txn_type?: string | null
        }
        Relationships: []
      }
      fact_renewal_events: {
        Row: {
          created_at: string | null
          due_date: string
          original_premium: number | null
          policy_id: number
          reason_code: string | null
          renewal_date: string | null
          renewal_id: number
          renewed: boolean
          renewed_premium: number | null
          tenant_id: number
        }
        Insert: {
          created_at?: string | null
          due_date: string
          original_premium?: number | null
          policy_id: number
          reason_code?: string | null
          renewal_date?: string | null
          renewal_id?: number
          renewed?: boolean
          renewed_premium?: number | null
          tenant_id: number
        }
        Update: {
          created_at?: string | null
          due_date?: string
          original_premium?: number | null
          policy_id?: number
          reason_code?: string | null
          renewal_date?: string | null
          renewal_id?: number
          renewed?: boolean
          renewed_premium?: number | null
          tenant_id?: number
        }
        Relationships: []
      }
      finance_accounts: {
        Row: {
          account_code: string
          account_id: string
          account_name: string
          created_at: string | null
          is_active: boolean | null
          parent_account: string | null
          tenant_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_id?: string
          account_name: string
          created_at?: string | null
          is_active?: boolean | null
          parent_account?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_id?: string
          account_name?: string
          created_at?: string | null
          is_active?: boolean | null
          parent_account?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_parent_account_fkey"
            columns: ["parent_account"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["account_id"]
          },
        ]
      }
      finance_journal_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit: number | null
          currency: string | null
          debit: number | null
          fx_rate: number | null
          journal_id: string
          line_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit?: number | null
          currency?: string | null
          debit?: number | null
          fx_rate?: number | null
          journal_id: string
          line_id?: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit?: number | null
          currency?: string | null
          debit?: number | null
          fx_rate?: number | null
          journal_id?: string
          line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "finance_journal_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "finance_journals"
            referencedColumns: ["journal_id"]
          },
        ]
      }
      finance_journals: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          journal_id: string
          journal_type: string | null
          posted_at: string | null
          reference_id: string | null
          status: string | null
          tenant_id: string
          trace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          journal_id?: string
          journal_type?: string | null
          posted_at?: string | null
          reference_id?: string | null
          status?: string | null
          tenant_id: string
          trace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          journal_id?: string
          journal_type?: string | null
          posted_at?: string | null
          reference_id?: string | null
          status?: string | null
          tenant_id?: string
          trace_id?: string | null
        }
        Relationships: []
      }
      finance_payouts: {
        Row: {
          agent_name: string | null
          amount: number
          approved_by: string | null
          breakdown: Json | null
          created_at: string | null
          org_id: string
          payment_ref: string | null
          payout_id: string
          request_date: string
          status: string | null
          tenant_id: string
          trace_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_name?: string | null
          amount: number
          approved_by?: string | null
          breakdown?: Json | null
          created_at?: string | null
          org_id: string
          payment_ref?: string | null
          payout_id?: string
          request_date: string
          status?: string | null
          tenant_id: string
          trace_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_name?: string | null
          amount?: number
          approved_by?: string | null
          breakdown?: Json | null
          created_at?: string | null
          org_id?: string
          payment_ref?: string | null
          payout_id?: string
          request_date?: string
          status?: string | null
          tenant_id?: string
          trace_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      finance_settlements: {
        Row: {
          approved_by: string | null
          created_at: string | null
          expected_amount: number
          insurer_id: string | null
          period: string
          received_amount: number | null
          settlement_id: string
          status: string | null
          tenant_id: string
          trace_id: string | null
          updated_at: string | null
          variance_amount: number | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          expected_amount: number
          insurer_id?: string | null
          period: string
          received_amount?: number | null
          settlement_id?: string
          status?: string | null
          tenant_id: string
          trace_id?: string | null
          updated_at?: string | null
          variance_amount?: number | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          expected_amount?: number
          insurer_id?: string | null
          period?: string
          received_amount?: number | null
          settlement_id?: string
          status?: string | null
          tenant_id?: string
          trace_id?: string | null
          updated_at?: string | null
          variance_amount?: number | null
        }
        Relationships: []
      }
      finance_variances: {
        Row: {
          actual_value: number | null
          assigned_to: string | null
          created_at: string | null
          description: string | null
          difference: number | null
          expected_value: number | null
          reference_id: string
          status: string | null
          tenant_id: string
          trace_id: string | null
          type: string | null
          updated_at: string | null
          variance_id: string
        }
        Insert: {
          actual_value?: number | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          difference?: number | null
          expected_value?: number | null
          reference_id: string
          status?: string | null
          tenant_id: string
          trace_id?: string | null
          type?: string | null
          updated_at?: string | null
          variance_id?: string
        }
        Update: {
          actual_value?: number | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          difference?: number | null
          expected_value?: number | null
          reference_id?: string
          status?: string | null
          tenant_id?: string
          trace_id?: string | null
          type?: string | null
          updated_at?: string | null
          variance_id?: string
        }
        Relationships: []
      }
      global_permissions: {
        Row: {
          action: string
          created_at: string | null
          id: string
          is_allowed: boolean | null
          module: string
          role_name: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          module: string
          role_name: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          module?: string
          role_name?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      insurer_statement_items: {
        Row: {
          commission_amount: number | null
          created_at: string | null
          insurer_id: number
          item_date: string | null
          item_id: number
          policy_number: string | null
          premium_amount: number | null
          statement_period: string
          tenant_id: number
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string | null
          insurer_id: number
          item_date?: string | null
          item_id?: number
          policy_number?: string | null
          premium_amount?: number | null
          statement_period: string
          tenant_id: number
        }
        Update: {
          commission_amount?: number | null
          created_at?: string | null
          insurer_id?: number
          item_date?: string | null
          item_id?: number
          policy_number?: string | null
          premium_amount?: number | null
          statement_period?: string
          tenant_id?: number
        }
        Relationships: []
      }
      irdai_commission_caps: {
        Row: {
          cap_id: number
          channel: string | null
          created_at: string | null
          effective_from: string
          effective_to: string | null
          lob_id: string | null
          max_commission_percent: number
          policy_year: number | null
          product_category: string | null
        }
        Insert: {
          cap_id?: number
          channel?: string | null
          created_at?: string | null
          effective_from: string
          effective_to?: string | null
          lob_id?: string | null
          max_commission_percent: number
          policy_year?: number | null
          product_category?: string | null
        }
        Update: {
          cap_id?: number
          channel?: string | null
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          lob_id?: string | null
          max_commission_percent?: number
          policy_year?: number | null
          product_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "irdai_commission_caps_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "master_line_of_business"
            referencedColumns: ["lob_id"]
          },
        ]
      }
      local_permissions: {
        Row: {
          action: string
          created_at: string | null
          created_by: string | null
          id: string
          is_allowed: boolean | null
          module: string
          role_name: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_allowed?: boolean | null
          module: string
          role_name?: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_allowed?: boolean | null
          module?: string
          role_name?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      master_departments: {
        Row: {
          branch_id: number | null
          created_at: string | null
          created_by: string | null
          department_code: string
          department_id: number
          department_name: string
          description: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          branch_id?: number | null
          created_at?: string | null
          created_by?: string | null
          department_code: string
          department_id?: number
          department_name: string
          description?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          branch_id?: number | null
          created_at?: string | null
          created_by?: string | null
          department_code?: string
          department_id?: number
          department_name?: string
          description?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
          category: string | null
          created_at: string | null
          description: string | null
          is_active: boolean | null
          occupation_code: string
          occupation_id: string
          occupation_name: string
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          occupation_code: string
          occupation_id?: string
          occupation_name: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          occupation_code?: string
          occupation_id?: string
          occupation_name?: string
          risk_level?: string | null
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
      master_reference_data: {
        Row: {
          category: string
          code: string
          created_at: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean | null
          legacy_tenant_id: number | null
          metadata: Json | null
          name: string
          parent_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          legacy_tenant_id?: number | null
          metadata?: Json | null
          name: string
          parent_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          legacy_tenant_id?: number | null
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_reference_data_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "master_reference_data"
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
      onboarding_invitations: {
        Row: {
          accepted_at: string | null
          agent_id: number | null
          created_at: string
          created_by: string
          email: string
          employee_id: number | null
          expires_at: string
          id: string
          invitation_token: string
          metadata: Json | null
          role: string
          sent_at: string | null
          status: string | null
          temporary_password: string | null
          tenant_id: string
          updated_at: string
          user_type: string
        }
        Insert: {
          accepted_at?: string | null
          agent_id?: number | null
          created_at?: string
          created_by: string
          email: string
          employee_id?: number | null
          expires_at?: string
          id?: string
          invitation_token: string
          metadata?: Json | null
          role: string
          sent_at?: string | null
          status?: string | null
          temporary_password?: string | null
          tenant_id: string
          updated_at?: string
          user_type: string
        }
        Update: {
          accepted_at?: string | null
          agent_id?: number | null
          created_at?: string
          created_by?: string
          email?: string
          employee_id?: number | null
          expires_at?: string
          id?: string
          invitation_token?: string
          metadata?: Json | null
          role?: string
          sent_at?: string | null
          status?: string | null
          temporary_password?: string | null
          tenant_id?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_invitations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "onboarding_invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "tenant_employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          hierarchy_path: string | null
          id: string
          manager_id: string | null
          org_code: string | null
          org_name: string
          org_type: string | null
          parent_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          hierarchy_path?: string | null
          id?: string
          manager_id?: string | null
          org_code?: string | null
          org_name: string
          org_type?: string | null
          parent_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          hierarchy_path?: string | null
          id?: string
          manager_id?: string | null
          org_code?: string | null
          org_name?: string
          org_type?: string | null
          parent_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          module: string | null
          permission_code: string
          permission_id: number
          permission_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          module?: string | null
          permission_code: string
          permission_id?: number
          permission_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          module?: string | null
          permission_code?: string
          permission_id?: number
          permission_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          channel_type: string
          commission_type: string
          commission_value: number | null
          created_at: string
          created_by: string | null
          expiry_date: string
          holder_name: string
          issue_date: string
          policy_id: string
          policy_number: string
          policy_type: string
          premium_amount: number
          product_id: string
          revenue_amount: number | null
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel_type: string
          commission_type: string
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          expiry_date: string
          holder_name: string
          issue_date: string
          policy_id?: string
          policy_number: string
          policy_type: string
          premium_amount: number
          product_id: string
          revenue_amount?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel_type?: string
          commission_type?: string
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string
          holder_name?: string
          issue_date?: string
          policy_id?: string
          policy_number?: string
          policy_type?: string
          premium_amount?: number
          product_id?: string
          revenue_amount?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      policies_unified: {
        Row: {
          agent_id: number | null
          branch_id: number | null
          channel_id: string | null
          commencement_date: string
          commission_earned: number | null
          coverage_details: Json
          created_at: string
          created_by: string | null
          customer_details: Json
          expiry_date: string
          issue_date: string
          last_premium_paid_date: string | null
          lob_specific_data: Json | null
          next_premium_due_date: string | null
          nominee_details: Json | null
          outstanding_premium: number | null
          paid_premium: number | null
          policy_id: string
          policy_number: string
          policy_terms: Json | null
          premium_details: Json
          product_id: string | null
          renewal_due_date: string | null
          status_id: string | null
          sum_assured: number | null
          tenant_id: string
          total_premium: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agent_id?: number | null
          branch_id?: number | null
          channel_id?: string | null
          commencement_date: string
          commission_earned?: number | null
          coverage_details: Json
          created_at?: string
          created_by?: string | null
          customer_details: Json
          expiry_date: string
          issue_date: string
          last_premium_paid_date?: string | null
          lob_specific_data?: Json | null
          next_premium_due_date?: string | null
          nominee_details?: Json | null
          outstanding_premium?: number | null
          paid_premium?: number | null
          policy_id?: string
          policy_number: string
          policy_terms?: Json | null
          premium_details: Json
          product_id?: string | null
          renewal_due_date?: string | null
          status_id?: string | null
          sum_assured?: number | null
          tenant_id: string
          total_premium: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agent_id?: number | null
          branch_id?: number | null
          channel_id?: string | null
          commencement_date?: string
          commission_earned?: number | null
          coverage_details?: Json
          created_at?: string
          created_by?: string | null
          customer_details?: Json
          expiry_date?: string
          issue_date?: string
          last_premium_paid_date?: string | null
          lob_specific_data?: Json | null
          next_premium_due_date?: string | null
          nominee_details?: Json | null
          outstanding_premium?: number | null
          paid_premium?: number | null
          policy_id?: string
          policy_number?: string
          policy_terms?: Json | null
          premium_details?: Json
          product_id?: string | null
          renewal_due_date?: string | null
          status_id?: string | null
          sum_assured?: number | null
          tenant_id?: string
          total_premium?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_unified_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "policies_unified_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "policies_unified_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["channel_id"]
          },
          {
            foreignKeyName: "policies_unified_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "policies_unified_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_master"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_addons: {
        Row: {
          addon_id: string
          created_at: string
          effective_date: string
          is_active: boolean
          policy_addon_id: string
          policy_id: string
          premium_amount: number
          sum_assured: number | null
        }
        Insert: {
          addon_id: string
          created_at?: string
          effective_date?: string
          is_active?: boolean
          policy_addon_id?: string
          policy_id: string
          premium_amount: number
          sum_assured?: number | null
        }
        Update: {
          addon_id?: string
          created_at?: string
          effective_date?: string
          is_active?: boolean
          policy_addon_id?: string
          policy_id?: string
          premium_amount?: number
          sum_assured?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "master_addon"
            referencedColumns: ["addon_id"]
          },
          {
            foreignKeyName: "policy_addons_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_unified"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      policy_bulk_import_rows: {
        Row: {
          data: Json | null
          import_id: string
          row_id: string
          row_number: number | null
          validation_errors: string[] | null
          validation_status: string
        }
        Insert: {
          data?: Json | null
          import_id: string
          row_id?: string
          row_number?: number | null
          validation_errors?: string[] | null
          validation_status?: string
        }
        Update: {
          data?: Json | null
          import_id?: string
          row_id?: string
          row_number?: number | null
          validation_errors?: string[] | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_bulk_import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "policy_bulk_imports"
            referencedColumns: ["import_id"]
          },
        ]
      }
      policy_bulk_imports: {
        Row: {
          file_name: string | null
          import_id: string
          status: string
          tenant_id: string
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          file_name?: string | null
          import_id?: string
          status?: string
          tenant_id: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string | null
          import_id?: string
          status?: string
          tenant_id?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_bulk_imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      policy_details_unified: {
        Row: {
          addons: Json | null
          base_coverage: Json | null
          created_at: string | null
          currency: string | null
          health_details: Json | null
          id: string
          insured_details: Json | null
          life_details: Json | null
          lob_type: string
          medical_reports: Json | null
          motor_details: Json | null
          nominee_details: Json | null
          policy_id: string
          premium_amount: number | null
          proposer_details: Json | null
          riders: Json | null
          sum_insured: number | null
          tenant_id: string | null
          underwriting_details: Json | null
          updated_at: string | null
        }
        Insert: {
          addons?: Json | null
          base_coverage?: Json | null
          created_at?: string | null
          currency?: string | null
          health_details?: Json | null
          id?: string
          insured_details?: Json | null
          life_details?: Json | null
          lob_type: string
          medical_reports?: Json | null
          motor_details?: Json | null
          nominee_details?: Json | null
          policy_id: string
          premium_amount?: number | null
          proposer_details?: Json | null
          riders?: Json | null
          sum_insured?: number | null
          tenant_id?: string | null
          underwriting_details?: Json | null
          updated_at?: string | null
        }
        Update: {
          addons?: Json | null
          base_coverage?: Json | null
          created_at?: string | null
          currency?: string | null
          health_details?: Json | null
          id?: string
          insured_details?: Json | null
          life_details?: Json | null
          lob_type?: string
          medical_reports?: Json | null
          motor_details?: Json | null
          nominee_details?: Json | null
          policy_id?: string
          premium_amount?: number | null
          proposer_details?: Json | null
          riders?: Json | null
          sum_insured?: number | null
          tenant_id?: string | null
          underwriting_details?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      policy_renewals: {
        Row: {
          new_expiry_date: string
          old_expiry_date: string
          policy_id: string
          renewal_id: string
          renewal_premium: number | null
          renewed_at: string
          renewed_by: string | null
        }
        Insert: {
          new_expiry_date: string
          old_expiry_date: string
          policy_id: string
          renewal_id?: string
          renewal_premium?: number | null
          renewed_at?: string
          renewed_by?: string | null
        }
        Update: {
          new_expiry_date?: string
          old_expiry_date?: string
          policy_id?: string
          renewal_id?: string
          renewal_premium?: number | null
          renewed_at?: string
          renewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_renewals_renewed_by_fkey"
            columns: ["renewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      premium_adjustments: {
        Row: {
          adj_id: number
          amount: number
          premium_id: number | null
          reason: string | null
          type: string
        }
        Insert: {
          adj_id?: number
          amount: number
          premium_id?: number | null
          reason?: string | null
          type: string
        }
        Update: {
          adj_id?: number
          amount?: number
          premium_id?: number | null
          reason?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_adjustments_premium_id_fkey"
            columns: ["premium_id"]
            isOneToOne: false
            referencedRelation: "premiums"
            referencedColumns: ["premium_id"]
          },
        ]
      }
      premiums: {
        Row: {
          customer_id: number | null
          gross_premium: number
          insurer_id: number
          net_premium: number
          org_id: number | null
          policy_id: number
          premium_id: number
          product_id: number
          receipt_date: string
          ref_no: string | null
          status: string | null
          tenant_id: number
        }
        Insert: {
          customer_id?: number | null
          gross_premium: number
          insurer_id: number
          net_premium: number
          org_id?: number | null
          policy_id: number
          premium_id?: number
          product_id: number
          receipt_date: string
          ref_no?: string | null
          status?: string | null
          tenant_id: number
        }
        Update: {
          customer_id?: number | null
          gross_premium?: number
          insurer_id?: number
          net_premium?: number
          org_id?: number | null
          policy_id?: number
          premium_id?: number
          product_id?: number
          receipt_date?: string
          ref_no?: string | null
          status?: string | null
          tenant_id?: number
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          addon_compatibility: string[] | null
          base_premium: number | null
          coverage_details: Json | null
          created_at: string
          effective_from: string
          effective_to: string | null
          eligibility_criteria: Json | null
          exclusions: Json | null
          features: Json | null
          is_active: boolean
          lob_id: string | null
          plan_type_id: string | null
          policy_type_id: string | null
          product_category: string | null
          product_code: string
          product_id: string
          product_name: string
          provider_id: string | null
          regulatory_info: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          addon_compatibility?: string[] | null
          base_premium?: number | null
          coverage_details?: Json | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          eligibility_criteria?: Json | null
          exclusions?: Json | null
          features?: Json | null
          is_active?: boolean
          lob_id?: string | null
          plan_type_id?: string | null
          policy_type_id?: string | null
          product_category?: string | null
          product_code: string
          product_id?: string
          product_name: string
          provider_id?: string | null
          regulatory_info?: Json | null
          updated_at?: string
          version?: number
        }
        Update: {
          addon_compatibility?: string[] | null
          base_premium?: number | null
          coverage_details?: Json | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          eligibility_criteria?: Json | null
          exclusions?: Json | null
          features?: Json | null
          is_active?: boolean
          lob_id?: string | null
          plan_type_id?: string | null
          policy_type_id?: string | null
          product_category?: string | null
          product_code?: string
          product_id?: string
          product_name?: string
          provider_id?: string | null
          regulatory_info?: Json | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_catalog_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "master_line_of_business"
            referencedColumns: ["lob_id"]
          },
          {
            foreignKeyName: "product_catalog_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "master_plan_types"
            referencedColumns: ["plan_type_id"]
          },
          {
            foreignKeyName: "product_catalog_policy_type_id_fkey"
            columns: ["policy_type_id"]
            isOneToOne: false
            referencedRelation: "master_policy_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_catalog_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "master_insurance_providers"
            referencedColumns: ["provider_id"]
          },
        ]
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
      products_unified: {
        Row: {
          commission_rule: Json | null
          coverage_config: Json | null
          created_at: string | null
          created_by: string | null
          eligibility_config: Json | null
          id: string
          is_active: boolean | null
          legacy_product_id: string | null
          lob_id: string | null
          name: string | null
          pricing_config: Json | null
          product_config: Json | null
          provider_id: string | null
          status: string | null
          tenant_id: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          commission_rule?: Json | null
          coverage_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          eligibility_config?: Json | null
          id?: string
          is_active?: boolean | null
          legacy_product_id?: string | null
          lob_id?: string | null
          name?: string | null
          pricing_config?: Json | null
          product_config?: Json | null
          provider_id?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          commission_rule?: Json | null
          coverage_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          eligibility_config?: Json | null
          id?: string
          is_active?: boolean | null
          legacy_product_id?: string | null
          lob_id?: string | null
          name?: string | null
          pricing_config?: Json | null
          product_config?: Json | null
          provider_id?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      revenue_allocation: {
        Row: {
          allocated_amount: number
          allocation_id: number
          earning_id: number | null
          org_id: number | null
          party: string
          share_percent: number
        }
        Insert: {
          allocated_amount: number
          allocation_id?: number
          earning_id?: number | null
          org_id?: number | null
          party: string
          share_percent: number
        }
        Update: {
          allocated_amount?: number
          allocation_id?: number
          earning_id?: number | null
          org_id?: number | null
          party?: string
          share_percent?: number
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: number
          role_id: number
          role_permission_id: number
        }
        Insert: {
          created_at?: string | null
          permission_id: number
          role_id: number
          role_permission_id?: number
        }
        Update: {
          created_at?: string | null
          permission_id?: number
          role_id?: number
          role_permission_id?: number
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
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          role_code: string
          role_id: number
          role_name: string
          status: string | null
          tenant_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          role_code: string
          role_id?: number
          role_name: string
          status?: string | null
          tenant_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          role_code?: string
          role_id?: number
          role_name?: string
          status?: string | null
          tenant_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      status_master: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          module: string
          sort_order: string | null
          status_code: string
          status_name: string
          workflow_order: number | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module: string
          sort_order?: string | null
          status_code: string
          status_name: string
          workflow_order?: number | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module?: string
          sort_order?: string | null
          status_code?: string
          status_name?: string
          workflow_order?: number | null
        }
        Relationships: []
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
      system_audit_results: {
        Row: {
          audit_id: string
          component_name: string
          details: Json | null
          error_message: string | null
          executed_at: string | null
          operation_type: string
          test_status: string
        }
        Insert: {
          audit_id?: string
          component_name: string
          details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          operation_type: string
          test_status: string
        }
        Update: {
          audit_id?: string
          component_name?: string
          details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          operation_type?: string
          test_status?: string
        }
        Relationships: []
      }
      tenant_employee_salaries: {
        Row: {
          base_salary: number
          bonus: number | null
          created_at: string | null
          effective_date: string
          employee_id: number
          increment_reason: string | null
          revised_by: number | null
          salary_id: number
        }
        Insert: {
          base_salary: number
          bonus?: number | null
          created_at?: string | null
          effective_date: string
          employee_id: number
          increment_reason?: string | null
          revised_by?: number | null
          salary_id?: number
        }
        Update: {
          base_salary?: number
          bonus?: number | null
          created_at?: string | null
          effective_date?: string
          employee_id?: number
          increment_reason?: string | null
          revised_by?: number | null
          salary_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_employee_salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "tenant_employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      tenant_employees: {
        Row: {
          created_at: string | null
          created_by: string | null
          department_id: number | null
          designation: string | null
          employee_id: number
          invitation_sent_at: string | null
          joining_date: string
          name: string
          official_email: string
          onboarding_status: string | null
          personal_email: string | null
          phone: string | null
          salary: number | null
          status: Database["public"]["Enums"]["employee_status"] | null
          tenant_id: number
          updated_at: string | null
          updated_by: string | null
          user_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department_id?: number | null
          designation?: string | null
          employee_id?: number
          invitation_sent_at?: string | null
          joining_date: string
          name: string
          official_email: string
          onboarding_status?: string | null
          personal_email?: string | null
          phone?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          tenant_id: number
          updated_at?: string | null
          updated_by?: string | null
          user_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department_id?: number | null
          designation?: string | null
          employee_id?: number
          invitation_sent_at?: string | null
          joining_date?: string
          name?: string
          official_email?: string
          onboarding_status?: string | null
          personal_email?: string | null
          phone?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          tenant_id?: number
          updated_at?: string | null
          updated_by?: string | null
          user_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_employees_user_account_id_fkey"
            columns: ["user_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_health_conditions: {
        Row: {
          category: string
          condition_name: string
          created_at: string
          created_by: string | null
          description: string | null
          is_active: boolean
          tenant_condition_id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
          waiting_period: string | null
        }
        Insert: {
          category: string
          condition_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          tenant_condition_id?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          waiting_period?: string | null
        }
        Update: {
          category?: string
          condition_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          tenant_condition_id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          waiting_period?: string | null
        }
        Relationships: []
      }
      tenant_insurance_providers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          notes: string | null
          provider_code: string
          provider_name: string
          state: string | null
          status: string | null
          tenant_id: string
          tenant_provider_id: string
          trade_name: string | null
          updated_at: string
          updated_by: string | null
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          notes?: string | null
          provider_code: string
          provider_name: string
          state?: string | null
          status?: string | null
          tenant_id: string
          tenant_provider_id?: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          notes?: string | null
          provider_code?: string
          provider_name?: string
          state?: string | null
          status?: string | null
          tenant_id?: string
          tenant_provider_id?: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      tenant_plan_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          is_active: boolean | null
          lob_id: string | null
          plan_type_name: string
          tenant_id: string
          tenant_plan_type_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          lob_id?: string | null
          plan_type_name: string
          tenant_id: string
          tenant_plan_type_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          lob_id?: string | null
          plan_type_name?: string
          tenant_id?: string
          tenant_plan_type_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_plan_types_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "master_line_of_business"
            referencedColumns: ["lob_id"]
          },
        ]
      }
      tenant_policy_types: {
        Row: {
          created_at: string
          created_by: string | null
          is_active: boolean | null
          policy_type_description: string | null
          policy_type_name: string
          tenant_id: string
          tenant_policy_type_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          is_active?: boolean | null
          policy_type_description?: string | null
          policy_type_name: string
          tenant_id: string
          tenant_policy_type_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          is_active?: boolean | null
          policy_type_description?: string | null
          policy_type_name?: string
          tenant_id?: string
          tenant_policy_type_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tenant_product_categories: {
        Row: {
          category_code: string
          category_desc: string | null
          category_name: string
          created_at: string
          created_by: string | null
          is_active: boolean
          tenant_category_id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_code: string
          category_desc?: string | null
          category_name: string
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          tenant_category_id?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_code?: string
          category_desc?: string | null
          category_name?: string
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          tenant_category_id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tenant_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          end_date: string
          id?: string
          plan_id: string
          start_date?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
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
        ]
      }
      tenants: {
        Row: {
          country: string
          created_at: string | null
          name: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          name: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          name?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          account_locked_until: string | null
          agent_id: number | null
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          employee_id: number | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          login_attempts: number | null
          metadata: Json | null
          must_change_password: boolean | null
          onboarding_completed: boolean | null
          password_changed_at: string | null
          role: string
          tenant_id: string
          updated_at: string
          user_type: string
        }
        Insert: {
          account_locked_until?: string | null
          agent_id?: number | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_attempts?: number | null
          metadata?: Json | null
          must_change_password?: boolean | null
          onboarding_completed?: boolean | null
          password_changed_at?: string | null
          role: string
          tenant_id: string
          updated_at?: string
          user_type: string
        }
        Update: {
          account_locked_until?: string | null
          agent_id?: number | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_attempts?: number | null
          metadata?: Json | null
          must_change_password?: boolean | null
          onboarding_completed?: boolean | null
          password_changed_at?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accounts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "user_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "tenant_employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      user_credentials: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_instances: {
        Row: {
          approvals: Json | null
          assigned_at: string | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          current_step: string
          due_date: string | null
          entity_id: string
          entity_type: string
          id: string
          legacy_entity_id: number | null
          status: string | null
          step_history: Json | null
          tenant_id: string
          updated_at: string | null
          workflow_config: Json
          workflow_type: string
        }
        Insert: {
          approvals?: Json | null
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step: string
          due_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          legacy_entity_id?: number | null
          status?: string | null
          step_history?: Json | null
          tenant_id: string
          updated_at?: string | null
          workflow_config: Json
          workflow_type: string
        }
        Update: {
          approvals?: Json | null
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step?: string
          due_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          legacy_entity_id?: number | null
          status?: string | null
          step_history?: Json | null
          tenant_id?: string
          updated_at?: string | null
          workflow_config?: Json
          workflow_type?: string
        }
        Relationships: []
      }
      workflow_tasks: {
        Row: {
          action_required: string
          assigned_to: string | null
          comments: string | null
          created_at: string | null
          module: string
          reference_id: string | null
          status: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          action_required: string
          assigned_to?: string | null
          comments?: string | null
          created_at?: string | null
          module: string
          reference_id?: string | null
          status?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Update: {
          action_required?: string
          assigned_to?: string | null
          comments?: string | null
          created_at?: string | null
          module?: string
          reference_id?: string | null
          status?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_payouts: {
        Row: {
          amount: number | null
          approved_by: string | null
          created_at: string | null
          org_id: string | null
          payment_ref: string | null
          payout_id: string | null
          request_date: string | null
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          amount?: number | null
          approved_by?: string | null
          created_at?: string | null
          org_id?: string | null
          payment_ref?: string | null
          payout_id?: string | null
          request_date?: string | null
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          amount?: number | null
          approved_by?: string | null
          created_at?: string | null
          org_id?: string | null
          payment_ref?: string | null
          payout_id?: string | null
          request_date?: string | null
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      vw_settlements: {
        Row: {
          approved_by: string | null
          created_at: string | null
          expected_amount: number | null
          insurer_id: string | null
          period: string | null
          received_amount: number | null
          settlement_id: string | null
          status: string | null
          tenant_id: string | null
          variance_amount: number | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          expected_amount?: number | null
          insurer_id?: string | null
          period?: string | null
          received_amount?: number | null
          settlement_id?: string | null
          status?: string | null
          tenant_id?: string | null
          variance_amount?: number | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          expected_amount?: number | null
          insurer_id?: string | null
          period?: string | null
          received_amount?: number | null
          settlement_id?: string | null
          status?: string | null
          tenant_id?: string | null
          variance_amount?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_permission: {
        Args: { p_action: string; p_module: string; p_user_id: string }
        Returns: boolean
      }
      complete_password_change: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
      complete_user_onboarding: {
        Args: { p_auth_user_id: string; p_invitation_token: string }
        Returns: Json
      }
      create_department: {
        Args: {
          p_branch_id?: number
          p_department_code: string
          p_department_name: string
          p_description?: string
          p_status?: string
          p_tenant_id?: number
        }
        Returns: undefined
      }
      create_system_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_temp_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_departments_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          branch_id: number
          created_at: string
          department_code: string
          department_id: number
          department_name: string
          description: string
          status: string
          tenant_id: number
          updated_at: string
        }[]
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
      get_tenant_roles: {
        Args: { p_tenant_id: string }
        Returns: {
          email: string
          first_name: string
          last_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
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
      update_department: {
        Args: {
          p_branch_id?: number
          p_department_code?: string
          p_department_id: number
          p_department_name?: string
          p_description?: string
          p_status?: string
          p_tenant_id?: number
        }
        Returns: undefined
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
      commission_status: "Active" | "Inactive"
      commission_type: "Flat" | "Slab" | "BusinessSlab" | "Tiered" | "Bonus"
      employee_status: "Active" | "Inactive"
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
      commission_status: ["Active", "Inactive"],
      commission_type: ["Flat", "Slab", "BusinessSlab", "Tiered", "Bonus"],
      employee_status: ["Active", "Inactive"],
      lob_status: ["Active", "Inactive"],
      location_status: ["Active", "Inactive"],
      premium_basis: ["PerPolicy", "PerMember"],
      premium_type: ["Flat", "PercentOfBase", "AgeBand", "Slab"],
      provider_status: ["Active", "Inactive", "Pending"],
      provider_type: ["Life", "General", "Health", "Composite"],
    },
  },
} as const
