import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AgentStats {
  totalCommission: number;
  pendingPayouts: number;
  totalPolicies: number;
  freeLookReversals: number;
}

interface PayoutData {
  id: string;
  policy_number: string;
  product_name: string;
  premium_amount: number;
  commission_amount: number;
  payout_status: string;
  payout_date: string;
}

interface PolicyData {
  id: string;
  policy_number: string;
  customer_name: string;
  product_name: string;
  premium_amount: number;
  policy_status: string;
  commission_amount: number;
}

interface ChartData {
  month: string;
  commission: number;
  policies: number;
}

export const useAgentDashboardData = (dateRange: string) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats>({
    totalCommission: 0,
    pendingPayouts: 0,
    totalPolicies: 0,
    freeLookReversals: 0,
  });
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
      
      // Set up real-time subscriptions
      const policyChannel = supabase
        .channel('agent-policy-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'policies_new'
          },
          () => {
            console.log('Policy data changed, refreshing...');
            fetchDashboardData();
          }
        )
        .subscribe();

      const payoutChannel = supabase
        .channel('agent-payout-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payout_transactions'
          },
          () => {
            console.log('Payout data changed, refreshing...');
            fetchDashboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(policyChannel);
        supabase.removeChannel(payoutChannel);
      };
    }
  }, [user?.id, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date filter
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Find agent record
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (agentError) {
        throw new Error('Agent not found');
      }

      // Fetch policies sold by this agent
      const { data: policiesData, error: policiesError } = await supabase
        .from('policies_new')
        .select(`
          id,
          policy_number,
          premium_amount,
          policy_status,
          created_at,
          product_id,
          insurance_products(name),
          customer_name
        `)
        .eq('agent_id', agent.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (policiesError) {
        throw new Error('Failed to fetch policies');
      }

      // Fetch payout transactions for this agent
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payout_transactions')
        .select(`
          id,
          payout_amount,
          payout_status,
          payout_date,
          policy_id,
          policies_new(policy_number, premium_amount, insurance_products(name))
        `)
        .eq('agent_id', agent.id)
        .gte('payout_date', startDate.toISOString().split('T')[0])
        .order('payout_date', { ascending: false });

      if (payoutsError) {
        throw new Error('Failed to fetch payouts');
      }

      // Calculate stats
      const totalCommission = payoutsData?.reduce((sum, payout) => 
        sum + (payout.payout_status === 'Paid' ? payout.payout_amount : 0), 0) || 0;
      
      const pendingPayouts = payoutsData?.reduce((sum, payout) => 
        sum + (payout.payout_status === 'Pending' ? payout.payout_amount : 0), 0) || 0;
      
      const totalPolicies = policiesData?.length || 0;
      
      // Calculate free look reversals (policies with payout_reversal_required = true)
      const freeLookReversals = policiesData?.filter(policy => 
        policy.policy_status === 'Free Look Cancellation'
      ).length || 0;

      setStats({
        totalCommission,
        pendingPayouts,
        totalPolicies,
        freeLookReversals,
      });

      // Transform payouts data
      const transformedPayouts = payoutsData?.map(payout => ({
        id: payout.id,
        policy_number: (payout.policies_new as any)?.policy_number || 'N/A',
        product_name: (payout.policies_new as any)?.insurance_products?.name || 'Unknown Product',
        premium_amount: (payout.policies_new as any)?.premium_amount || 0,
        commission_amount: payout.payout_amount,
        payout_status: payout.payout_status,
        payout_date: payout.payout_date,
      })) || [];

      setPayouts(transformedPayouts);

      // Transform policies data
      const transformedPolicies = policiesData?.map(policy => ({
        id: policy.id,
        policy_number: policy.policy_number || 'N/A',
        customer_name: policy.customer_name || 'Unknown Customer',
        product_name: (policy.insurance_products as any)?.name || 'Unknown Product',
        premium_amount: policy.premium_amount || 0,
        policy_status: policy.policy_status || 'Unknown',
        commission_amount: (policy.premium_amount || 0) * 0.085, // Assuming 8.5% commission
      })) || [];

      setPolicies(transformedPolicies);

      // Generate chart data (monthly aggregation)
      const monthlyData = generateMonthlyChartData(payoutsData || [], policiesData || []);
      setChartData(monthlyData);

    } catch (err) {
      console.error('Error fetching agent dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyChartData = (payouts: any[], policies: any[]): ChartData[] => {
    const monthlyStats: { [key: string]: { commission: number; policies: number } } = {};
    
    // Aggregate commission data from payouts
    payouts.forEach(payout => {
      if (payout.payout_status === 'Paid') {
        const date = new Date(payout.payout_date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { commission: 0, policies: 0 };
        }
        
        monthlyStats[monthKey].commission += payout.payout_amount || 0;
      }
    });

    // Aggregate policy count
    policies.forEach(policy => {
      const date = new Date(policy.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { commission: 0, policies: 0 };
      }
      
      monthlyStats[monthKey].policies += 1;
    });

    return Object.entries(monthlyStats).map(([month, data]) => ({
      month: month.split(' ')[0], // Just the month abbreviation
      commission: data.commission,
      policies: data.policies,
    }));
  };

  return {
    loading,
    error,
    stats,
    payouts,
    policies,
    chartData,
    refreshData: fetchDashboardData,
  };
};