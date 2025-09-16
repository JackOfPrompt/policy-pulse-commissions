import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Simplified interfaces until types are regenerated
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

// Temporary simplified version until Supabase types are regenerated
export function useCommissionReport(filters: CommissionReportFilters = {}) {
  const { profile } = useAuth();
  const [data, setData] = useState<CommissionReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchCommissionReport = async (page = 1) => {
    setLoading(true);
    try {
      // Placeholder - will be restored once types are regenerated
      console.log('Commission report temporarily disabled - types being regenerated');
      setData([]);
      setTotalRecords(0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commission report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    console.log('CSV export temporarily disabled - types being regenerated');
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
      totalInsurer: 0,
      totalAgent: 0,
      totalMisp: 0,
      totalEmployee: 0,
      totalBroker: 0,
      count: 0
    }
  };
}
