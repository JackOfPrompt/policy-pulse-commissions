import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalCustomers: number;
  activePolicies: number;
  pendingCommissions: number;
  totalPremium: number;
  monthlyGrowth: number;
  recentPolicies: Array<{
    id: string;
    policy_number: string;
    customer_name: string;
    product_type: string;
    policy_status: string;
    created_at: string;
  }>;
  pendingExtractions: Array<{
    id: string;
    policy_number: string;
    customer_name: string;
    extractionStatus: string;
  }>;
}

export function useDashboardStats() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardStats>({
    totalCustomers: 0,
    activePolicies: 0,
    pendingCommissions: 0,
    totalPremium: 0,
    monthlyGrowth: 0,
    recentPolicies: [],
    pendingExtractions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    if (!profile?.org_id) return;
    
    setLoading(true);
    try {
      // Get customer count
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id);

      if (customerError) throw customerError;

      // Get policies with details  
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          policy_status,
          premium_with_gst,
          premium_without_gst,
          gross_premium,
          created_at
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;

      const activePolicies = policies?.filter(p => p.policy_status === 'active').length || 0;
      
      const totalPremium = policies?.reduce((sum, policy) => {
        const premium = policy.gross_premium || policy.premium_with_gst || policy.premium_without_gst || 0;
        return sum + Number(premium);
      }, 0) || 0;

      // Skip commission data for now since table doesn't exist
      const pendingCommissions = 0;

      // Recent policies (last 5)
      const recentPolicies = policies?.slice(0, 5).map(p => ({
        id: p.id,
        policy_number: p.policy_number,
        customer_name: 'Customer', // Will be populated once relations are fixed
        product_type: 'Policy', // Will be populated once relations are fixed
        policy_status: p.policy_status,
        created_at: p.created_at
      })) || [];

      setData({
        totalCustomers: customerCount || 0,
        activePolicies,
        pendingCommissions,
        totalPremium,
        monthlyGrowth: 0, // TODO: Calculate monthly growth
        recentPolicies,
        pendingExtractions: [] // TODO: Add extraction data
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.org_id) {
      fetchDashboardStats();
    }
  }, [profile?.org_id]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardStats
  };
}