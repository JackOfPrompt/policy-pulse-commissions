import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [data, setData] = useState<DashboardStats>({
    totalCustomers: 0,
    activePolicies: 0,
    pendingCommissions: 0,
    totalPremium: 0,
    monthlyGrowth: 0,
    recentPolicies: [],
    pendingExtractions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's organization
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userOrg) throw new Error('User organization not found');

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', userOrg.org_id);

      // Fetch active policies count and details
      const { data: policies, count: policiesCount } = await supabase
        .from('policies')
        .select(`
          *,
          customers!inner(first_name, last_name),
          product_types!inner(name)
        `, { count: 'exact' })
        .eq('org_id', userOrg.org_id)
        .eq('policy_status', 'active');

      // Calculate total premium from active policies
      const totalPremium = policies?.reduce((sum, policy) => {
        return sum + (policy.premium_with_gst || policy.premium_without_gst || 0);
      }, 0) || 0;

      // Get recent policies (last 5)
      const recentPolicies = policies?.slice(0, 5).map(policy => ({
        id: policy.id,
        policy_number: policy.policy_number,
        customer_name: `${policy.customers.first_name} ${policy.customers.last_name || ''}`.trim(),
        product_type: policy.product_types.name,
        policy_status: policy.policy_status,
        created_at: policy.created_at
      })) || [];

      // Get pending commissions
      const { data: commissions } = await supabase
        .from('policy_commissions')
        .select('total_amount')
        .eq('org_id', userOrg.org_id)
        .eq('commission_status', 'calculated')
        .eq('payout_status', 'pending');

      const pendingCommissions = commissions?.reduce((sum, comm) => 
        sum + (comm.total_amount || 0), 0) || 0;

      // Mock monthly growth for now (can be calculated from historical data)
      const monthlyGrowth = 12.5;

      setData({
        totalCustomers: customersCount || 0,
        activePolicies: policiesCount || 0,
        pendingCommissions,
        totalPremium,
        monthlyGrowth,
        recentPolicies,
        pendingExtractions: [] // No extraction status in current schema
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardStats
  };
}