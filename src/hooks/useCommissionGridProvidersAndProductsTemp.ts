import { useState } from 'react';

// Temporary simplified version until Supabase types are regenerated
export function useCommissionGridProvidersAndProducts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvidersAndProducts = async () => {
    setLoading(true);
    try {
      console.log('Providers and products fetching temporarily disabled - types being regenerated');
      return {
        providers: [],
        products: []
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
      return {
        providers: [],
        products: []
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchProvidersAndProducts,
    loading,
    error,
    providers: [],
    products: [],
    productTypes: [], // Add missing property
    refetch: fetchProvidersAndProducts
  };
}