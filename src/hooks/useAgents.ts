import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Agent {
  id: string;
  org_id: string;
  employee_id?: string;
  agent_code?: string;
  agent_type?: string;
  agent_name: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  reference?: string;
  phone?: string;
  mobilepermissions?: boolean;
  email?: string;
  emailpermissions?: boolean;
  address?: string;
  landmark?: string; // Adding missing property
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  pan_card?: string;
  aadhar_card?: string;
  pan_url?: string;
  aadhar_url?: string;
  degree_doc?: string;
  degree_doc_url?: string; // Adding missing property
  cheque_doc?: string;
  cheque_doc_url?: string; // Adding missing property
  profile_doc?: string;
  profile_doc_url?: string; // Adding missing property
  other_doc?: string;
  other_doc_url?: string; // Adding missing property
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_type?: string;
  branch_name?: string;
  percentage?: number;
  status?: string;
  kyc_status?: string; // Adding missing property
  agent_plan_id?: string; // Adding missing property
  delete_flag?: boolean; // Adding missing property
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // For backwards compatibility
  created_date?: string;
  updated_date?: string;
}

export interface AgentPlan {
  id: string;
  name: string;
  description?: string;
  features?: any;
  commission_percentage?: number;
  created_at: string;
}

export interface Qualification {
  id: number;
  name: string;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: Partial<Agent>) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert(agentData as any)
        .select()
        .single();

      if (error) throw error;
      
      await fetchAgents(); // Refresh the list
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agent';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateAgent = async (id: string, agentData: Partial<Agent>) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update(agentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchAgents(); // Refresh the list
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchAgents(); // Refresh the list
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agent';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}

export function useAgentPlans() {
  const [plans, setPlans] = useState<AgentPlan[]>([]);
  const [loading, setLoading] = useState(false);

  return { plans, loading };
}

export function useQualifications() {
  const [qualifications, setQualifications] = useState<Qualification[]>([
    { id: 1, name: "High School" },
    { id: 2, name: "Bachelor's Degree" },
    { id: 3, name: "Master's Degree" }
  ]);
  const [loading, setLoading] = useState(false);

  return { qualifications, loading };
}