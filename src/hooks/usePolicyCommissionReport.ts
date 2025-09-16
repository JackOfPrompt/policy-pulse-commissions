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

      // Build the base query with joins
      let query = supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          premium_with_gst,
          premium_without_gst,
          provider,
          policy_status,
          start_date,
          end_date,
          source_type,
          created_at,
          customers!inner(
            first_name,
            last_name,
            company_name
          ),
          product_types!inner(
            name,
            category
          ),
          policy_commissions!inner(
            product_type,
            commission_rate,
            reward_rate,
            commission_amount,
            reward_amount,
            total_amount,
            payout_status
          ),
          agents!policies_agent_id_fkey(
            agent_name
          ),
          employees(
            name
          ),
          misps(
            channel_partner_name
          )
        `, { count: 'exact' });

      // Apply role-based filtering
      if (profile?.role === 'admin' && profile?.org_id) {
        query = query.eq('org_id', profile.org_id);
      } else if (profile?.role === 'employee' && profile?.id) {
        query = query.eq('employee_id', profile.id);
      } else if (profile?.role === 'agent' && profile?.id) {
        query = query.eq('agent_id', profile.id);
      } else if (profile?.role !== 'super_admin') {
        // Regular users can only see their own policies
        query = query.eq('customer_id', profile?.id);
      }

      // Apply filters
      if (filters.productType) {
        query = query.eq('product_types.category', filters.productType);
      }
      
      if (filters.sourceType) {
        query = query.eq('source_type', filters.sourceType);
      }
      
      if (filters.policyStatus) {
        query = query.eq('policy_status', filters.policyStatus);
      }
      
      if (filters.provider) {
        query = query.eq('provider', filters.provider);
      }
      
      if (filters.dateFrom) {
        query = query.gte('start_date', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('start_date', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(
          `policy_number.ilike.%${filters.search}%,customers.first_name.ilike.%${filters.search}%,customers.last_name.ilike.%${filters.search}%,customers.company_name.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data: policies, error: policiesError, count } = await query;

      if (policiesError) throw policiesError;

      // Transform the data
      const transformedData: PolicyCommissionRecord[] = policies?.map((policy: any) => {
        const customer = policy.customers;
        const productType = policy.product_types;
        const commission = policy.policy_commissions?.[0] || {};
        
        const customerName = customer?.company_name || 
          `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 
          'Unknown Customer';

        let sourceName = 'Direct';
        if (policy.source_type === 'agent' && policy.agents) {
          sourceName = policy.agents.agent_name;
        } else if (policy.source_type === 'employee' && policy.employees) {
          sourceName = policy.employees.name;
        } else if (policy.source_type === 'misp' && policy.misps) {
          sourceName = policy.misps.channel_partner_name;
        }

        // Calculate distribution percentages (simplified - could be more complex based on org rules)
        const orgAdminShare = 20; // 20% to org admin
        const sourceShare = policy.source_type ? 70 : 0; // 70% to source (agent/employee/misp)
        const remainingShare = 100 - orgAdminShare - sourceShare; // remainder distributed

        return {
          policy_id: policy.id,
          policy_number: policy.policy_number,
          customer_name: customerName,
          product_type: productType?.name || 'Unknown',
          product_category: commission.product_type || productType?.category || 'Unknown',
          gross_premium: parseFloat(policy.premium_with_gst || policy.premium_without_gst || '0'),
          net_premium: parseFloat(policy.premium_without_gst || policy.premium_with_gst || '0'),
          commission_rate: parseFloat(commission.commission_rate || '0'),
          commission_amount: parseFloat(commission.commission_amount || '0'),
          reward_rate: parseFloat(commission.reward_rate || '0'),
          reward_amount: parseFloat(commission.reward_amount || '0'),
          total_commission: parseFloat(commission.total_amount || '0'),
          source_type: policy.source_type,
          source_name: sourceName,
          policy_status: policy.policy_status,
          policy_start_date: policy.start_date,
          policy_end_date: policy.end_date,
          provider: policy.provider || 'Unknown',
          created_at: policy.created_at,
          payout_status: commission.payout_status || 'pending',
          org_admin_share: orgAdminShare,
          agent_share: policy.source_type === 'agent' ? sourceShare : 0,
          misp_share: policy.source_type === 'misp' ? sourceShare : 0,
          employee_share: policy.source_type === 'employee' ? sourceShare : remainingShare,
        };
      }) || [];

      setData(transformedData);
      setTotalRecords(count || 0);
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