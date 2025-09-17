import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Export required interfaces
export interface Provider {
  id: string;
  name: string;
  code: string;
  provider_type: string;
  is_active: boolean;
}

export interface EnhancedCommissionResult {
  policy_id: string;
  policy_number: string;
  product_category: string;
  product_name: string;
  plan_name: string;
  provider: string;
  source_type: string;
  grid_table: string;
  grid_id: string | null;
  base_commission_rate: number;
  reward_commission_rate: number;
  bonus_commission_rate: number;
  total_commission_rate: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  reporting_employee_commission: number;
  broker_share: number;
  calc_date: string;
  commission_status?: string;
  matched_grid_id?: string | null;
}

export interface Agent {
  id: string;
  agent_name: string;
  agent_code: string;
  base_percentage: number;
}

export interface MISP {
  id: string;
  channel_partner_name: string;
  percentage: number;
}

export interface Employee {
  id: string;
  name: string;
  employee_code: string;
}

// Enhanced commission calculation using actual grids
export function useEnhancedCommissionCalculation() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [misps, setMisps] = useState<MISP[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const calculateEnhanced = async () => {
    if (!profile?.org_id) return [];
    
    setLoading(true);
    try {
      const { data, error: calcError } = await supabase
        .rpc('calculate_enhanced_comprehensive_commission_report', { 
          p_org_id: profile.org_id 
        });

      if (calcError) throw calcError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhanced calculation failed');
      toast({
        title: "Calculation Error",
        description: err instanceof Error ? err.message : 'Enhanced calculation failed',
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const calculateEnhancedCommission = async (policyId?: string) => {
    if (!policyId) return null;
    
    try {
      const { data, error } = await supabase
        .rpc('calculate_enhanced_comprehensive_commission_report', { 
          p_policy_id: policyId 
        });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.error('Enhanced commission calculation error:', err);
      return null;
    }
  };

  const saveEnhancedCommission = async (policyId?: string, commissionData?: any) => {
    if (!policyId || !commissionData) return false;
    
    try {
      const { error } = await supabase
        .rpc('save_policy_commission_enhanced', {
          p_policy_id: policyId,
          p_insurer_commission: commissionData.insurer_commission,
          p_agent_commission: commissionData.agent_commission,
          p_misp_commission: commissionData.misp_commission,
          p_employee_commission: commissionData.employee_commission,
          p_broker_share: commissionData.broker_share,
          p_commission_rate: commissionData.total_commission_rate,
          p_grid_id: commissionData.matched_grid_id
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Save commission error:', err);
      return false;
    }
  };

  const getProviders = async (): Promise<Provider[]> => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, code, provider_type, is_active')
        .eq('org_id', profile?.org_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching providers:', err);
      return [];
    }
  };

  const getAgents = async (): Promise<Agent[]> => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, agent_name, agent_code, base_percentage')
        .eq('org_id', profile?.org_id)
        .eq('status', 'active');

      if (error) throw error;
      const agents = data || [];
      setAgents(agents);
      return agents;
    } catch (err) {
      console.error('Error fetching agents:', err);
      return [];
    }
  };

  const getMISPs = async (): Promise<MISP[]> => {
    try {
      const { data, error } = await supabase
        .from('misps')
        .select('id, channel_partner_name, percentage')
        .eq('org_id', profile?.org_id);

      if (error) throw error;
      const misps = data || [];
      setMisps(misps);
      return misps;
    } catch (err) {
      console.error('Error fetching MISPs:', err);
      return [];
    }
  };

  const getEmployees = async (): Promise<Employee[]> => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_code')
        .eq('org_id', profile?.org_id)
        .eq('status', 'active');

      if (error) throw error;
      const employees = data || [];
      setEmployees(employees);
      return employees;
    } catch (err) {
      console.error('Error fetching employees:', err);
      return [];
    }
  };

  const calculateCommission = async (policyId: string): Promise<EnhancedCommissionResult | null> => {
    const result = await calculateEnhancedCommission(policyId);
    if (!result) return null;
    
    // Add missing properties for backward compatibility
    return {
      ...result,
      commission_status: 'calculated',
      matched_grid_id: result.grid_id
    };
  };

  const saveCommission = async (policyId: string, sourceType: string): Promise<boolean> => {
    const commissionData = await calculateEnhancedCommission(policyId);
    if (!commissionData) return false;
    
    return saveEnhancedCommission(policyId, commissionData);
  };

  return {
    calculateEnhanced,
    calculateEnhancedCommission,
    saveEnhancedCommission,
    getProviders,
    getAgents,
    getMISPs,
    getEmployees,
    fetchAgents: getAgents,
    fetchMisps: getMISPs,
    fetchEmployees: getEmployees,
    calculateCommission,
    saveCommission,
    loading,
    error,
    agents,
    misps,
    employees
  };
}