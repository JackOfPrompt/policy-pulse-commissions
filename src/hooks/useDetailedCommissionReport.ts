import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DetailedCommissionRecord {
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_type: string;
  provider: string;
  premium_amount: number;
  commission_rate: number;
  commission_amount: number;
  total_amount: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  broker_share: number;
  source_type: string;
  source_name: string;
  tier_name?: string;
  override_used: boolean;
  commission_status: string;
  calc_date: string;
  policy_start_date: string;
  policy_end_date: string;
}

export interface CommissionFilters {
  product_type?: string;
  commission_status?: string;
  provider?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export function useDetailedCommissionReport(filters: CommissionFilters = {}) {
  const { profile } = useAuth();
  const [data, setData] = useState<DetailedCommissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetailedCommissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get commission data from policy_commissions table directly
      let query = supabase
        .from('policy_commissions')
        .select(`
          *,
          policies!inner(
            policy_number,
            start_date,
            end_date,
            source_type,
            agent_id,
            misp_id,
            employee_id,
            premium_with_gst,
            premium_without_gst,
            gross_premium,
            provider,
            customers(
              first_name,
              last_name,
              company_name
            ),
            product_types(
              name,
              category
            )
          )
        `)
        .eq('is_active', true);

      // Apply org filter
      if (profile?.org_id) {
        query = query.eq('org_id', profile.org_id);
      }

      // Apply filters
      if (filters.product_type) {
        query = query.eq('product_type', filters.product_type);
      }

      if (filters.commission_status) {
        query = query.eq('commission_status', filters.commission_status);
      }

      if (filters.date_from) {
        query = query.gte('calc_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('calc_date', filters.date_to);
      }

      const { data: commissions, error } = await query.order('calc_date', { ascending: false });

      if (error) throw error;

      // Transform data to match DetailedCommissionRecord interface
      const transformedData: DetailedCommissionRecord[] = [];

      for (const commission of commissions || []) {
        const policy = commission.policies;
        if (!policy) continue;

        const premium = policy.gross_premium || policy.premium_with_gst || policy.premium_without_gst || 0;
        
        // Get customer name
        const customer = policy.customers;
        const customerName = customer?.company_name || 
          `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 
          'Unknown Customer';

        // Get source information and tier details
        let sourceName = 'Direct';
        let tierName: string | undefined;
        let overrideUsed = false;

        if (policy.source_type === 'agent' && policy.agent_id) {
          const { data: agent } = await supabase
            .from('agents')
            .select(`
              agent_name,
              override_percentage,
              commission_tiers(name)
            `)
            .eq('id', policy.agent_id)
            .maybeSingle();

          if (agent) {
            sourceName = agent.agent_name;
            if (agent.override_percentage) {
              overrideUsed = true;
            } else if (agent.commission_tiers) {
              tierName = agent.commission_tiers.name;
            }
          }
        } else if (policy.source_type === 'misp' && policy.misp_id) {
          const { data: misp } = await supabase
            .from('misps')
            .select(`
              channel_partner_name,
              override_percentage,
              commission_tiers(name)
            `)
            .eq('id', policy.misp_id)
            .maybeSingle();

          if (misp) {
            sourceName = misp.channel_partner_name;
            if (misp.override_percentage) {
              overrideUsed = true;
            } else if (misp.commission_tiers) {
              tierName = misp.commission_tiers.name;
            }
          }
        } else if (policy.source_type === 'employee' && policy.employee_id) {
          const { data: employee } = await supabase
            .from('employees')
            .select('name')
            .eq('id', policy.employee_id)
            .maybeSingle();

          if (employee) {
            sourceName = employee.name;
          }
        }

        const record: DetailedCommissionRecord = {
          policy_id: commission.policy_id,
          policy_number: policy.policy_number,
          customer_name: customerName,
          product_type: policy.product_types?.name || 'Unknown',
          provider: policy.provider || 'Unknown',
          premium_amount: premium,
          commission_rate: commission.commission_rate || 0,
          commission_amount: commission.commission_amount || 0,
          total_amount: commission.total_amount || 0,
          agent_commission: commission.agent_commission || 0,
          misp_commission: commission.misp_commission || 0,
          employee_commission: commission.employee_commission || 0,
          broker_share: commission.broker_share || 0,
          source_type: policy.source_type || 'direct',
          source_name: sourceName,
          tier_name: tierName,
          override_used: overrideUsed,
          commission_status: commission.commission_status || 'calculated',
          calc_date: commission.calc_date || commission.created_at,
          policy_start_date: policy.start_date,
          policy_end_date: policy.end_date,
        };

        // Apply search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const searchableText = `${record.policy_number} ${record.customer_name} ${record.source_name} ${record.provider}`.toLowerCase();
          if (!searchableText.includes(searchTerm)) {
            continue;
          }
        }

        // Apply provider filter
        if (filters.provider && record.provider !== filters.provider) {
          continue;
        }

        transformedData.push(record);
      }

      setData(transformedData);
    } catch (err) {
      console.error('Error fetching detailed commission report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch commission data');
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
      'Provider',
      'Premium Amount',
      'Commission Rate (%)',
      'Commission Amount',
      'Total Amount',
      'Agent Commission',
      'MISP Commission',
      'Employee Commission',
      'Broker Share',
      'Source Type',
      'Source Name',
      'Tier Name',
      'Override Used',
      'Status',
      'Calculation Date',
      'Policy Start',
      'Policy End'
    ];

    const csvData = data.map(record => [
      record.policy_number,
      record.customer_name,
      record.product_type,
      record.provider,
      record.premium_amount.toFixed(2),
      record.commission_rate.toFixed(2),
      record.commission_amount.toFixed(2),
      record.total_amount.toFixed(2),
      record.agent_commission.toFixed(2),
      record.misp_commission.toFixed(2),
      record.employee_commission.toFixed(2),
      record.broker_share.toFixed(2),
      record.source_type,
      record.source_name,
      record.tier_name || '-',
      record.override_used ? 'Yes' : 'No',
      record.commission_status,
      record.calc_date,
      record.policy_start_date,
      record.policy_end_date
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `detailed-commission-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotals = () => {
    return data.reduce((acc, record) => ({
      totalPremium: acc.totalPremium + record.premium_amount,
      totalCommission: acc.totalCommission + record.total_amount,
      totalAgentCommission: acc.totalAgentCommission + record.agent_commission,
      totalMispCommission: acc.totalMispCommission + record.misp_commission,
      totalEmployeeCommission: acc.totalEmployeeCommission + record.employee_commission,
      totalBrokerShare: acc.totalBrokerShare + record.broker_share,
      count: data.length
    }), {
      totalPremium: 0,
      totalCommission: 0,
      totalAgentCommission: 0,
      totalMispCommission: 0,
      totalEmployeeCommission: 0,
      totalBrokerShare: 0,
      count: 0
    });
  };

  useEffect(() => {
    if (profile?.org_id) {
      fetchDetailedCommissions();
    }
  }, [filters, profile?.org_id]);

  return {
    data,
    loading,
    error,
    refetch: fetchDetailedCommissions,
    exportToCSV,
    totals: getTotals()
  };
}