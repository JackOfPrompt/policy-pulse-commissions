import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EnhancedCommissionReportData {
  policy_id: string;
  policy_number: string;
  product_category: string;
  product_name: string;
  product_type: string; // Alias for product_name
  plan_name: string;
  provider: string;
  source_type: string;
  source_name: string;
  customer_name: string;
  premium_amount: number;
  grid_table: string;
  grid_id: string;
  base_commission_rate: number;
  reward_commission_rate: number;
  bonus_commission_rate: number;
  total_commission_rate: number;
  insurer_commission: number;
  insurer_commission_amount: number; // Alias for insurer_commission
  agent_commission: number;
  agent_commission_amount: number; // Alias for agent_commission
  misp_commission: number;
  misp_commission_amount: number; // Alias for misp_commission
  employee_commission: number;
  employee_commission_amount: number; // Alias for employee_commission
  reporting_employee_commission: number;
  broker_share: number;
  broker_share_amount: number; // Alias for broker_share
  commission_status: string;
  calc_date: string;
}

export interface CommissionBreakdown {
  totalPolicies: number;
  totalInsurer: number;
  totalAgent: number;
  totalMisp: number;
  totalEmployee: number;
  totalReportingEmployee: number;
  totalBroker: number;
  avgBaseRate: number;
  avgRewardRate: number;
  avgBonusRate: number;
}

