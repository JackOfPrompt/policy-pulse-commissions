import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RevenueRecord {
  id: string;
  policy_id: string;
  policy_number: string;
  provider: string;
  product_type: string;
  product_name?: string;
  source_type: string;
  employee_id?: string;
  agent_id?: string;
  misp_id?: string;
  employee_name?: string;
  agent_name?: string;
  misp_name?: string;
  reporting_employee_id?: string;
  reporting_employee_name?: string;
  customer_name?: string;
  customer_id?: string;
  org_id: string;
  premium: number;
  premium_amount?: number;
  base_rate: number;
  base_commission_rate?: number;
  reward_rate: number;
  reward_commission_rate?: number;
  bonus_rate: number;
  bonus_commission_rate?: number;
  total_rate: number;
  total_commission_rate?: number;
  insurer_commission: number;
  agent_commission: number;
  employee_commission: number;
  reporting_employee_commission: number;
  broker_share: number;
  commission_status: string;
  calc_date: string;
  created_at: string;
}

export interface RevenueFilters {
  product_type?: string;
  source_type?: string;
  provider?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface RevenueTotals {
  totalCommission: number;
  totalInsurer: number;
  totalAgent: number;
  totalMisp: number;
  totalEmployee: number;
  totalBroker: number;
  totalPremium: number;
  avgBaseRate: number;
  count: number;
}

export function useRevenueTable(filters: RevenueFilters = {}) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [revenueData, setRevenueData] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<RevenueTotals>({
    totalCommission: 0,
    totalInsurer: 0,
    totalAgent: 0,
    totalMisp: 0,
    totalEmployee: 0,
    totalBroker: 0,
    totalPremium: 0,
    avgBaseRate: 0,
    count: 0
  });

