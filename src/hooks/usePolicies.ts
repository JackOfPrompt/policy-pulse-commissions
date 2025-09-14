import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Policy {
  id: string;
  policy_number: string;
  customer_id: string;
  agent_id?: string;
  employee_id?: string;
  product_type_id: string;
  provider?: string;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  premium_without_gst?: number;
  gst?: number;
  premium_with_gst?: number;
  policy_status?: string;
  pdf_link?: string;
  dynamic_details?: any;
  org_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Related data
  customer?: any;
  agent?: any;
  employee?: any;
  product_type?: any;
}

export interface PolicyFormData {
  customer_id: string;
  agent_id?: string;
  employee_id?: string;
  product_type_id: string;
  policy_number: string;
  provider?: string;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  premium_without_gst?: number;
  gst?: number;
  premium_with_gst?: number;
  dynamic_details?: any;
}

export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('policies')
        .select(`
          *,
          customers(first_name, last_name, email, phone),
          agents(agent_name, email),
          employees(name, email),
          product_types(name, category)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch policies';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: PolicyFormData) => {
    try {
      // Get current user's org_id
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userOrg) throw new Error('User organization not found');

      const { data, error } = await supabase
        .from('policies')
        .insert({
          ...policyData,
          org_id: userOrg.org_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchPolicies();
      toast({
        title: "Success",
        description: "Policy created successfully",
      });
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create policy';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const updatePolicy = async (id: string, policyData: Partial<PolicyFormData>) => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .update({
          ...policyData,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchPolicies();
      toast({
        title: "Success",
        description: "Policy updated successfully",
      });
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update policy';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
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
      
      await fetchPolicies();
      toast({
        title: "Success",
        description: "Policy deleted successfully",
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete policy';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
  };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCustomers(data || []);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return { customers, loading };
}

export function useProductTypes() {
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('product_types')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setProductTypes(data || []);
      } catch (err) {
        console.error('Error fetching product types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductTypes();
  }, []);

  return { productTypes, loading };
}