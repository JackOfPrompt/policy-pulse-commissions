import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinanceData {
  payoutSummary: {
    totalPending: number;
    totalApproved: number;
    totalPaid: number;
    totalHeld: number;
    agentCount: number;
  };
  reclaimSummary: {
    totalRecovered: number;
    totalPending: number;
    totalWaived: number;
    reclaimCount: number;
  };
  pendingPayouts: Array<{
    id: string;
    agentName: string;
    agentCode: string;
    amount: number;
    status: string;
    daysOverdue: number;
    policies: number;
    lastActivity: string;
  }>;
  reclaimItems: Array<{
    id: string;
    policyNumber: string;
    agentName: string;
    amount: number;
    status: string;
    reason: string;
    processedDate: string | null;
  }>;
}

export const useFinanceData = () => {
  const [data, setData] = useState<FinanceData>({
    payoutSummary: {
      totalPending: 0,
      totalApproved: 0,
      totalPaid: 0,
      totalHeld: 0,
      agentCount: 0
    },
    reclaimSummary: {
      totalRecovered: 0,
      totalPending: 0,
      totalWaived: 0,
      reclaimCount: 0
    },
    pendingPayouts: [],
    reclaimItems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch payout transactions
      const { data: payouts, error: payoutsError } = await supabase
        .from('payout_transactions')
        .select('*');
      
      if (payoutsError) throw payoutsError;

      // Fetch agents separately
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, agent_code');

      if (agentsError) throw agentsError;

      // Create agent lookup
      const agentLookup = agents?.reduce((acc, agent) => {
        acc[agent.id] = agent;
        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate payout summary
      const payoutSummary = {
        totalPending: payouts?.filter(p => p.payout_status === 'Pending').reduce((sum, p) => sum + (p.payout_amount || 0), 0) || 0,
        totalApproved: payouts?.filter(p => p.payout_status === 'Paid').reduce((sum, p) => sum + (p.payout_amount || 0), 0) || 0,
        totalPaid: payouts?.filter(p => p.payout_status === 'Paid').reduce((sum, p) => sum + (p.payout_amount || 0), 0) || 0,
        totalHeld: payouts?.filter(p => p.payout_status === 'On Hold').reduce((sum, p) => sum + (p.payout_amount || 0), 0) || 0,
        agentCount: new Set(payouts?.map(p => p.agent_id)).size || 0
      };

      // Process pending payouts
      const pendingPayouts = payouts?.filter(p => ['Pending', 'Paid'].includes(p.payout_status || ''))
        .map(payout => {
          const agent = agentLookup[payout.agent_id || ''];
          return {
            id: payout.payout_id || '',
            agentName: agent?.name || 'Unknown Agent',
            agentCode: agent?.agent_code || 'N/A',
            amount: payout.payout_amount || 0,
            status: payout.payout_status || 'Pending',
            daysOverdue: Math.floor((new Date().getTime() - new Date(payout.payout_date).getTime()) / (1000 * 60 * 60 * 24)),
            policies: 1,
            lastActivity: payout.updated_at || payout.created_at || ''
          };
        }) || [];

      // Fetch policies with Free Look Cancellation for reclaims
      const { data: policies, error: policiesError } = await supabase
        .from('policies_new')
        .select('*')
        .eq('policy_status', 'Free Look Cancellation');
      
      if (policiesError) throw policiesError;

      // Calculate reclaim summary and items
      const reclaimSummary = {
        totalRecovered: 0,
        totalPending: policies?.filter(p => p.payout_reversal_required).length || 0,
        totalWaived: 0,
        reclaimCount: policies?.length || 0
      };

      const reclaimItems = policies?.map((policy, index) => {
        const agent = agentLookup[policy.agent_id || ''];
        return {
          id: `RC-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          policyNumber: policy.policy_number || 'N/A',
          agentName: agent?.name || 'Unknown Agent',
          amount: policy.premium_amount ? policy.premium_amount * 0.1 : 0,
          status: policy.payout_reversal_required ? 'Pending' : 'Recovered',
          reason: 'Free Look Cancellation',
          processedDate: policy.payout_reversal_required ? null : policy.updated_at
        };
      }) || [];

      setData({
        payoutSummary,
        reclaimSummary,
        pendingPayouts,
        reclaimItems
      });

    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();

    // Set up real-time subscriptions
    const payoutChannel = supabase
      .channel('payout-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payout_transactions'
      }, () => {
        fetchFinanceData();
      })
      .subscribe();

    const policyChannel = supabase
      .channel('policy-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'policies_new'
      }, () => {
        fetchFinanceData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(payoutChannel);
      supabase.removeChannel(policyChannel);
    };
  }, []);

  return { data, loading, error, refetch: fetchFinanceData };
};