  const fetchRevenueData = async () => {
    if (!profile?.org_id) return [];

    setLoading(true);
    setError(null);
    
    try {
      // Use the enhanced comprehensive commission report function instead
      const { data: commissionData, error: commissionError } = await supabase
        .rpc('calculate_enhanced_comprehensive_commission_report', { 
          p_org_id: profile.org_id 
        });

      if (commissionError) {
        console.warn('Commission calculation warning:', commissionError.message);
        throw commissionError;
      }

      // If no data from function, fallback to revenue_table
      let revenueRecords = commissionData || [];
      
      if (!revenueRecords || revenueRecords.length === 0) {
        let query = supabase
          .from('revenue_table')
          .select('*')
          .eq('org_id', profile.org_id)
          .order('policy_number');

      // Apply filters
      if (filters.product_type) {
        query = query.eq('product_type', filters.product_type);
      }
      
      if (filters.source_type) {
        query = query.eq('source_type', filters.source_type);
      }
      
      if (filters.provider) {
        query = query.ilike('provider', `%${filters.provider}%`);
      }
      
      if (filters.search) {
        query = query.or(`policy_number.ilike.%${filters.search}%,source_name.ilike.%${filters.search}%`);
      }

        if (filters.product_type) {
          query = query.eq('product_type', filters.product_type);
        }
        
        if (filters.source_type) {
          query = query.eq('source_type', filters.source_type);
        }
        
        if (filters.provider) {
          query = query.ilike('provider', `%${filters.provider}%`);
        }
        
        if (filters.search) {
          query = query.or(`policy_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        revenueRecords = (data as any[]) || [];
      }

      // Apply client-side filters if using function data
      if (commissionData && commissionData.length > 0) {
        if (filters.product_type) {
          revenueRecords = revenueRecords.filter((r: any) => 
            (r.product_type && r.product_type === filters.product_type) ||
            (r.product_name && r.product_name === filters.product_type)
          );
        }
        if (filters.source_type) {
          revenueRecords = revenueRecords.filter((r: any) => r.source_type === filters.source_type);
        }
        if (filters.provider) {
          revenueRecords = revenueRecords.filter((r: any) => 
            r.provider && r.provider.toLowerCase().includes(filters.provider.toLowerCase())
          );
        }
        if (filters.search) {
          revenueRecords = revenueRecords.filter((r: any) => 
            (r.policy_number && r.policy_number.toLowerCase().includes(filters.search.toLowerCase())) ||
            (r.customer_name && r.customer_name.toLowerCase().includes(filters.search.toLowerCase()))
          );
        }
      }
      // Normalize data structure to match interface
      const normalizedRecords = revenueRecords.map((record: any) => ({
        id: record.id || record.policy_id || `${record.policy_number}-${Date.now()}`,
        policy_id: record.policy_id,
        policy_number: record.policy_number,
        provider: record.provider,
        product_type: record.product_type || record.product_name,
        source_type: record.source_type,
        employee_id: record.employee_id,
        agent_id: record.agent_id,
        misp_id: record.misp_id,
        employee_name: record.employee_name,
        agent_name: record.agent_name,
        misp_name: record.misp_name,
        reporting_employee_id: record.reporting_employee_id,
        reporting_employee_name: record.reporting_employee_name,
        customer_name: record.customer_name,
        customer_id: record.customer_id,
        org_id: record.org_id,
        premium: record.premium || record.premium_amount || 0,
        base_rate: record.base_rate || record.base_commission_rate || 0,
        reward_rate: record.reward_rate || record.reward_commission_rate || 0,
        bonus_rate: record.bonus_rate || record.bonus_commission_rate || 0,
        total_rate: record.total_rate || record.total_commission_rate || 0,
        insurer_commission: record.insurer_commission || 0,
        agent_commission: record.agent_commission || 0,
        employee_commission: record.employee_commission || 0,
        reporting_employee_commission: record.reporting_employee_commission || 0,
        broker_share: record.broker_share || 0,
        commission_status: record.commission_status || 'pending',
        calc_date: record.calc_date || record.created_at || new Date().toISOString(),
        created_at: record.created_at || new Date().toISOString()
      }));

      setRevenueData(normalizedRecords);

      // Calculate totals
      const calculatedTotals = normalizedRecords.reduce((acc, record) => ({
        totalCommission: acc.totalCommission + (record.insurer_commission || 0),
        totalInsurer: acc.totalInsurer + (record.insurer_commission || 0),
        totalAgent: acc.totalAgent + (record.agent_commission || 0),
        totalMisp: acc.totalMisp + 0, // MISP handled separately
        totalEmployee: acc.totalEmployee + (record.employee_commission || 0) + (record.reporting_employee_commission || 0),
        totalBroker: acc.totalBroker + (record.broker_share || 0),
        totalPremium: acc.totalPremium + (record.premium || 0),
        avgBaseRate: acc.avgBaseRate + (record.base_rate || 0),
        count: acc.count + 1
      }), {
        totalCommission: 0,
        totalInsurer: 0,
        totalAgent: 0,
        totalMisp: 0,
        totalEmployee: 0,
        totalBroker: 0,
        totalPremium: 0,
        avgBaseRate: 0,
        count: 0
      });

      // Calculate average base rate
      if (calculatedTotals.count > 0) {
        calculatedTotals.avgBaseRate = calculatedTotals.avgBaseRate / calculatedTotals.count;
      }

      setTotals(calculatedTotals);
      return normalizedRecords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch revenue data';
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

  const syncRevenueTable = async () => {
    if (!profile?.org_id) return;

    setLoading(true);
    try {
      // First sync comprehensive commissions
      const { error: syncError } = await supabase
        .rpc('sync_comprehensive_commissions_updated', { p_org_id: profile.org_id });

      if (syncError) {
        console.warn('Sync error:', syncError.message);
      }

      // Then sync the revenue table
      const { error: revenueError } = await supabase
        .rpc('sync_revenue_table_comprehensive', { p_org_id: profile.org_id });

      if (revenueError) {
        console.warn('Revenue sync error:', revenueError.message);
      }

      toast({
        title: "Success",
        description: "Revenue data synced successfully with latest commission calculations",
      });

      // Refresh data after sync
      await fetchRevenueData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync revenue data';
      setError(errorMessage);
      toast({
        title: "Sync Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (revenueData.length === 0) {
      toast({
        title: "No Data",
        description: "No revenue data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = [
      'Policy Number',
      'Provider',
      'Product Type',
      'Source Type',
      'Customer Name',
      'Agent Name',
      'Employee Name',
      'MISP Name',
      'Premium',
      'Base Rate %',
      'Reward Rate %',
      'Total Rate %',
      'Insurer Commission',
      'Agent Commission',
      'Employee Commission',
      'Broker Share',
      'Status',
      'Calc Date'
    ].join(',');

    const csvRows = revenueData.map(record => [
      record.policy_number,
      record.provider || '',
      record.product_type || '',
      record.source_type || '',
      record.customer_name || '',
      record.agent_name || '',
      record.employee_name || '',
      record.misp_name || '',
      record.premium || 0,
      record.base_rate || 0,
      record.reward_rate || 0,
      record.total_rate || 0,
      record.insurer_commission || 0,
      record.agent_commission || 0,
      record.employee_commission || 0,
      record.broker_share || 0,
      record.commission_status || '',
      record.calc_date || ''
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchRevenueData();
  }, [profile?.org_id, filters]);

  return {
    revenueData,
    data: revenueData, // Alias for backward compatibility
    loading,
    error,
    totals,
    fetchRevenueData,
    syncRevenueTable,
    exportToCSV,
    refetch: fetchRevenueData
  };
}