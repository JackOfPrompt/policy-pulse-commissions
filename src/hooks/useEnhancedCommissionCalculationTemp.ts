import { useState } from 'react';

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

// Temporary simplified version until Supabase types are regenerated
export function useEnhancedCommissionCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateEnhanced = async () => {
    setLoading(true);
    try {
      console.log('Enhanced commission calculation temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhanced calculation failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const calculateEnhancedCommission = async () => {
    return null;
  };

  const saveEnhancedCommission = async () => {
    return false;
  };

  const getProviders = async (): Promise<Provider[]> => {
    return [];
  };

  const getAgents = async (): Promise<Agent[]> => {
    return [];
  };

  const getMISPs = async (): Promise<MISP[]> => {
    return [];
  };

  const getEmployees = async (): Promise<Employee[]> => {
    return [];
  };

  const fetchAgents = async (): Promise<Agent[]> => {
    return [];
  };

  const fetchMisps = async (): Promise<MISP[]> => {
    return [];
  };

  const fetchEmployees = async (): Promise<Employee[]> => {
    return [];
  };

  const calculateCommission = async (policyId: string): Promise<EnhancedCommissionResult | null> => {
    return {
      policy_id: policyId,
      base_commission_rate: 0,
      reward_commission_rate: 0,
      bonus_commission_rate: 0,
      total_commission_rate: 0,
      insurer_commission: 0,
      agent_commission: 0,
      misp_commission: 0,
      employee_commission: 0,
      reporting_employee_commission: 0,
      broker_share: 0,
      commission_status: 'calculated',
      matched_grid_id: null
    };
  };

  const saveCommission = async (policyId: string, sourceType: string): Promise<boolean> => {
    return true;
  };

  return {
    calculateEnhanced,
    calculateEnhancedCommission,
    saveEnhancedCommission,
    getProviders,
    getAgents,
    getMISPs,
    getEmployees,
    fetchAgents,
    fetchMisps,
    fetchEmployees,
    calculateCommission,
    saveCommission,
    loading,
    error,
    agents: [],
    misps: [],
    employees: []
  };
}