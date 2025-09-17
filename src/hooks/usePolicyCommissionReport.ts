import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PolicyCommissionRecord {
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_type: string;
  product_category: string;
  gross_premium: number;
  net_premium: number;
  commission_rate: number;
  commission_amount: number;
  reward_rate: number;
  reward_amount: number;
  total_commission: number;
  source_type: 'agent' | 'employee' | 'misp' | null;
  source_name: string;
  policy_status: string;
  policy_start_date: string;
  policy_end_date: string;
  provider: string;
  created_at: string;
  payout_status: string;
  org_admin_share: number;
  agent_share: number;
  misp_share: number;
  employee_share: number;
  tier_name?: string;
  override_used?: boolean;
}

export interface PolicyCommissionFilters {
  productType?: string;
  sourceType?: string;
  policyStatus?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function usePolicyCommissionReport(filters: PolicyCommissionFilters = {}) {
  const { profile } = useAuth();
  const [data, setData] = useState<PolicyCommissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchPolicyCommissions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Use revenue table data for policy commission reports
      let query: any = supabase
        .from('revenue_table')
        .select('*', { count: 'exact' });

      // Apply role-based filtering
      if (profile?.role === 'admin' && profile?.org_id) {
        query = query.eq('org_id', profile.org_id);
      } else if (profile?.role === 'employee' && profile?.id) {
        query = query.eq('employee_id', profile.id);
      } else if (profile?.role === 'agent' && profile?.id) {
        query = query.eq('agent_id', profile.id);
      } else if (profile?.role !== 'super_admin' && profile?.id) {
        // Regular users can only see their own policies - but revenue table doesn't have customer_id
        // For now, we'll restrict to empty results for customers until we fix the revenue table structure
        query = query.eq('policy_id', '00000000-0000-0000-0000-000000000000'); // Force empty result
      }

      // Apply filters  
      if (filters.productType) {
        query = query.eq('product_type', filters.productType);
      }
      
      if (filters.sourceType) {
        query = query.eq('source_type', filters.sourceType);
      }
      
      if (filters.provider) {
        query = query.eq('provider', filters.provider);
      }
      
      if (filters.dateFrom) {
        query = query.gte('calc_date', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('calc_date', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(
          `policy_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,agent_name.ilike.%${filters.search}%,employee_name.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by calc_date desc
      query = query.order('calc_date', { ascending: false });

      const { data: revenueRecords, error: revenueError, count } = await query;

      if (revenueError) throw revenueError;

      let records: any[] = revenueRecords || [];
      let totalCount = count || 0;

      // If empty, try to sync revenue table and retry
      if (records.length === 0 && profile?.org_id) {
        await supabase.rpc('sync_revenue_table_comprehensive', { p_org_id: profile.org_id });

        const { data: retry1, error: retryErr1, count: count1 } = await supabase
          .from('revenue_table')
          .select('*', { count: 'exact' })
          .eq('org_id', profile.org_id)
          .order('calc_date', { ascending: false })
          .range(from, to);

        if (retryErr1) throw retryErr1;
        records = retry1 || [];
        totalCount = count1 || 0;

        // Fallback to legacy sync if still empty
        if (records.length === 0) {
          await supabase.rpc('sync_revenue_table', { p_org_id: profile.org_id });

          const { data: retry2, error: retryErr2, count: count2 } = await supabase
            .from('revenue_table')
            .select('*', { count: 'exact' })
            .eq('org_id', profile.org_id)
            .order('calc_date', { ascending: false })
            .range(from, to);

          if (retryErr2) throw retryErr2;
          records = retry2 || [];
          totalCount = count2 || 0;
        }
      }

      // Transform the revenue table data to match the expected interface
      const transformedData: PolicyCommissionRecord[] = records?.map((record: any) => {
        const sourceName = record.employee_name || record.agent_name || record.misp_name || 'Direct';
        
        return {
          policy_id: record.policy_id || record.id,
          policy_number: record.policy_number,
          customer_name: record.customer_name || 'Unknown Customer',
          product_type: record.product_type,
          product_category: record.product_type,
          gross_premium: parseFloat(record.premium || '0'),
          net_premium: parseFloat(record.premium || '0'), 
          commission_rate: parseFloat(record.base_rate || '0'),
          commission_amount: parseFloat(record.insurer_commission || '0'),
          reward_rate: parseFloat(record.reward_rate || '0'),
          reward_amount: parseFloat(record.insurer_commission || '0') * parseFloat(record.reward_rate || '0') / 100,
          total_commission: parseFloat(record.insurer_commission || '0'),
          source_type: record.source_type,
          source_name: sourceName,
          policy_status: 'active', // Revenue table only has active policies
          policy_start_date: record.calc_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          policy_end_date: '',
          provider: record.provider || 'Unknown',
          created_at: record.calc_date,
          payout_status: record.commission_status || 'calculated',
          org_admin_share: 100 - (record.source_type ? 70 : 0), // Simplified calculation
          agent_share: record.source_type === 'agent' ? 70 : 0,
          misp_share: record.source_type === 'misp' ? 70 : 0,
          employee_share: record.source_type === 'employee' ? 70 : 0,
          tier_name: undefined,
          override_used: false,
        };
      }) || [];

      setData(transformedData);
      setTotalRecords(totalCount);
      setCurrentPage(page);

    } catch (err) {
      console.error('Error fetching policy commission report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch policy commission data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = [
      'Policy Number',
      'Customer Name', 
      'Product Type',
      'Product Category',
      'Gross Premium',
      'Net Premium',
      'Commission Rate (%)',
      'Commission Amount',
      'Reward Rate (%)', 
      'Reward Amount',
      'Total Commission',
      'Source Type',
      'Source Name',
      'Policy Status',
      'Start Date',
      'End Date',
      'Provider',
      'Payout Status',
      'Org Admin Share (%)',
      'Agent Share (%)',
      'MISP Share (%)',
      'Employee Share (%)'
    ];

    const csvData = data.map(record => [
      record.policy_number,
      record.customer_name,
      record.product_type,
      record.product_category,
      record.gross_premium.toFixed(2),
      record.net_premium.toFixed(2),
      record.commission_rate.toFixed(2),
      record.commission_amount.toFixed(2),
      record.reward_rate.toFixed(2),
      record.reward_amount.toFixed(2),
      record.total_commission.toFixed(2),
      record.source_type || 'Direct',
      record.source_name,
      record.policy_status,
      record.policy_start_date,
      record.policy_end_date,
      record.provider,
      record.payout_status,
      record.org_admin_share,
      record.agent_share,
      record.misp_share,
      record.employee_share
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `policy-commission-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchPolicyCommissions(1);
  }, [filters, profile?.id]);

  return {
    data,
    loading,
    error,
    totalRecords,
    currentPage,
    pageSize,
    fetchPolicyCommissions,
    exportToCSV,
    totals: {
      totalCommission: data.reduce((sum, record) => sum + record.total_commission, 0),
      totalPremium: data.reduce((sum, record) => sum + record.gross_premium, 0),
      count: data.length
    }
  };
}