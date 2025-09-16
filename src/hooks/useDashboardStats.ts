import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalCustomers: number;
  activePolicies: number;
  pendingCommissions: number;
  totalPremium: number;
  monthlyGrowth: number;
  recentPolicies: Array<{
    id: string;
    policy_number: string;
    customer_name: string;
    product_type: string;
    policy_status: string;
    created_at: string;
  }>;
  pendingExtractions: Array<{
    id: string;
    policy_number: string;
    customer_name: string;
    extractionStatus: string;
  }>;
}

// Temporary simplified version until Supabase types are regenerated
export function useDashboardStats() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardStats>({
    totalCustomers: 0,
    activePolicies: 0,
    pendingCommissions: 0,
    totalPremium: 0,
    monthlyGrowth: 0,
    recentPolicies: [],
    pendingExtractions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Placeholder stats - will be restored once types are regenerated
      console.log('Dashboard stats temporarily disabled - types being regenerated');
      
      const mockStats: DashboardStats = {
        totalCustomers: 0,
        activePolicies: 0,
        pendingCommissions: 0,
        totalPremium: 0,
        monthlyGrowth: 0,
        recentPolicies: [],
        pendingExtractions: []
      };
      
      setData(mockStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.org_id) {
      fetchDashboardStats();
    }
  }, [profile?.org_id]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardStats
  };
}