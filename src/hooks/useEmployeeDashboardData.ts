import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalPremium: number;
  totalPolicies: number;
  totalRevenue: number;
  policiesIssued: number;
  policiesUnderwriting: number;
  policiesRejected: number;
}

interface PolicyData {
  id: string;
  policy_number: string;
  customer_name: string;
  product_name: string;
  premium_amount: number;
  policy_status: string;
  created_at: string;
}

interface ChartData {
  month: string;
  premium: number;
  revenue: number;
}

export const useEmployeeDashboardData = (dateRange: string) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPremium: 0,
    totalPolicies: 0,
    totalRevenue: 0,
    policiesIssued: 0,
    policiesUnderwriting: 0,
    policiesRejected: 0,
  });
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('employee-dashboard-changes')
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

      return () => {
        supabase.removeChannel(channel);
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

      // Find employee record
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, branch_id')
        .eq('user_id', user?.id)
        .single();

      if (empError) {
        throw new Error('Employee not found');
      }

      // Fetch policies created by this employee or in their branch
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
        .or(`employee_id.eq.${employee.id},branch_id.eq.${employee.branch_id}`)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (policiesError) {
        throw new Error('Failed to fetch policies');
      }

      // Calculate stats
      const totalPremium = policiesData?.reduce((sum, policy) => sum + (policy.premium_amount || 0), 0) || 0;
      const totalPolicies = policiesData?.length || 0;
      const totalRevenue = totalPremium * 0.1; // Assuming 10% commission
      
      const statusCounts = policiesData?.reduce((acc, policy) => {
        const status = policy.policy_status;
        if (status === 'Issued') acc.issued++;
        else if (status === 'Underwriting') acc.underwriting++;
        else if (status === 'Rejected') acc.rejected++;
        return acc;
      }, { issued: 0, underwriting: 0, rejected: 0 }) || { issued: 0, underwriting: 0, rejected: 0 };

      setStats({
        totalPremium,
        totalPolicies,
        totalRevenue,
        policiesIssued: statusCounts.issued,
        policiesUnderwriting: statusCounts.underwriting,
        policiesRejected: statusCounts.rejected,
      });

      // Transform policies data
      const transformedPolicies = policiesData?.map(policy => ({
        id: policy.id,
        policy_number: policy.policy_number || 'N/A',
        customer_name: policy.customer_name || 'Unknown Customer',
        product_name: (policy.insurance_products as any)?.name || 'Unknown Product',
        premium_amount: policy.premium_amount || 0,
        policy_status: policy.policy_status || 'Unknown',
        created_at: policy.created_at,
      })) || [];

      setPolicies(transformedPolicies);

      // Generate chart data (monthly aggregation)
      const monthlyData = generateMonthlyChartData(policiesData || []);
      setChartData(monthlyData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyChartData = (policies: any[]): ChartData[] => {
    const monthlyStats: { [key: string]: { premium: number; revenue: number } } = {};
    
    policies.forEach(policy => {
      const date = new Date(policy.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { premium: 0, revenue: 0 };
      }
      
      monthlyStats[monthKey].premium += policy.premium_amount || 0;
      monthlyStats[monthKey].revenue += (policy.premium_amount || 0) * 0.1;
    });

    return Object.entries(monthlyStats).map(([month, data]) => ({
      month: month.split(' ')[0], // Just the month abbreviation
      premium: data.premium,
      revenue: data.revenue,
    }));
  };

  return {
    loading,
    error,
    stats,
    policies,
    chartData,
    refreshData: fetchDashboardData,
  };
};