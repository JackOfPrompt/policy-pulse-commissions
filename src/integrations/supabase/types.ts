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
          pan_card: string | null
          pan_url: string | null
          percentage: number | null
          phone: string | null
          pincode: string | null
          profile_doc: string | null
          qualification: string | null
          reference: string | null
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
          pan_card?: string | null
          pan_url?: string | null
          percentage?: number | null
          phone?: string | null
          pincode?: string | null
          profile_doc?: string | null
          qualification?: string | null
          reference?: string | null
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
          pan_card?: string | null
          pan_url?: string | null
          percentage?: number | null
          phone?: string | null
          pincode?: string | null
          profile_doc?: string | null
          qualification?: string | null
          reference?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
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
      business_types: {
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
          commission_rate: number
          created_at: string | null
          created_by: string | null
          family_size: number | null
          id: string
          is_active: boolean | null
          org_id: string
          plan_name: string
          product_sub_type: string
          product_type: string
          provider: string
          reward_rate: number
          sum_insured_max: number | null
          sum_insured_min: number | null
          updated_at: string | null
          updated_by: string | null
          valid_from: string
          valid_to: string | null
          version_no: number
        }
        Insert: {
          age_group?: string | null
          commission_rate: number
          created_at?: string | null
          created_by?: string | null
          family_size?: number | null
          id?: string
          is_active?: boolean | null
          org_id: string
          plan_name: string
          product_sub_type: string
          product_type: string
          provider: string
          reward_rate?: number
          sum_insured_max?: number | null
          sum_insured_min?: number | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
          version_no?: number
        }
        Update: {
          age_group?: string | null
          commission_rate?: number
          created_at?: string | null
          created_by?: string | null
          family_size?: number | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          plan_name?: string
          product_sub_type?: string
          product_type?: string
          provider?: string
          reward_rate?: number
          sum_insured_max?: number | null
          sum_insured_min?: number | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
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
          commission_end_date: string | null
          commission_rate: number
          commission_start_date: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          org_id: string
          plan_name: string | null
          plan_type: string | null
          ppt: number | null
          premium_end_price: number | null
          premium_start_price: number | null
          product_sub_type: string | null
          product_type: string
          provider: string
          pt: number | null
          reward_rate: number | null
          total_rate: number | null
          updated_at: string | null
          updated_by: string | null
          valid_from: string | null
          valid_to: string | null
          variable_end_date: string | null
          variable_start_date: string | null
          version_no: number
        }
        Insert: {
          commission_end_date?: string | null
          commission_rate: number
          commission_start_date?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id: string
          plan_name?: string | null
          plan_type?: string | null
          ppt?: number | null
          premium_end_price?: number | null
          premium_start_price?: number | null
          product_sub_type?: string | null
          product_type: string
          provider: string
          pt?: number | null
          reward_rate?: number | null
          total_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
          variable_end_date?: string | null
          variable_start_date?: string | null
          version_no?: number
        }
        Update: {
          commission_end_date?: string | null
          commission_rate?: number
          commission_start_date?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          plan_name?: string | null
          plan_type?: string | null
          ppt?: number | null
          premium_end_price?: number | null
          premium_start_price?: number | null
          product_sub_type?: string | null
          product_type?: string
          provider?: string
          pt?: number | null
          reward_rate?: number | null
          total_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
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
          pincode: string | null
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
          pincode?: string | null
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
          pincode?: string | null
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
        ]
      }
      motor_payout_grid: {
        Row: {
          business_type_id: number | null
          cc_range: string | null
          commission_rate: number
          coverage_type_id: number | null
          created_at: string | null
          created_by: string | null
          fuel_type_id: number | null
          gvw_range: string | null
          gwp_slab: string | null
          id: string
          is_active: boolean | null
          mcv_type: string | null
          ncb_percentage: number | null
          org_id: string
          pcv_type: string | null
          product_subtype: string
          product_type: string
          provider: string
          reward_rate: number | null
          rto_location: string | null
          updated_at: string | null
          updated_by: string | null
          valid_from: string
          valid_to: string | null
          vehicle_make: string | null
          vehicle_type_id: number | null
          version_no: number
        }
        Insert: {
          business_type_id?: number | null
          cc_range?: string | null
          commission_rate: number
          coverage_type_id?: number | null
          created_at?: string | null
          created_by?: string | null
          fuel_type_id?: number | null
          gvw_range?: string | null
          gwp_slab?: string | null
          id?: string
          is_active?: boolean | null
          mcv_type?: string | null
          ncb_percentage?: number | null
          org_id: string
          pcv_type?: string | null
          product_subtype: string
          product_type: string
          provider: string
          reward_rate?: number | null
          rto_location?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
          vehicle_make?: string | null
          vehicle_type_id?: number | null
          version_no?: number
        }
        Update: {
          business_type_id?: number | null
          cc_range?: string | null
          commission_rate?: number
          coverage_type_id?: number | null
          created_at?: string | null
          created_by?: string | null
          fuel_type_id?: number | null
          gvw_range?: string | null
          gwp_slab?: string | null
          id?: string
          is_active?: boolean | null
          mcv_type?: string | null
          ncb_percentage?: number | null
          org_id?: string
          pcv_type?: string | null
          product_subtype?: string
          product_type?: string
          provider?: string
          reward_rate?: number | null
          rto_location?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
          vehicle_make?: string | null
          vehicle_type_id?: number | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "motor_payout_grid_business_type_id_fkey"
            columns: ["business_type_id"]
            isOneToOne: false
            referencedRelation: "business_types"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "policies_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_commissions: {
        Row: {
          commission_amount: number | null
          commission_rate: number
          created_at: string | null
          created_by: string | null
          grid_id: string | null
          grid_table: string | null
          id: string
          is_active: boolean
          org_id: string
          payout_status: string | null
          policy_id: string
          product_type: string
          reward_amount: number | null
          reward_rate: number | null
          total_amount: number | null
          total_rate: number | null
          updated_at: string | null
          updated_by: string | null
          valid_from: string
          valid_to: string | null
          version_no: number
        }
        Insert: {
          commission_amount?: number | null
          commission_rate: number
          created_at?: string | null
          created_by?: string | null
          grid_id?: string | null
          grid_table?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          payout_status?: string | null
          policy_id: string
          product_type: string
          reward_amount?: number | null
          reward_rate?: number | null
          total_amount?: number | null
          total_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
          version_no?: number
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string | null
          created_by?: string | null
          grid_id?: string | null
          grid_table?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          payout_status?: string | null
          policy_id?: string
          product_type?: string
          reward_amount?: number | null
          reward_rate?: number | null
          total_amount?: number | null
          total_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_to?: string | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "policy_commissions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: true
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          category: string
          code: string
          created_at: string | null
          fields: Json | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          subtypes: Json | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          subtypes?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          subtypes?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      persist_policy_commission: {
        Args: { p_policy_id: string }
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
