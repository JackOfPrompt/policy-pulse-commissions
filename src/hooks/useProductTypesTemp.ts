import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated
export function useProductTypes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      console.log('Product types fetching temporarily disabled - types being regenerated');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Product types fetch failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    productTypes: [],
    data: [],
    loading,
    error,
    fetchProductTypes,
    refetch: fetchProductTypes
  };
}