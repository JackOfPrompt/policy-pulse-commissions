import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PolicyCommissionData {
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_type: string;
  provider: string;
  premium_amount: number;
  source_type: string;
  source_name: string;
  agent_id?: string;
  employee_id?: string;
  misp_id?: string;
  // Grid matching data
  grid_id?: string;
  grid_table?: string;
  base_commission_rate: number;
  reward_rate: number;
  bonus_rate: number;
  total_rate: number;
  // Calculated commissions
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  broker_share: number;
  // Agent tier data
  agent_tier_percentage?: number;
  override_percentage?: number;
  tier_name?: string;
  commission_status: string;
}

export interface CommissionFilters {
  product_type?: string;
  provider?: string;
  source_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export function usePolicyCommissionDistribution(filters: CommissionFilters = {}) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<PolicyCommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePolicyCommissions = async () => {
    if (!profile?.org_id) {
      setError('Organization ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First sync all commissions to ensure data is up to date
      await supabase.rpc('sync_comprehensive_commissions_updated', { 
        p_org_id: profile.org_id 
      });

      // Call the comprehensive commission calculation function
      const { data: commissionData, error: calcError } = await supabase
        .rpc('calculate_comprehensive_commission_report_normalized', {
          p_org_id: profile.org_id
        });

      if (calcError) throw calcError;

      if (commissionData && commissionData.length > 0) {
        const transformedData = transformCommissionData(commissionData);
        setData(transformedData);
      } else {
        setData([]);
      }

    } catch (err) {
      console.error('Error calculating policy commissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate commissions');
      toast({
        title: "Error",
        description: "Failed to calculate policy commissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const transformCommissionData = (rawData: any[]): PolicyCommissionData[] => {
    return rawData.map((record: any) => {
      // Get source name based on type following internal/external pattern
      let sourceName = 'Direct';
      if (record.source_type === 'employee') {
        sourceName = `Internal (${record.employee_name || record.employee_id || 'Employee'})`;
      } else if (record.source_type === 'agent') {
        sourceName = `External (${record.agent_name || record.agent_id || 'Agent'})`;
      } else if (record.source_type === 'misp') {
        sourceName = `External (${record.misp_name || record.misp_id || 'MISP'})`;
      }

      // Use premium amount directly from policy details (now included in function result)
      const premiumAmount = parseFloat(record.premium_amount || '0');
      
      // Parse commission rates correctly
      const commissionRate = parseFloat(record.commission_rate || '0');
      const rewardRate = parseFloat(record.reward_rate || '0');
      const totalRate = commissionRate + rewardRate;
      
      // Calculate commissions based on premium and rates
      const insurerCommission = parseFloat(record.insurer_commission || '0');
      const agentCommission = parseFloat(record.agent_commission || '0');
      const mispCommission = parseFloat(record.misp_commission || '0');
      const employeeCommission = parseFloat(record.employee_commission || '0');
      const brokerShare = parseFloat(record.broker_share || '0');

      return {
        policy_id: record.policy_id,
        policy_number: record.policy_number,
        customer_name: record.customer_name || 'Unknown Customer',
        product_type: record.product_category || record.product_type,
        provider: record.provider,
        premium_amount: premiumAmount,
        source_type: record.source_type || 'direct',
        source_name: sourceName,
        agent_id: record.agent_id,
        employee_id: record.employee_id,
        misp_id: record.misp_id,
        grid_id: record.grid_id,
        grid_table: record.grid_table,
        base_commission_rate: commissionRate,
        reward_rate: rewardRate,
        bonus_rate: parseFloat(record.bonus_commission_rate || '0'),
        total_rate: totalRate,
        insurer_commission: insurerCommission,
        agent_commission: agentCommission,
        misp_commission: mispCommission,
        employee_commission: employeeCommission,
        broker_share: brokerShare,
        agent_tier_percentage: record.agent_tier_percentage,
        override_percentage: record.override_percentage,
        tier_name: record.tier_name,
        commission_status: record.commission_status || 'calculated'
      };
    });
  };

  const applyFilters = (data: PolicyCommissionData[]) => {
    return data.filter(record => {
      if (filters.product_type && record.product_type.toLowerCase() !== filters.product_type.toLowerCase()) {
        return false;
      }
      if (filters.provider && record.provider !== filters.provider) {
        return false;
      }
      if (filters.source_type && record.source_type !== filters.source_type) {
        return false;
      }
      if (filters.search && !record.policy_number.toLowerCase().includes(filters.search.toLowerCase()) &&
          !record.customer_name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = [
      'Policy Number',
      'Customer Name',
      'Product Type',
      'Provider',
      'Premium Amount',
      'Source Type',
      'Source Name',
      'Base Rate (%)',
      'Reward Rate (%)',
      'Bonus Rate (%)',
      'Total Rate (%)',
      'Insurer Commission',
      'Agent Commission',
      'MISP Commission',
      'Employee Commission',
      'Broker Share',
      'Commission Status',
      'Grid Table',
      'Tier Name'
    ];

    const csvData = data.map(record => [
      record.policy_number,
      record.customer_name,
      record.product_type,
      record.provider,
      record.premium_amount.toFixed(2),
      record.source_type,
      record.source_name,
      record.base_commission_rate.toFixed(2),
      record.reward_rate.toFixed(2),
      record.bonus_rate.toFixed(2),
      record.total_rate.toFixed(2),
      record.insurer_commission.toFixed(2),
      record.agent_commission.toFixed(2),
      record.misp_commission.toFixed(2),
      record.employee_commission.toFixed(2),
      record.broker_share.toFixed(2),
      record.commission_status,
      record.grid_table || '',
      record.tier_name || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `policy-commission-distribution-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Commission report exported successfully",
    });
  };

  const filteredData = applyFilters(data);

  const totals = {
    totalPolicies: filteredData.length,
    totalPremium: filteredData.reduce((sum, record) => sum + record.premium_amount, 0),
    totalInsurerCommission: filteredData.reduce((sum, record) => sum + record.insurer_commission, 0),
    totalAgentCommission: filteredData.reduce((sum, record) => sum + record.agent_commission, 0),
    totalMispCommission: filteredData.reduce((sum, record) => sum + record.misp_commission, 0),
    totalEmployeeCommission: filteredData.reduce((sum, record) => sum + record.employee_commission, 0),
    totalBrokerShare: filteredData.reduce((sum, record) => sum + record.broker_share, 0)
  };

  useEffect(() => {
    if (profile?.org_id) {
      calculatePolicyCommissions();
    }
  }, [profile?.org_id]);

  return {
    data: filteredData,
    loading,
    error,
    totals,
    calculatePolicyCommissions,
    exportToCSV
  };
}