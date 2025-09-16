import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated  
export function useUnifiedCommissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnifiedCommissions = async () => {
    setLoading(true);
    try {
      console.log('Unified commissions fetching temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unified commissions fetch failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    commissions: [],
    loading,
    error,
    fetchUnifiedCommissions,
    refetch: fetchUnifiedCommissions
  };
}