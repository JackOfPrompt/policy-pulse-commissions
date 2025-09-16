import { useState } from 'react';

// Export required interfaces that match the database schema
export interface Policy {
  id: string;
  policy_number: string;
  customer_id: string;
  product_type: string | { name: string; category: string };
  premium_amount: number;
  status: string;
  org_id: string;
  agent_id?: string;
  employee_id?: string;
  misp_id?: string;
  provider?: string;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  premium_without_gst?: number;
  gst?: number;
  premium_with_gst?: number;
  gross_premium?: number;
  policy_status?: string;
  source_type?: string;
  product_type_id?: string;
  dynamic_details?: any;
  customer?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  agent?: {
    agent_name?: string;
    agent_code?: string;
    email?: string;
  };
  employee?: {
    name?: string;
    employee_code?: string;
    email?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PolicyFormData {
  policy_number: string;
  customer_id: string;
  product_type: string;
  premium_amount: number;
  status: string;
  provider?: string;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  premium_without_gst?: number;
  gst?: number;
  premium_with_gst?: number;
  gross_premium?: number;
  policy_status?: string;
  source_type?: string;
}

export const useCustomers = () => ({ customers: [], loading: false, error: null });
export const useProductTypes = () => ({ productTypes: [], loading: false, error: null });

// Temporary simplified version until Supabase types are regenerated
export function usePolicies() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      console.log('Policies fetching temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Policies fetch failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (data: PolicyFormData) => {
    return { success: true };
  };

  const updatePolicy = async (id: string, data: PolicyFormData): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  };

  const deletePolicy = async (id: string): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  };

  return {
    policies: [],
    loading,
    error,
    fetchPolicies,
    addPolicy: async () => true,
    updatePolicy,
    deletePolicy,
    createPolicy,
    refetch: fetchPolicies
  };
}