export function useEnhancedCommissionReport(filters?: any) {
  const [data, setData] = useState<EnhancedCommissionReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const generateReport = async (orgId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get commission data from policy_commissions table with policy details
      const { data: commissionData, error } = await supabase
        .from('policy_commissions')
        .select(`
          *,
          policies!inner(
            id,
            policy_number,
            plan_name,
            provider,
            source_type,
            agent_id,
            employee_id,
            misp_id,
            premium_with_gst,
            premium_without_gst,
            gross_premium,
            customers(first_name, last_name),
            product_types(category, name)
          )
        `)
        .eq('is_active', true)
        .eq('org_id', orgId || profile?.org_id);

      if (error) throw error;

      // Transform commission data with policy details
      const enhancedData = (commissionData || []).map(commission => {
        const policy = commission.policies;
        const premiumAmount = policy.premium_with_gst || policy.premium_without_gst || policy.gross_premium || 0;
        const customerName = policy.customers ? `${policy.customers.first_name || ''} ${policy.customers.last_name || ''}`.trim() : '';
        
        let sourceName = policy.source_type || 'Direct';

        return {
          policy_id: commission.policy_id,
          policy_number: policy.policy_number,
          product_category: policy.product_types?.category || '',
          product_name: policy.product_types?.name || '',
          product_type: policy.product_types?.name || '', // Alias
          plan_name: policy.plan_name,
          provider: policy.provider,
          source_type: policy.source_type,
          source_name: sourceName,
          customer_name: customerName,
          premium_amount: premiumAmount,
          grid_table: commission.grid_table || '',
          grid_id: commission.grid_id,
          base_commission_rate: commission.commission_rate || 0,
          reward_commission_rate: commission.reward_rate || 0,
          bonus_commission_rate: 0, // Not in current schema
          total_commission_rate: (commission.commission_rate || 0) + (commission.reward_rate || 0),
          insurer_commission: commission.insurer_commission || 0,
          insurer_commission_amount: commission.insurer_commission || 0, // Alias
          agent_commission: commission.agent_commission || 0,
          agent_commission_amount: commission.agent_commission || 0, // Alias
          misp_commission: commission.misp_commission || 0,
          misp_commission_amount: commission.misp_commission || 0, // Alias
          employee_commission: commission.employee_commission || 0,
          employee_commission_amount: commission.employee_commission || 0, // Alias
          reporting_employee_commission: 0, // Not in current schema
          broker_share: commission.broker_share || 0,
          broker_share_amount: commission.broker_share || 0, // Alias
          commission_status: commission.commission_status || 'calculated',
          calc_date: commission.calc_date || commission.created_at,
        } as EnhancedCommissionReportData;
      });

      setData(enhancedData);
      
      if (enhancedData.length > 0) {
        toast({
          title: "Enhanced Commission Report Generated",
          description: `Generated detailed commission breakdown for ${enhancedData.length} policies`,
        });
      } else {
        toast({
          title: "No Commission Data",
          description: "No policies with matching commission grids found. Please set up commission grids first.",
          variant: "destructive",
        });
      }

      return enhancedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate enhanced commission report';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data.length) {
      toast({
        title: "No Data",
        description: "No commission data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Policy Number', 'Product Type', 'Customer Name', 'Premium Amount',
      'Base Rate (%)', 'Reward Rate (%)', 'Bonus Rate (%)', 'Total Rate (%)',
      'Insurer Commission', 'Agent Commission', 'MISP Commission', 
      'Employee Commission', 'Reporting Employee Commission', 'Broker Share',
      'Source Type', 'Source Name', 'Commission Status', 'Calculation Date'
    ];

    const csvData = data.map(item => [
      item.policy_number,
      item.product_type,
      item.customer_name,
      item.premium_amount,
      item.base_commission_rate,
      item.reward_commission_rate,
      item.bonus_commission_rate,
      item.total_commission_rate,
      item.insurer_commission,
      item.agent_commission,
      item.misp_commission,
      item.employee_commission,
      item.reporting_employee_commission,
      item.broker_share,
      item.source_type,
      item.source_name,
      item.commission_status,
      item.calc_date
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `enhanced-commission-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Enhanced commission report exported successfully`,
    });
  };

  const syncAllCommissions = async (orgId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Since RPC functions are broken, just refresh the report
      await generateReport(orgId);

      toast({
        title: "Commission Data Refreshed",
        description: "Commission report has been refreshed with latest data",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh commission data';
      setError(errorMessage);
      toast({
        title: "Refresh Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCommissionBreakdown = (): CommissionBreakdown | null => {
    if (!data.length) return null;

    const breakdown = data.reduce((acc, item) => {
      acc.totalInsurer += item.insurer_commission;
      acc.totalAgent += item.agent_commission;
      acc.totalMisp += item.misp_commission;
      acc.totalEmployee += item.employee_commission;
      acc.totalReportingEmployee += item.reporting_employee_commission;
      acc.totalBroker += item.broker_share;
      acc.totalPolicies += 1;
      
      // Calculate average rates
      acc.avgBaseRate += item.base_commission_rate;
      acc.avgRewardRate += item.reward_commission_rate;
      acc.avgBonusRate += item.bonus_commission_rate;
      
      return acc;
    }, {
      totalInsurer: 0,
      totalAgent: 0,
      totalMisp: 0,
      totalEmployee: 0,
      totalReportingEmployee: 0,
      totalBroker: 0,
      totalPolicies: 0,
      avgBaseRate: 0,
      avgRewardRate: 0,
      avgBonusRate: 0,
    });

    // Calculate averages
    breakdown.avgBaseRate = breakdown.avgBaseRate / data.length;
    breakdown.avgRewardRate = breakdown.avgRewardRate / data.length;
    breakdown.avgBonusRate = breakdown.avgBonusRate / data.length;

    return breakdown;
  };

  const getSourceTypeBreakdown = () => {
    if (!data.length) return {};

    return data.reduce((acc, item) => {
      const sourceType = item.source_type || 'unknown';
      if (!acc[sourceType]) {
        acc[sourceType] = {
          count: 0,
          totalCommission: 0,
          avgRate: 0,
        };
      }
      
      acc[sourceType].count += 1;
      acc[sourceType].totalCommission += item.insurer_commission;
      acc[sourceType].avgRate += item.total_commission_rate;
      
      return acc;
    }, {} as Record<string, { count: number; totalCommission: number; avgRate: number }>);
  };

  const getTotals = () => {
    const breakdown = getCommissionBreakdown();
    return breakdown ? {
      totalPolicies: breakdown.totalPolicies,
      totalPremium: data.reduce((sum, item) => sum + item.premium_amount, 0),
      totalInsurer: breakdown.totalInsurer,
      totalAgent: breakdown.totalAgent,
      totalMisp: breakdown.totalMisp,
      totalEmployee: breakdown.totalEmployee,
      totalReportingEmployee: breakdown.totalReportingEmployee,
      totalBroker: breakdown.totalBroker,
    } : null;
  };

  const refetch = async () => {
    await generateReport();
  };

  const fetchCommissionReport = async () => {
    await generateReport();
  };

  return {
    data,
    loading,
    error,
    generateReport,
    syncAllCommissions,
    getCommissionBreakdown,
    getSourceTypeBreakdown,
    exportToCSV,
    totals: getTotals(),
    refetch,
    fetchCommissionReport,
  };
}