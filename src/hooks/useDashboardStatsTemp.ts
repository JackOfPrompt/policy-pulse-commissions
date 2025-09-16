import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  totalPremium: number;
  totalCommissions: number;
  recentPolicies: any[];
  policyStatusBreakdown: { [key: string]: number };
  commissionsByProductType: { [key: string]: number };
}

// Temporary simplified version until Supabase types are regenerated
export function useDashboardStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPolicies: 0,
    activePolicies: 0,
    totalPremium: 0,
    totalCommissions: 0,
    recentPolicies: [],
    policyStatusBreakdown: {},
    commissionsByProductType: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Placeholder stats - will be restored once types are regenerated
      const mockStats: DashboardStats = {
        totalPolicies: 0,
        activePolicies: 0,
        totalPremium: 0,
        totalCommissions: 0,
        recentPolicies: [],
        policyStatusBreakdown: { active: 0, pending: 0, expired: 0 },
        commissionsByProductType: { motor: 0, health: 0, life: 0 }
      };
      
      setStats(mockStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.org_id) {
      fetchStats();
    }
  }, [profile?.org_id]);

  return { stats, loading, error, refetch: fetchStats };
}