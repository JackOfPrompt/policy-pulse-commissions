import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PolicyCommissionCalculation {
  policy_id: string;
  commission_rate: number;
  commission_amount: number;
  matched_grid_id: string | null;
  calculation_status: string;
}

export interface CommissionGridMatch {
  id: string;
  product_type: string;
  product_subtype?: string;
  provider?: string;
  commission_rate: number;
  min_premium?: number;
  max_premium?: number;
  effective_from: string;
  effective_to?: string;
}

export function usePolicyCommissionCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculatePolicyCommission = async (policyId: string): Promise<PolicyCommissionCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      // Use the enhanced comprehensive commission calculation
      const { data, error } = await supabase
        .rpc('calculate_enhanced_comprehensive_commission_report', { p_policy_id: policyId });

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        toast({
          title: "Commission Calculated",
          description: `Commission calculated: ${result.total_commission_rate}% (₹${result.insurer_commission?.toLocaleString() || '0'})`,
        });

        // Convert to expected format
        return {
          policy_id: result.policy_id,
          commission_rate: result.total_commission_rate,
          commission_amount: result.insurer_commission,
          matched_grid_id: result.grid_id,
          calculation_status: 'calculated'
        };
      }

      return null;
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

  const recalculateAllCommissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the enhanced comprehensive sync function
      const { error } = await supabase
        .rpc('sync_enhanced_comprehensive_commissions');

      if (error) throw error;

      toast({
        title: "Commissions Recalculated",
        description: "All policy commissions have been recalculated using the comprehensive calculation system",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to recalculate commissions';
      setError(errorMessage);
      toast({
        title: "Recalculation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCommissionGridsForPolicy = async (policyId: string): Promise<CommissionGridMatch[]> => {
    try {
      // Deprecated: unified commission_grids table removed. No matching grids to return here.
      return [];
    } catch (err) {
      console.error('Error fetching commission grids for policy:', err);
      return [];
    }
  };

  const refreshCommissionData = async () => {
    try {
      setLoading(true);
      
      // Trigger a refresh of commission data by calling the recalculation function
      const { error } = await supabase
        .rpc('recalculate_all_policy_commissions_with_grids');

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error refreshing commission data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    calculatePolicyCommission,
    recalculateAllCommissions,
    getCommissionGridsForPolicy,
    refreshCommissionData,
  };
}