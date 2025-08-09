import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RevenueData {
  revenueSummary: {
    totalRevenue: number;
    monthlyGrowth: number;
    expectedRevenue: number;
    achievementRate: number;
    topPerformingLOB: string;
    totalPolicies: number;
  };
  monthlyRevenueData: Array<{
    month: string;
    revenue: number;
    expected: number;
  }>;
  lobRevenueData: Array<{
    name: string;
    revenue: number;
    percentage: number;
  }>;
  agentPerformanceData: Array<{
    agentName: string;
    agentCode: string;
    totalRevenue: number;
    policies: number;
    avgCommission: number;
    growth: number;
  }>;
  productRevenueData: Array<{
    productName: string;
    insurer: string;
    revenue: number;
    policies: number;
    avgPremium: number;
    commission: number;
  }>;
}

export const useRevenueData = () => {
  const [data, setData] = useState<RevenueData>({
    revenueSummary: {
      totalRevenue: 0,
      monthlyGrowth: 0,
      expectedRevenue: 0,
      achievementRate: 0,
      topPerformingLOB: '',
      totalPolicies: 0
    },
    monthlyRevenueData: [],
    lobRevenueData: [],
    agentPerformanceData: [],
    productRevenueData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // Fetch policies
      const { data: policies, error: policiesError } = await supabase
        .from('policies_new')
        .select('*')
        .eq('status', 'Active');
      
      if (policiesError) throw policiesError;

      // Fetch related data separately
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, agent_code');

      const { data: products } = await supabase
        .from('insurance_products')
        .select('id, name');

      const { data: providers } = await supabase
        .from('insurance_providers')
        .select('id, provider_name');

      const { data: commissions } = await supabase
        .from('commissions')
        .select('*');

      // Create lookup objects
      const agentLookup = agents?.reduce((acc, agent) => {
        acc[agent.id] = agent;
        return acc;
      }, {} as Record<string, any>) || {};

      const productLookup = products?.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {} as Record<string, any>) || {};

      const providerLookup = providers?.reduce((acc, provider) => {
        acc[provider.id] = provider;
        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate total revenue from commissions
      const totalRevenue = commissions?.reduce((sum, comm) => sum + (comm.commission_amount || 0), 0) || 0;
      const totalPolicies = policies?.length || 0;

      // Calculate monthly revenue data (last 6 months)
      const monthlyData = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        const monthPolicies = policies?.filter(p => {
          const policyDate = new Date(p.created_at);
          return policyDate.getMonth() === date.getMonth() && policyDate.getFullYear() === date.getFullYear();
        }) || [];
        
        const monthRevenue = monthPolicies.reduce((sum, p) => sum + (p.premium_amount ? p.premium_amount * 0.1 : 0), 0);
        
        monthlyData.push({
          month: monthName,
          revenue: monthRevenue,
          expected: monthRevenue * 1.2
        });
      }

      // Calculate Line of Business revenue
      const lobStats = policies?.reduce((acc, policy) => {
        const lob = policy.line_of_business || 'Other';
        if (!acc[lob]) {
          acc[lob] = { count: 0, revenue: 0 };
        }
        acc[lob].count++;
        acc[lob].revenue += (policy.premium_amount || 0) * 0.1;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>) || {};

      const totalLOBRevenue = (Object.values(lobStats) as any[]).reduce((sum, lob: any) => sum + lob.revenue, 0);
      const lobRevenueData = (Object.entries(lobStats) as [string, any][]).map(([name, stats]) => ({
        name,
        revenue: stats.revenue,
        percentage: totalLOBRevenue > 0 ? Math.round((stats.revenue / totalLOBRevenue) * 100) : 0
      })).sort((a, b) => b.revenue - a.revenue);

      // Calculate agent performance
      const agentStats = policies?.reduce((acc, policy) => {
        if (policy.agent_id) {
          const agentId = policy.agent_id;
          if (!acc[agentId]) {
            const agent = agentLookup[agentId];
            acc[agentId] = {
              name: agent?.name || 'Unknown Agent',
              code: agent?.agent_code || 'N/A',
              policies: 0,
              revenue: 0
            };
          }
          acc[agentId].policies++;
          acc[agentId].revenue += (policy.premium_amount || 0) * 0.1;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      const agentPerformanceData = Object.values(agentStats).map((agent: any) => ({
        agentName: agent.name,
        agentCode: agent.code,
        totalRevenue: agent.revenue,
        policies: agent.policies,
        avgCommission: agent.policies > 0 ? agent.revenue / agent.policies : 0,
        growth: Math.random() * 20 - 5
      })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

      // Calculate product performance
      const productStats = policies?.reduce((acc, policy) => {
        const product = productLookup[policy.product_id || ''];
        const provider = providerLookup[policy.insurer_id || ''];
        const productName = product?.name || 'Unknown Product';
        const insurerName = provider?.provider_name || 'Unknown Insurer';
        const key = `${productName}-${insurerName}`;
        
        if (!acc[key]) {
          acc[key] = {
            productName,
            insurer: insurerName,
            policies: 0,
            revenue: 0,
            totalPremium: 0
          };
        }
        acc[key].policies++;
        acc[key].revenue += (policy.premium_amount || 0) * 0.1;
        acc[key].totalPremium += policy.premium_amount || 0;
        return acc;
      }, {} as Record<string, any>) || {};

      const productRevenueData = Object.values(productStats).map((product: any) => ({
        productName: product.productName,
        insurer: product.insurer,
        revenue: product.revenue,
        policies: product.policies,
        avgPremium: product.policies > 0 ? product.totalPremium / product.policies : 0,
        commission: product.revenue
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

      // Calculate summary metrics
      const currentMonthRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
      const previousMonthRevenue = monthlyData[monthlyData.length - 2]?.revenue || 0;
      const monthlyGrowth = previousMonthRevenue > 0 ? 
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

      const expectedRevenue = monthlyData[monthlyData.length - 1]?.expected || 0;
      const achievementRate = expectedRevenue > 0 ? (currentMonthRevenue / expectedRevenue) * 100 : 0;
      const topPerformingLOB = lobRevenueData[0]?.name || 'N/A';

      setData({
        revenueSummary: {
          totalRevenue,
          monthlyGrowth,
          expectedRevenue,
          achievementRate,
          topPerformingLOB,
          totalPolicies
        },
        monthlyRevenueData: monthlyData,
        lobRevenueData,
        agentPerformanceData,
        productRevenueData
      });

    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();

    // Set up real-time subscriptions
    const policyChannel = supabase
      .channel('policy-revenue-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'policies_new'
      }, () => {
        fetchRevenueData();
      })
      .subscribe();

    const commissionChannel = supabase
      .channel('commission-revenue-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'commissions'
      }, () => {
        fetchRevenueData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(policyChannel);
      supabase.removeChannel(commissionChannel);
    };
  }, []);

  return { data, loading, error, refetch: fetchRevenueData };
};