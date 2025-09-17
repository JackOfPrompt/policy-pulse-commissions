import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FilterOptions {
  productTypes: string[];
  providers: string[];
  sourceTypes: string[];
}

export function useCommissionReportFilters() {
  const { profile } = useAuth();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    productTypes: [],
    providers: [],
    sourceTypes: []
  });
  const [loading, setLoading] = useState(false);

  const fetchFilterOptions = async () => {
    if (!profile?.org_id) return;

    try {
      setLoading(true);

      // Fetch product types directly from product_types table
      const { data: productTypesData, error: productError } = await supabase
        .from('product_types')
        .select('category')
        .eq('is_active', true);

      if (productError) throw productError;

      // Fetch unique providers from policies
      const { data: providersData, error: providerError } = await supabase
        .from('policies')
        .select('provider')
        .eq('org_id', profile.org_id)
        .eq('policy_status', 'active')
        .not('provider', 'is', null);

      if (providerError) throw providerError;

      // Fetch unique source types from policies
      const { data: sourceTypesData, error: sourceError } = await supabase
        .from('policies')
        .select('source_type')
        .eq('org_id', profile.org_id)
        .eq('policy_status', 'active')
        .not('source_type', 'is', null);

      if (sourceError) throw sourceError;

      // Process and deduplicate the data
      const uniqueProductTypes = [...new Set(
        productTypesData?.map(item => item.category).filter(Boolean) || []
      )];

      const uniqueProviders = [...new Set(
        providersData?.map(item => item.provider).filter(Boolean) || []
      )];

      const uniqueSourceTypes = [...new Set(
        sourceTypesData?.map(item => item.source_type).filter(Boolean) || []
      )];

      setFilterOptions({
        productTypes: uniqueProductTypes,
        providers: uniqueProviders,
        sourceTypes: uniqueSourceTypes
      });

    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [profile?.org_id]);

  return {
    filterOptions,
    loading,
    refetchFilterOptions: fetchFilterOptions
  };
}