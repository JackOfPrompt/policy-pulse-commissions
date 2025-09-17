import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProductTypes() {
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProductTypes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  return {
    productTypes,
    data: productTypes,
    loading,
    error,
    fetchProductTypes,
    refetch: fetchProductTypes
  };
}