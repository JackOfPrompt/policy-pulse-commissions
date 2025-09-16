import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedCommissionResult {
  policy_id: string;
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
  commission_status: string;
  matched_grid_id: string | null;
}

export interface Provider {
  id: string;
  name: string;
  code: string;
  provider_type: string;
  is_active: boolean;
}

export interface Agent {
  id: string;
  agent_name: string;
  agent_code: string;
  percentage: number;
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

export function useEnhancedCommissionCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateEnhancedCommission = async (policyId: string): Promise<EnhancedCommissionResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('calculate_comprehensive_commission_report', { p_policy_id: policyId });

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        toast({
          title: "Commission Calculated",
          description: `Total commission: ₹${result.insurer_commission?.toLocaleString() || '0'} (Base: ${result.base_rate}%, Reward: ${result.reward_rate}%, Bonus: ${result.bonus_rate}%)`,
        });
        
        // Convert to expected interface format
        const enhancedResult: EnhancedCommissionResult = {
          policy_id: result.policy_id,
          base_commission_rate: result.base_rate,
          reward_commission_rate: result.reward_rate,
          bonus_commission_rate: result.bonus_rate,
          total_commission_rate: result.total_rate,
          insurer_commission: result.insurer_commission,
          agent_commission: result.agent_commission,
          misp_commission: result.misp_commission,
          employee_commission: result.employee_commission,
          reporting_employee_commission: result.reporting_employee_commission,
          broker_share: result.broker_share,
          commission_status: 'calculated',
          matched_grid_id: result.grid_id,
        };
        
        return enhancedResult;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate commission';
      setError(errorMessage);
      toast({
        title: "Calculation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveEnhancedCommission = async (
    policyId: string,
    commissionData: Omit<EnhancedCommissionResult, 'policy_id'>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .rpc('save_policy_commission_enhanced', {
          p_policy_id: policyId,
          p_insurer_commission: commissionData.insurer_commission,
          p_agent_commission: commissionData.agent_commission,
          p_misp_commission: commissionData.misp_commission,
          p_employee_commission: commissionData.employee_commission,
          p_broker_share: commissionData.broker_share,
          p_commission_rate: commissionData.total_commission_rate,
          p_grid_id: commissionData.matched_grid_id,
          p_status: commissionData.commission_status
        });

      if (error) throw error;

      toast({
        title: "Commission Saved",
        description: "Commission calculation has been saved successfully",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save commission';
      setError(errorMessage);
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getProviders = async (): Promise<Provider[]> => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
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
        .select('id, agent_name, agent_code, percentage')
        .eq('status', 'active')
        .order('agent_name');

      if (error) throw error;
      return data || [];
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
        .order('channel_partner_name');

      if (error) throw error;
      return data || [];
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
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching employees:', err);
      return [];
    }
  };

  return {
    loading,
    error,
    calculateEnhancedCommission,
    saveEnhancedCommission,
    getProviders,
    getAgents,
    getMISPs,
    getEmployees,
  };
}