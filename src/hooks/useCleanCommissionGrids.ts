import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PayoutGrid {
  id: string;
  org_id: string;
  product_type: string;
  provider?: string;
  provider_id?: string;
  min_premium?: number;
  max_premium?: number;
  commission_rate: number;
  reward_rate?: number;
  bonus_commission_rate?: number;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export function useCleanCommissionGrids(gridType: 'life' | 'health' | 'motor' = 'life') {
  const [data, setData] = useState<PayoutGrid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getTableName = () => {
    switch (gridType) {
      case 'life':
        return 'life_payout_grid';
      case 'health':
        return 'health_payout_grid';
      case 'motor':
        return 'motor_payout_grid';
      default:
        return 'life_payout_grid';
    }
  };

  const fetchGrids = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: grids, error: gridsError } = await supabase
        .from(getTableName())
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (gridsError) throw gridsError;

      setData(grids || []);
    } catch (err) {
      console.error('Error fetching grids:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grids';
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

  useEffect(() => {
    fetchGrids();
  }, [gridType]);

  return {
    data,
    loading,
    error,
    fetchGrids,
  };
}