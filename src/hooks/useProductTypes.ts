import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductType {
  id: string;
  name: string;
  code: string;
  category: string;
  org_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProductTypes() {
  const [data, setData] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: productTypes, error: productTypesError } = await supabase
        .from('product_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (productTypesError) throw productTypesError;

      setData(productTypes || []);
    } catch (err) {
      console.error('Error fetching product types:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product types';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchProductTypes,
  };
}