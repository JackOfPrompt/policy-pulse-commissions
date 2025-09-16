import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductTypeOption {
  id: string;
  name: string;
  category: string;
}

export interface ProviderOption {
  id: string;
  name: string;
  code: string;
}

export function useCommissionGridProvidersAndProducts() {
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      
      // Get unique product types from policies table
      const { data: policyProductTypes, error } = await supabase
        .from('policies')
        .select(`
          product_type_id,
          product_types!inner(id, name, category)
        `)
        .not('product_type_id', 'is', null);

      if (error) throw error;

      // Extract unique product types
      const uniqueProductTypes = Array.from(
        new Map(
          policyProductTypes
            ?.filter(p => p.product_types)
            .map(p => [p.product_types.id, {
              id: p.product_types.id,
              name: p.product_types.name,
              category: p.product_types.category
            }]) || []
        ).values()
      );

      setProductTypes(uniqueProductTypes);
    } catch (err) {
      console.error('Error fetching product types:', err);
      toast({
        title: "Error",
        description: "Failed to fetch product types",
        variant: "destructive",
      });
    }
  };

  const fetchProviders = async () => {
    try {
      // Get unique providers from policies table
      const { data: policyProviders, error } = await supabase
        .from('policies')
        .select('provider, provider_id')
        .not('provider', 'is', null)
        .not('provider', 'eq', '');

      if (error) throw error;

      // Extract unique providers and create mock IDs if provider_id is null
      const uniqueProviders = Array.from(
        new Map(
          policyProviders
            ?.filter(p => p.provider)
            .map(p => [p.provider, {
              id: p.provider_id || `mock-${p.provider.toLowerCase().replace(/\s+/g, '-')}`,
              name: p.provider,
              code: p.provider.toUpperCase().replace(/\s+/g, '_')
            }]) || []
        ).values()
      );

      setProviders(uniqueProviders);
    } catch (err) {
      console.error('Error fetching providers:', err);
      toast({
        title: "Error", 
        description: "Failed to fetch providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchProductTypes(), fetchProviders()]);
    };
    fetchData();
  }, []);

  return {
    productTypes,
    providers,
    loading,
    refetch: () => {
      fetchProductTypes();
      fetchProviders();
    }
  };
}