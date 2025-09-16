import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RevenueRecord {
  id: string;
  policy_id: string;
  policy_number: string;
  provider: string;
  product_type: string;
  source_type: string;
  employee_id?: string;
  agent_id?: string;
  misp_id?: string;
  employee_name?: string;
  agent_name?: string;
  misp_name?: string;
  reporting_employee_id?: string;
  reporting_employee_name?: string;
  customer_name: string;
  org_id: string;
  premium: number;
  base_rate: number;
  reward_rate: number;
  bonus_rate: number;
  total_rate: number;
  insurer_commission: number;
  agent_commission: number;
  employee_commission: number;
  reporting_employee_commission: number;
  broker_share: number;
  commission_status: string;
  calc_date: string;
}

export function useRevenueTable() {
  const { profile } = useAuth();
  const [data, setData] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncRevenueTable = async () => {
    if (!profile?.org_id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Call the sync function
      const { error: syncError } = await supabase.rpc('sync_revenue_table', {
        p_org_id: profile.org_id
      });

      if (syncError) throw syncError;

      // Fetch the updated data
      await fetchRevenueData();
    } catch (err) {
      console.error('Error syncing revenue table:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync revenue data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    if (!profile?.org_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data: revenueData, error } = await supabase
        .from('revenue_table')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('calc_date', { ascending: false });

      if (error) throw error;

      setData(revenueData || []);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  const getTotals = () => {
    return data.reduce((acc, record) => ({
      totalPremium: acc.totalPremium + (record.premium || 0),
      totalInsurer: acc.totalInsurer + (record.insurer_commission || 0),
      totalAgent: acc.totalAgent + (record.agent_commission || 0),
      totalEmployee: acc.totalEmployee + (record.employee_commission || 0),
      totalMisp: acc.totalMisp + (record.misp_commission || 0),
      totalBroker: acc.totalBroker + (record.broker_share || 0),
      avgBaseRate: acc.count > 0 ? (acc.avgBaseRate * acc.count + (record.base_rate || 0)) / (acc.count + 1) : record.base_rate || 0,
      avgRewardRate: acc.count > 0 ? (acc.avgRewardRate * acc.count + (record.reward_rate || 0)) / (acc.count + 1) : record.reward_rate || 0,
      avgBonusRate: acc.count > 0 ? (acc.avgBonusRate * acc.count + (record.bonus_rate || 0)) / (acc.count + 1) : record.bonus_rate || 0,
      count: acc.count + 1
    }), {
      totalPremium: 0,
      totalInsurer: 0,
      totalAgent: 0,
      totalEmployee: 0,
      totalMisp: 0,
      totalBroker: 0,
      avgBaseRate: 0,
      avgRewardRate: 0,
      avgBonusRate: 0,
      count: 0
    });
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = [
      'Policy Number',
      'Customer Name',
      'Product Type',
      'Provider',
      'Source Type',
      'Employee Name',
      'Agent Name',
      'MISP Name',
      'Reporting Employee',
      'Premium',
      'Base Rate (%)',
      'Reward Rate (%)',
      'Bonus Rate (%)',
      'Total Rate (%)',
      'Insurer Commission',
      'Agent Commission',
      'Employee Commission',
      'Reporting Employee Commission',
      'Broker Share',
      'Status',
      'Calc Date'
    ];

    const csvData = data.map(record => [
      record.policy_number,
      record.customer_name,
      record.product_type,
      record.provider,
      record.source_type || 'Direct',
      record.employee_name || '-',
      record.agent_name || '-',
      record.misp_name || '-',
      record.reporting_employee_name || '-',
      record.premium?.toFixed(2) || '0.00',
      record.base_rate?.toFixed(2) || '0.00',
      record.reward_rate?.toFixed(2) || '0.00',
      record.bonus_rate?.toFixed(2) || '0.00',
      record.total_rate?.toFixed(2) || '0.00',
      record.insurer_commission?.toFixed(2) || '0.00',
      record.agent_commission?.toFixed(2) || '0.00',
      record.employee_commission?.toFixed(2) || '0.00',
      record.reporting_employee_commission?.toFixed(2) || '0.00',
      record.broker_share?.toFixed(2) || '0.00',
      record.commission_status,
      record.calc_date
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `revenue-table-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (profile?.org_id) {
      fetchRevenueData();
    }
  }, [profile?.org_id]);

  return {
    data,
    loading,
    error,
    syncRevenueTable,
    fetchRevenueData,
    exportToCSV,
    totals: getTotals()
  };
}