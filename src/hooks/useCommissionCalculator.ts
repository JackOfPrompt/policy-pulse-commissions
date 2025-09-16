import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommissionResult {
  commission_rate: number;
  reward_rate: number;
  total_rate: number;
  product_type: string;
  calculation_status: string;
}

export interface CommissionCalculation {
  commission_rate: number;
  reward_rate: number;
  total_rate: number;
  commission_amount: number;
  reward_amount: number;
  total_amount: number;
  premium_base: number;
  product_type: string;
  calculation_status: string;
}

export function useCommissionCalculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateCommission = async (policyId: string): Promise<CommissionResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_commission', { p_policy_id: policyId });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        return {
          commission_rate: result.commission_rate,
          reward_rate: result.reward_rate,
          total_rate: result.total_rate,
          product_type: result.product_type,
          calculation_status: 'Success'
        };
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate commission';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateCommissionAmount = async (policyId: string): Promise<CommissionCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('calculate_commission_amount', { policy_id_param: policyId });

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0];
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate commission amount';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateAndSaveCommission = async (policyId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .rpc('manual_calculate_policy_commission', { p_policy_id: policyId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission calculated and saved successfully",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate and save commission';
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

  const recalculateAllCommissions = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .rpc('recalculate_all_policy_commissions');

      if (error) throw error;

      toast({
        title: "Success",
        description: "All policy commissions recalculated successfully",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to recalculate all commissions';
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

  const calculateBulkCommissions = async (policyIds: string[]): Promise<CommissionCalculation[]> => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.all(
        policyIds.map(async (policyId) => {
          const { data, error } = await supabase
            .rpc('calculate_commission_amount', { policy_id_param: policyId });

          if (error) throw error;
          return data && data.length > 0 ? data[0] : null;
        })
      );

      return results.filter((result): result is CommissionCalculation => result !== null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate bulk commissions';
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

  return {
    loading,
    error,
    calculateCommission,
    calculateCommissionAmount,
    calculateBulkCommissions,
    calculateAndSaveCommission,
    recalculateAllCommissions,
  };
}