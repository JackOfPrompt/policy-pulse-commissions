import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnifiedCommission {
  id: string;
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_type: string;
  premium_amount: number;
  source_type: string;
  source_name: string;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

export function useUnifiedCommissions() {
  const { profile } = useAuth();
  const [commissions, setCommissions] = useState<UnifiedCommission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnifiedCommissions = async () => {
    if (!profile?.org_id) return;
    
    setLoading(true);
    try {
      // Get policies with basic commission data
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          premium_with_gst,
          premium_without_gst,
          gross_premium,
          source_type,
          created_at
        `)
        .eq('org_id', profile.org_id)
        .eq('policy_status', 'active')
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;

      // Transform policies into commission records
      const commissionData: UnifiedCommission[] = policies?.map(policy => {
        const premium = policy.gross_premium || policy.premium_with_gst || policy.premium_without_gst || 0;
        const customerName = 'Customer'; // Will be populated when relations are available
        
        // Calculate basic commission (5% default)
        const commissionRate = 5.0;
        const commissionAmount = premium * (commissionRate / 100);

        return {
          id: policy.id,
          policy_id: policy.id,
          policy_number: policy.policy_number,
          customer_name: customerName,
          product_type: 'Policy', // Will be populated when relations are available
          premium_amount: premium,
          source_type: policy.source_type || 'direct',
          source_name: policy.source_type || 'Direct Sale',
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          status: 'calculated',
          created_at: policy.created_at
        };
      }) || [];

      setCommissions(commissionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnifiedCommissions();
  }, [profile?.org_id]);

  return {
    commissions,
    loading,
    error,
    fetchUnifiedCommissions,
    refetch: fetchUnifiedCommissions
  };
}