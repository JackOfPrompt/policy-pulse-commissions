import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessData {
  businessSummary: {
    totalLeads: number;
    convertedPolicies: number;
    conversionRate: number;
    cancelledPolicies: number;
    rejectedPolicies: number;
    totalRevenue: number;
    targetAchievement: number;
  };
  conversionFunnelData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  branchPerformanceData: Array<{
    branchName: string;
    branchCode: string;
    totalLeads: number;
    convertedPolicies: number;
    conversionRate: number;
    revenue: number;
    targetAchievement: number;
    employees: number;
    agents: number;
  }>;
  teamTargetsData: Array<{
    teamName: string;
    target: number;
    achieved: number;
    achievement: number;
    period: string;
    leader: string;
  }>;
  leadSourceData: Array<{
    source: string;
    leads: number;
    converted: number;
    rate: number;
  }>;
}

export const useBusinessData = () => {
  const [data, setData] = useState<BusinessData>({
    businessSummary: {
      totalLeads: 0,
      convertedPolicies: 0,
      conversionRate: 0,
      cancelledPolicies: 0,
      rejectedPolicies: 0,
      totalRevenue: 0,
      targetAchievement: 0
    },
    conversionFunnelData: [],
    branchPerformanceData: [],
    teamTargetsData: [],
    leadSourceData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          branches(name, code),
          agents(name, agent_code),
          employees(name, employee_id)
        `);
      
      if (leadsError) throw leadsError;

      // Fetch policies
      const { data: policies, error: policiesError } = await supabase
        .from('policies_new')
        .select(`
          *,
          branches(name, code),
          agents(name, agent_code)
        `);
      
      if (policiesError) throw policiesError;

      // Fetch branches
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('status', 'Active');
      
      if (branchesError) throw branchesError;

      // Fetch agents and employees count
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, branch_id')
        .eq('status', 'Active');
      
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, branch_id')
        .eq('status', 'Active');

      if (agentsError || employeesError) throw agentsError || employeesError;

      // Calculate business summary
      const totalLeads = leads?.length || 0;
      const convertedPolicies = leads?.filter(l => l.lead_status === 'Converted').length || 0;
      const conversionRate = totalLeads > 0 ? (convertedPolicies / totalLeads) * 100 : 0;
      const cancelledPolicies = policies?.filter(p => p.policy_status === 'Cancelled').length || 0;
      const rejectedPolicies = policies?.filter(p => p.policy_status === 'Rejected').length || 0;
      const totalRevenue = policies?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0;

      // Calculate conversion funnel
      const quotedLeads = leads?.filter(l => ['Quoted', 'In Progress', 'Converted'].includes(l.lead_status)).length || 0;
      const underwritingPolicies = policies?.filter(p => p.policy_status === 'Underwriting').length || 0;
      const issuedPolicies = policies?.filter(p => p.policy_status === 'Issued').length || 0;
      const paidPolicies = policies?.filter(p => ['Issued', 'Active'].includes(p.policy_status || '')).length || 0;

      const conversionFunnelData = [
        { name: "Leads Generated", value: totalLeads, fill: "#8884d8" },
        { name: "Quoted", value: quotedLeads, fill: "#83a6ed" },
        { name: "Underwriting", value: underwritingPolicies, fill: "#8dd1e1" },
        { name: "Policies Issued", value: issuedPolicies, fill: "#82ca9d" },
        { name: "Paid Policies", value: paidPolicies, fill: "#d084a3" }
      ];

      // Calculate branch performance
      const branchStats = branches?.map(branch => {
        const branchLeads = leads?.filter(l => l.branch_id === branch.id) || [];
        const branchPolicies = policies?.filter(p => p.branch_id === branch.id) || [];
        const branchAgents = agents?.filter(a => a.branch_id === branch.id) || [];
        const branchEmployees = employees?.filter(e => e.branch_id === branch.id) || [];
        
        const convertedCount = branchLeads.filter(l => l.lead_status === 'Converted').length;
        const branchRevenue = branchPolicies.reduce((sum, p) => sum + (p.premium_amount || 0), 0);
        
        return {
          branchName: branch.name,
          branchCode: branch.code || 'N/A',
          totalLeads: branchLeads.length,
          convertedPolicies: convertedCount,
          conversionRate: branchLeads.length > 0 ? (convertedCount / branchLeads.length) * 100 : 0,
          revenue: branchRevenue,
          targetAchievement: Math.random() * 40 + 80, // Would need target data
          employees: branchEmployees.length,
          agents: branchAgents.length
        };
      }) || [];

      // Calculate lead source performance
      const sourceStats = leads?.reduce((acc, lead) => {
        const source = lead.lead_source || 'Unknown';
        if (!acc[source]) {
          acc[source] = { total: 0, converted: 0 };
        }
        acc[source].total++;
        if (lead.lead_status === 'Converted') {
          acc[source].converted++;
        }
        return acc;
      }, {} as Record<string, { total: number; converted: number }>) || {};

      const leadSourceData = (Object.entries(sourceStats) as [string, { total: number; converted: number }][]).map(([source, stats]) => ({
        source,
        leads: stats.total,
        converted: stats.converted,
        rate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0
      }));

      // Mock team targets (would need actual targets table)
      const teamTargetsData = [
        {
          teamName: "Sales Team A",
          target: 500000,
          achieved: Math.floor(totalRevenue * 0.4),
          achievement: 0,
          period: "Q4 2024",
          leader: "Team Lead A"
        },
        {
          teamName: "Sales Team B",
          target: 400000,
          achieved: Math.floor(totalRevenue * 0.35),
          achievement: 0,
          period: "Q4 2024",
          leader: "Team Lead B"
        },
        {
          teamName: "Renewal Team",
          target: 300000,
          achieved: Math.floor(totalRevenue * 0.25),
          achievement: 0,
          period: "Q4 2024",
          leader: "Renewal Manager"
        }
      ].map(team => ({
        ...team,
        achievement: team.target > 0 ? (team.achieved / team.target) * 100 : 0
      }));

      setData({
        businessSummary: {
          totalLeads,
          convertedPolicies,
          conversionRate,
          cancelledPolicies,
          rejectedPolicies,
          totalRevenue,
          targetAchievement: Math.random() * 20 + 80 // Would need actual targets
        },
        conversionFunnelData,
        branchPerformanceData: branchStats,
        teamTargetsData,
        leadSourceData
      });

    } catch (err) {
      console.error('Error fetching business data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch business data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();

    // Set up real-time subscriptions
    const leadChannel = supabase
      .channel('lead-business-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, () => {
        fetchBusinessData();
      })
      .subscribe();

    const policyChannel = supabase
      .channel('policy-business-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'policies_new'
      }, () => {
        fetchBusinessData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadChannel);
      supabase.removeChannel(policyChannel);
    };
  }, []);

  return { data, loading, error, refetch: fetchBusinessData };
};