import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommissionReportRecord {
  policy_id: string;
  policy_number: string;
  product_type: string;
  product_name: string;
  policy_startdate: string;
  policy_enddate: string;
  customer_id: string;
  customer_name: string;
  premium_amount: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  broker_share: number;
  commission_status: string;
  calc_date: string;
  org_id: string;
  created_at: string;
  source_type: string;
  source_name: string;
  commission_rate?: number;
  reward_rate?: number;
  total_commission_rate?: number;
  grid_id?: string;
  provider?: string;
}

export interface CommissionReportFilters {
  product_type?: string;
  commission_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  provider?: string;
  source_type?: string;
}

export function useCommissionReport(filters: CommissionReportFilters = {}) {
  const { profile } = useAuth();
  const [data, setData] = useState<CommissionReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchCommissionReport = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Get commission data from policy_commissions table with policy details
      const { data: commissionData, error: commissionError } = await supabase
        .from('policy_commissions')
        .select(`
          *,
          policies!inner(
            policy_number,
            start_date,
            end_date,
            provider,
            customers(first_name, last_name, company_name),
            product_types(name, category)
          )
        `)
        .eq('is_active', true)
        .eq('org_id', profile?.org_id || '');

      if (commissionError) throw commissionError;

      // Apply client-side filters
      let filteredData = commissionData || [];

      if (filters.product_type && filters.product_type !== 'all') {
        filteredData = filteredData.filter((item: any) => 
          item.policies?.product_types?.name?.toLowerCase() === filters.product_type?.toLowerCase()
        );
      }
      
      if (filters.commission_status && filters.commission_status !== 'all') {
        filteredData = filteredData.filter((item: any) => 
          item.commission_status === filters.commission_status
        );
      }
      
      if (filters.date_from) {
        filteredData = filteredData.filter((item: any) => 
          new Date(item.calc_date) >= new Date(filters.date_from!)
        );
      }
      
      if (filters.date_to) {
        filteredData = filteredData.filter((item: any) => 
          new Date(item.calc_date) <= new Date(filters.date_to!)
        );
      }

      if (filters.search) {
        filteredData = filteredData.filter((item: any) => 
          item.policies?.policy_number?.toLowerCase().includes(filters.search?.toLowerCase()) ||
          item.policies?.customers?.first_name?.toLowerCase().includes(filters.search?.toLowerCase()) ||
          item.policies?.customers?.last_name?.toLowerCase().includes(filters.search?.toLowerCase())
        );
      }

      if (filters.provider) {
        filteredData = filteredData.filter((item: any) => 
          item.policies?.provider === filters.provider
        );
      }

      // Apply pagination
      const totalRecords = filteredData.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filteredData.slice(from, to);

      // Transform the data from policy_commissions
      const transformedData: CommissionReportRecord[] = paginatedData.map((item: any) => {
        const policy = item.policies;
        const customer = policy?.customers;
        const productType = policy?.product_types;
        
        const customerName = customer?.company_name || 
          `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 
          'Unknown Customer';

        return {
          policy_id: item.policy_id,
          policy_number: policy?.policy_number || '',
          product_type: productType?.name || '',
          product_name: productType?.name || '',
          policy_startdate: policy?.start_date || '',
          policy_enddate: policy?.end_date || '',
          customer_id: item.customer_id || '',
          customer_name: customerName,
          premium_amount: item.commission_amount / (item.commission_rate / 100) || 0,
          insurer_commission: item.insurer_commission || 0,
          agent_commission: item.agent_commission || 0,
          misp_commission: item.misp_commission || 0,
          employee_commission: item.employee_commission || 0,
          broker_share: item.broker_share || 0,
          commission_status: item.commission_status || 'calculated',
          calc_date: item.calc_date || item.created_at,
          org_id: item.org_id || '',
          created_at: item.created_at,
          source_type: item.source_type || 'direct',
          source_name: item.source_type === 'agent' ? 'Agent' : 
                      item.source_type === 'misp' ? 'MISP' :
                      item.source_type === 'employee' ? 'Employee' : 'Direct',
          commission_rate: item.commission_rate || 0,
          reward_rate: item.reward_rate || 0,
          grid_id: item.grid_id || '',
          provider: policy?.provider || ''
        };
      });

      setData(transformedData);
      setTotalRecords(totalRecords);
      setCurrentPage(page);

    } catch (err) {
      console.error('Error fetching commission report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch commission report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = [
      'Policy Number',
      'Product Type',
      'Product Name',
      'Customer Name',
      'Provider',
      'Premium Amount',
      'Total Commission Rate (%)',
      'Base Commission Rate (%)',
      'Reward Rate (%)',
      'Insurer Commission',
      'Agent Commission',
      'MISP Commission',
      'Employee Commission',
      'Broker Share',
      'Commission Status',
      'Source Type',
      'Source Name',
      'Policy Start Date',
      'Policy End Date',
      'Calculation Date'
    ];

    const csvData = data.map(record => [
      record.policy_number,
      record.product_type,
      record.product_name,
      record.customer_name,
      record.provider || 'N/A',
      record.premium_amount?.toFixed(2) || '0.00',
      record.commission_rate?.toFixed(2) || '0.00',
      ((record.commission_rate || 0) - (record.reward_rate || 0)).toFixed(2),
      record.reward_rate?.toFixed(2) || '0.00',
      record.insurer_commission?.toFixed(2) || '0.00',
      record.agent_commission?.toFixed(2) || '0.00',
      record.misp_commission?.toFixed(2) || '0.00',
      record.employee_commission?.toFixed(2) || '0.00',
      record.broker_share?.toFixed(2) || '0.00',
      record.commission_status,
      record.source_type || 'Direct',
      record.source_name,
      record.policy_startdate,
      record.policy_enddate,
      record.calc_date
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commission-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchCommissionReport(1);
  }, [filters, profile?.id]);

  return {
    data,
    loading,
    error,
    totalRecords,
    currentPage,
    pageSize,
    fetchCommissionReport,
    exportToCSV,
    totals: {
      totalInsurer: data.reduce((sum, record) => sum + (record.insurer_commission || 0), 0),
      totalAgent: data.reduce((sum, record) => sum + (record.agent_commission || 0), 0),
      totalMisp: data.reduce((sum, record) => sum + (record.misp_commission || 0), 0),
      totalEmployee: data.reduce((sum, record) => sum + (record.employee_commission || 0), 0),
      totalBroker: data.reduce((sum, record) => sum + (record.broker_share || 0), 0),
      count: data.length
    }
  };
}