import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommissionGrid {
  id: string;
  org_id: string;
  product_type: string;
  product_subtype?: string;
  provider?: string;
  provider_id?: string;
  min_premium?: number;
  max_premium?: number;
  commission_rate: number;
  reward_rate?: number;
  bonus_commission_rate?: number;
  effective_from: string;
  effective_to?: string;
  reward_effective_from?: string;
  reward_effective_to?: string;
  bonus_effective_from?: string;
  bonus_effective_to?: string;
  created_at: string;
  updated_at: string;
  conditions?: any;
  data_filters?: {
    age_range?: { min: number; max: number };
    sum_insured_range?: { min: number; max: number };
    policy_term_range?: { min: number; max: number };
    premium_payment_term_range?: { min: number; max: number };
    vehicle_type?: string[];
    coverage_type?: string[];
    business_type?: string[];
    region?: string[];
    custom_filters?: Record<string, any>;
  };
}

export interface CommissionGridFilters {
  product_type?: string;
  product_subtype?: string;
  provider_id?: string;
}

export function useCommissionGrids(filters: CommissionGridFilters = {}) {
  const [data, setData] = useState<CommissionGrid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCommissionGrids = async () => {
    try {
      setLoading(true);
      setError(null);

      const table = 'life_payout_grid';
      let query: any = supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.product_type) {
        query = query.eq('product_type', filters.product_type);
      }

      if (filters.product_subtype) {
        query = query.eq('product_subtype', filters.product_subtype);
      }

      if (filters.provider_id) {
        query = query.eq('provider_id', filters.provider_id);
      }

      const { data: grids, error: gridsError } = await query;

      if (gridsError) throw gridsError;

      setData((grids as any) || []);
    } catch (err) {
      console.error('Error fetching commission grids:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch commission grids';
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

  const createCommissionGrid = async (gridData: Omit<CommissionGrid, 'id' | 'org_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!userOrg) throw new Error('User organization not found');

      const table = 'life_payout_grid';
      const { error } = await supabase
        .from(table)
        .insert({
          ...(gridData as any),
          org_id: userOrg.org_id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission grid created successfully",
      });

      await fetchCommissionGrids();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create commission grid';
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

  const updateCommissionGrid = async (id: string, gridData: Partial<CommissionGrid>) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('life_payout_grid')
        .update(gridData as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission grid updated successfully",
      });

      await fetchCommissionGrids();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update commission grid';
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

  const deleteCommissionGrid = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('life_payout_grid')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission grid deleted successfully",
      });

      await fetchCommissionGrids();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete commission grid';
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

  useEffect(() => {
    fetchCommissionGrids();
  }, [filters.product_type, filters.product_subtype, filters.provider_id]);

  return {
    data,
    loading,
    error,
    fetchCommissionGrids,
    createCommissionGrid,
    updateCommissionGrid,
    deleteCommissionGrid,
  };
}