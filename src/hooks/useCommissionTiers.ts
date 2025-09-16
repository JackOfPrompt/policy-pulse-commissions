import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommissionTier {
  id: string;
  name: string;
  description?: string;
  base_percentage: number;
  min_premium?: number;
  max_premium?: number;
  product_type_id?: string;
  provider_id?: string;
  is_active: boolean;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export function useCommissionTiers() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: tiers = [], isLoading, error } = useQuery({
    queryKey: ['commission-tiers', profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];
      
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('org_id', profile.org_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as CommissionTier[];
    },
    enabled: !!profile?.org_id,
  });

  const createTier = useMutation({
    mutationFn: async (tierData: Omit<CommissionTier, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
      if (!profile?.org_id) throw new Error('Organization ID not found');

      const { data, error } = await supabase
        .from('commission_tiers')
        .insert({
          ...tierData,
          org_id: profile.org_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, ...tierData }: Partial<CommissionTier> & { id: string }) => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .update(tierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commission_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
    },
  });

  return {
    tiers,
    isLoading,
    error,
    createTier,
    updateTier,
    deleteTier,
  };
}