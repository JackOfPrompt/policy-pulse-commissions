import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated
export function useComprehensiveCommissionReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      console.log('Comprehensive commission report temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    generateReport,
    loading,
    error,
    reportData: []
  };
}