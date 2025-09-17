import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Policy {
  id: string;
  org_id: string;
  customer_id: string;
  agent_id?: string;
  employee_id?: string;
  misp_id?: string;
  policy_number: string;
  plan_name?: string;
  provider?: string;
  policy_status: string;
  product_type_id: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  premium_without_gst?: number;
  gst?: number;
  premium_with_gst?: number;
  gross_premium?: number;
  source_type?: string;
  created_at: string;
  updated_at: string;
  dynamic_details?: any;
  // Legacy field names for backward compatibility
  customer?: {
    first_name: string;
    last_name: string;
    company_name?: string;
  };
  product_type?: {
    name: string;
    category: string;
  };
  agent?: {
    agent_name: string;
    email?: string;
  };
  employee?: {
    name: string;
    email?: string;
  };
  // New proper field names
  customers?: {
    first_name: string;
    last_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  product_types?: {
    name: string;
    category: string;
  };
}

export interface PolicyFormData {
  customer_id: string;
  policy_number: string;
  product_type_id: string;
  plan_name?: string;
  provider?: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  premium_without_gst?: number;
  gst?: number;
  premium_with_gst?: number;
  gross_premium?: number;
  source_type?: string;
  agent_id?: string;
  employee_id?: string;
  misp_id?: string;
}

export function usePolicies() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    if (!profile?.org_id) return;
    
    setLoading(true);
    try {
      // First get policies data
      const { data: policiesData, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;

      // Get related data separately
      const [productTypesResult, customersResult, agentsResult, employeesResult] = await Promise.all([
        supabase.from('product_types').select('id, name, category'),
        supabase.from('customers').select('id, first_name, last_name, email, phone, company_name'),
        supabase.from('agents').select('id, agent_name, email'),
        supabase.from('employees').select('id, name, email')
      ]);

      // Create lookup maps
      const productTypesMap = new Map(productTypesResult.data?.map(pt => [pt.id, pt]) || []);
      const customersMap = new Map(customersResult.data?.map(c => [c.id, c]) || []);
      const agentsMap = new Map(agentsResult.data?.map(a => [a.id, a]) || []);
      const employeesMap = new Map(employeesResult.data?.map(e => [e.id, e]) || []);

      // Transform the data to include related information
      const transformedData = (policiesData as any[])?.map(policy => ({
        ...policy,
        // Legacy field names for backward compatibility
        product_type: productTypesMap.get(policy.product_type_id),
        customer: customersMap.get(policy.customer_id),
        agent: policy.agent_id ? agentsMap.get(policy.agent_id) : null,
        employee: policy.employee_id ? employeesMap.get(policy.employee_id) : null
      })) || [];
      
      setPolicies(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: PolicyFormData) => {
    if (!profile?.org_id) return false;
    
    try {
      const { data, error } = await supabase
        .from('policies')
        .insert({
          ...policyData,
          org_id: profile.org_id,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Policy created successfully"
      });
      
      await fetchPolicies();
      return true;
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create policy',
        variant: "destructive"
      });
      return false;
    }
  };

  const updatePolicy = async (id: string, policyData: Partial<PolicyFormData>) => {
    try {
      const { error } = await supabase
        .from('policies')
        .update({
          ...policyData,
          updated_by: profile.id
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Policy updated successfully"
      });
      
      await fetchPolicies();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update policy';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Policy deleted successfully"
      });
      
      await fetchPolicies();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete policy';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [profile?.org_id]);

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    refetch: fetchPolicies
  };
}

export function useCustomers() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    if (!profile?.org_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [profile?.org_id]);

  return { customers, loading, fetchCustomers };
}

export function useProductTypes() {
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProductTypes(data || []);
    } catch (err) {
      console.error('Failed to fetch product types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  return { productTypes, data: productTypes, loading, fetchProductTypes, refetch: fetchProductTypes };
}