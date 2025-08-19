import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsFilters {
  dateRange: string;
  granularity: string;
  state?: string;
  branch?: string;
  product?: string[];
  policyType?: string;
  team?: string;
  agent?: string;
  channel?: string;
  customerSegment?: string;
  insurer?: string;
  claimStatus?: string;
  compareMode?: string;
  currency: string;
  gstToggle: boolean;
}

export interface KPIData {
  activePolicies: number;
  gwp: number;
  collectedPremium: number;
  newPolicies: number;
  renewalsDue: number;
  renewalRate: number;
  claimsIntimated: number;
  claimsRatio: number;
  receivables: number;
  netPnL: number;
}

export interface PremiumTrendData {
  month: string;
  gwp: number;
  collected: number;
  claims: number;
}

export const useAnalytics = (filters: AnalyticsFilters) => {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [premiumTrend, setPremiumTrend] = useState<PremiumTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = async () => {
    try {
      const dateRange = getDateRange(filters.dateRange);
      
      // GWP calculation using your exact query
      const { data: gwpData, error: gwpError } = await supabase
        .from('fact_premiums')
        .select('premium_amount, gst_amount')
        .eq('tenant_id', 1)
        .in('txn_type', ['issue', 'renewal'])
        .gte('txn_date', dateRange.start)
        .lte('txn_date', dateRange.end);

      if (gwpError) throw gwpError;

      const gwp = gwpData?.reduce((sum, row) => sum + (row.premium_amount || 0), 0) || 0;
      const gstAmount = gwpData?.reduce((sum, row) => sum + (row.gst_amount || 0), 0) || 0;

      // Active policies count
      const { data: policyData, error: policyError } = await supabase
        .from('fact_premiums')
        .select('policy_id')
        .eq('tenant_id', 1)
        .gte('txn_date', dateRange.start)
        .lte('txn_date', dateRange.end);

      if (policyError) throw policyError;
      const activePolicies = new Set(policyData?.map(row => row.policy_id)).size;

      // New policies count
      const { data: newPolicyData, error: newPolicyError } = await supabase
        .from('fact_premiums')
        .select('policy_id')
        .eq('tenant_id', 1)
        .eq('txn_type', 'issue')
        .gte('txn_date', dateRange.start)
        .lte('txn_date', dateRange.end);

      if (newPolicyError) throw newPolicyError;
      const newPolicies = newPolicyData?.length || 0;

      // Renewal rate calculation using fact_renewal_events
      const { data: renewalData, error: renewalError } = await supabase
        .from('fact_renewal_events')
        .select('renewed')
        .eq('tenant_id', 1)
        .gte('due_date', dateRange.start)
        .lte('due_date', dateRange.end);

      if (renewalError) throw renewalError;
      
      const totalRenewals = renewalData?.length || 0;
      const successfulRenewals = renewalData?.filter(r => r.renewed).length || 0;
      const renewalRate = totalRenewals > 0 ? (successfulRenewals / totalRenewals) * 100 : 0;

      // Claims ratio calculation
      const { data: claimsData, error: claimsError } = await supabase
        .from('fact_claims')
        .select('settlement_amount')
        .eq('tenant_id', 1)
        .not('decision_date', 'is', null)
        .gte('decision_date', dateRange.start)
        .lte('decision_date', dateRange.end);

      if (claimsError) throw claimsError;
      
      const incurredClaims = claimsData?.reduce((sum, row) => sum + (row.settlement_amount || 0), 0) || 0;
      const claimsRatio = gwp > 0 ? (incurredClaims / gwp) * 100 : 0;

      // Receivables calculation
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('fact_invoices')
        .select('amount_due, amount_paid, due_date')
        .eq('tenant_id', 1)
        .in('status', ['Open', 'Unpaid']);

      if (invoiceError) throw invoiceError;
      
      const receivables = invoiceData?.reduce((sum, row) => 
        sum + ((row.amount_due || 0) - (row.amount_paid || 0)), 0) || 0;

      // Collected premium calculation
      const collectedPremium = gwp - receivables;

      const kpiData: KPIData = {
        activePolicies,
        gwp: filters.gstToggle ? gwp + gstAmount : gwp,
        collectedPremium: filters.gstToggle ? collectedPremium + (gstAmount * 0.92) : collectedPremium,
        newPolicies,
        renewalsDue: totalRenewals,
        renewalRate: Math.round(renewalRate * 10) / 10,
        claimsIntimated: claimsData?.length || 0,
        claimsRatio: Math.round(claimsRatio * 10) / 10,
        receivables,
        netPnL: gwp * 0.15, // Mock calculation - would need proper P&L table
      };

      setKpis(kpiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KPIs');
    }
  };

  const fetchPremiumTrend = async () => {
    try {
      // GWP by month using your exact query structure
      const { data, error } = await supabase
        .from('fact_premiums')
        .select('premium_amount, gst_amount, txn_date')
        .eq('tenant_id', 1)
        .in('txn_type', ['issue', 'renewal'])
        .gte('txn_date', getDateRange('YTD').start)
        .lte('txn_date', getDateRange('YTD').end)
        .order('txn_date');

      if (error) throw error;

      // Group by month using date_trunc logic
      const monthlyData: { [key: string]: { gwp: number; collected: number; claims: number } } = {};
      
      data?.forEach(row => {
        const date = new Date(row.txn_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { gwp: 0, collected: 0, claims: 0 };
        }
        
        const amount = filters.gstToggle ? 
          (row.premium_amount + (row.gst_amount || 0)) : 
          row.premium_amount;
        monthlyData[monthKey].gwp += amount;
      });

      // Get claims data for each month
      const { data: claimsData, error: claimsError } = await supabase
        .from('fact_claims')
        .select('settlement_amount, decision_date')
        .eq('tenant_id', 1)
        .not('decision_date', 'is', null)
        .gte('decision_date', getDateRange('YTD').start)
        .lte('decision_date', getDateRange('YTD').end);

      if (claimsError) throw claimsError;

      // Add claims data to monthly aggregation
      claimsData?.forEach(row => {
        if (row.decision_date) {
          const date = new Date(row.decision_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].claims += row.settlement_amount || 0;
          }
        }
      });

      // Calculate collected premiums (simple collection rate for demo)
      Object.keys(monthlyData).forEach(monthKey => {
        monthlyData[monthKey].collected = monthlyData[monthKey].gwp * 0.92;
      });

      const trendData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, data]) => {
          const date = new Date(monthKey + '-01');
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            gwp: data.gwp,
            collected: data.collected,
            claims: data.claims,
          };
        });

      setPremiumTrend(trendData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch premium trend');
    }
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (range) {
      case 'today':
        return {
          start: now.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      case 'MTD':
        return {
          start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      case 'QTD':
        const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);
        return {
          start: quarterStart.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      case 'YTD':
        return {
          start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      default:
        return {
          start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchKPIs(),
        fetchPremiumTrend()
      ]);
      
      setLoading(false);
    };

    fetchData();

    // Set up realtime subscription for live updates
    const channel = supabase
      .channel('fact_premiums_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fact_premiums'
      }, () => {
        fetchData(); // Refresh data when changes occur
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters.dateRange, filters.gstToggle, filters.currency]);

  return {
    kpis,
    premiumTrend,
    loading,
    error,
    refetch: () => {
      fetchKPIs();
      fetchPremiumTrend();
    }
  };
};