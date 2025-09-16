import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated
export function useAgentCommissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentCommissions = async () => {
    setLoading(true);
    try {
      console.log('Agent commissions fetching temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent commissions fetch failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    commissions: [],
    loading,
    error,
    fetchAgentCommissions,
    refetch: fetchAgentCommissions
  };
}