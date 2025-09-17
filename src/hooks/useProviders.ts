import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Provider {
  id: string;
  name: string;
  code: string;
  provider_type: string;
  is_active: boolean;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export function useProviders() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    if (!profile?.org_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('org_id', profile.org_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch providers';
      setError(errorMessage);
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProvider = async (providerData: Omit<Provider, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    if (!profile?.org_id) return null;
    
    try {
      const { data, error } = await supabase
        .from('providers')
        .insert({
          ...providerData,
          org_id: profile.org_id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Provider created successfully",
      });
      
      await fetchProviders();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create provider';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProvider = async (id: string, providerData: Partial<Provider>) => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .update(providerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Provider updated successfully",
      });
      
      await fetchProviders();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update provider';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Provider deleted successfully",
      });
      
      await fetchProviders();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete provider';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [profile?.org_id]);

  return {
    providers,
    loading,
    error,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    refetch: fetchProviders
  };
}