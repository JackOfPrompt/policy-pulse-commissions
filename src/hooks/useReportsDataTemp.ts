import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated
export function useReportsData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportsData = async (range?: any) => {
    setLoading(true);
    try {
      console.log('Reports data fetching temporarily disabled - types being regenerated');
      return {
        totalPremium: 0,
        totalPolicies: 0,
        totalCommissions: 0,
        avgCommissionRate: 0,
        pendingPayouts: 0,
        policyRenewalRate: 0
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reports data fetch failed');
      return {
        totalPremium: 0,
        totalPolicies: 0,
        totalCommissions: 0,
        avgCommissionRate: 0,
        pendingPayouts: 0,
        policyRenewalRate: 0
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    reportsData: [],
    data: {
      totalPremium: 0,
      totalPolicies: 0,
      totalCommissions: 0,
      avgCommissionRate: 0,
      pendingPayouts: 0,
      policyRenewalRate: 0
    },
    loading,
    error,
    fetchReportsData: (filters?: any) => {
      console.log('Reports data fetch with filters:', filters);
      return fetchReportsData(filters);
    },
    refetch: fetchReportsData
  };
}