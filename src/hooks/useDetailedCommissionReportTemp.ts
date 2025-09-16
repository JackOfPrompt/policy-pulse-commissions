import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated
export function useDetailedCommissionReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDetailedReport = async () => {
    setLoading(true);
    try {
      console.log('Detailed commission report temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detailed report generation failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    generateDetailedReport,
    loading,
    error,
    detailedReportData: []
  };
}