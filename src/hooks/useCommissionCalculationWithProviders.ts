import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CommissionReportData {
  policy_id: string;
  policy_number: string;
  premium_amount: number;
  product_category: string;
  product_name: string;
  plan_name: string;
  provider: string;
  source_type: string;
  employee_id: string | null;
  employee_code: string | null;
  employee_name: string | null;
  agent_id: string | null;
  agent_code: string | null;
  agent_name: string | null;
  misp_id: string | null;
  misp_name: string | null;
  customer_name: string;
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
  agent_tier_percentage: number;
  tier_name: string | null;
  calc_date: string;
}

export function useCommissionCalculationWithProviders() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCommissionReport = async (): Promise<CommissionReportData[]> => {
    if (!profile?.org_id) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('calculate_comprehensive_commission_report_normalized', { 
          p_org_id: profile.org_id 
        });

      if (error) throw error;
      
      // Transform data to match CommissionReportData interface
      const transformedData: CommissionReportData[] = (data || []).map((record: any) => ({
        policy_id: record.policy_id || '',
        policy_number: record.policy_number || '',
        premium_amount: record.premium_amount || 0, // Now properly fetched from policy details
        product_category: record.product_category || '',
        product_name: record.product_name || '',
        plan_name: record.plan_name || '',
        provider: record.provider || '',
        source_type: record.source_type || '',
        employee_id: null, // This field is not returned by the function
        employee_code: null, // This field is not returned by the function
        employee_name: record.employee_name || null,
        agent_id: null, // This field is not returned by the function
        agent_code: null, // This field is not returned by the function
        agent_name: record.agent_name || null,
        misp_id: null, // This field is not returned by the function
        misp_name: record.misp_name || null,
        customer_name: record.customer_name || '',
        grid_table: record.grid_table || '',
        grid_id: record.grid_id || null,
        base_commission_rate: record.commission_rate || 0,
        reward_commission_rate: record.reward_rate || 0,
        bonus_commission_rate: 0,
        total_commission_rate: (record.commission_rate || 0) + (record.reward_rate || 0),
        insurer_commission: record.insurer_commission || 0,
        agent_commission: record.agent_commission || 0,
        misp_commission: record.misp_commission || 0,
        employee_commission: record.employee_commission || 0,
        reporting_employee_commission: 0,
        broker_share: record.broker_share || 0,
        agent_tier_percentage: 0,
        tier_name: null,
        calc_date: record.calc_date || new Date().toISOString()
      }));
      
      toast({
        title: "Success",
        description: "Commission report generated successfully",
      });
      
      return transformedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate commission report';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const syncCommissionData = async (): Promise<boolean> => {
    if (!profile?.org_id) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .rpc('sync_comprehensive_commissions_updated', { 
          p_org_id: profile.org_id 
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Commission data synchronized successfully",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync commission data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const calculatePolicyCommission = async (policyId: string): Promise<CommissionReportData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('calculate_comprehensive_commission_report_normalized', { 
          p_org_id: profile?.org_id,
          p_policy_id: policyId 
        });

      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      // Transform single record to match CommissionReportData interface
      const record = data[0];
      const transformedRecord: CommissionReportData = {
        policy_id: (record as any).policy_id || '',
        policy_number: (record as any).policy_number || '',
        premium_amount: (record as any).premium_amount || 0, // Now properly fetched from policy details
        product_category: (record as any).product_category || '',
        product_name: (record as any).product_name || '',
        plan_name: (record as any).plan_name || '',
        provider: (record as any).provider || '',
        source_type: (record as any).source_type || '',
        employee_id: null, // This field is not returned by the function
        employee_code: null, // This field is not returned by the function
        employee_name: null, // This field is not returned by the function
        agent_id: null, // This field is not returned by the function
        agent_code: null, // This field is not returned by the function
        agent_name: null, // This field is not returned by the function
        misp_id: null, // This field is not returned by the function
        misp_name: null, // This field is not returned by the function
        customer_name: '', // This field is not returned by the function
        grid_table: (record as any).grid_table || '',
        grid_id: (record as any).grid_id || null,
        base_commission_rate: (record as any).commission_rate || 0,
        reward_commission_rate: (record as any).reward_rate || 0,
        bonus_commission_rate: 0,
        total_commission_rate: ((record as any).commission_rate || 0) + ((record as any).reward_rate || 0),
        insurer_commission: (record as any).insurer_commission || 0,
        agent_commission: (record as any).agent_commission || 0,
        misp_commission: (record as any).misp_commission || 0,
        employee_commission: (record as any).employee_commission || 0,
        reporting_employee_commission: 0,
        broker_share: (record as any).broker_share || 0,
        agent_tier_percentage: 0,
        tier_name: null,
        calc_date: (record as any).calc_date || new Date().toISOString()
      };
      
      return transformedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate policy commission';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateCommissionReport,
    syncCommissionData,
    calculatePolicyCommission
  };
}