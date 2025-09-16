import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated
export function useReportsData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      console.log('Reports data fetching temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reports data fetch failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    reportsData: [],
    loading,
    error,
    fetchReportsData,
    refetch: fetchReportsData
  };
}