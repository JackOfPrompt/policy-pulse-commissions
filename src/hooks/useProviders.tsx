import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Provider {
  provider_id: string;
  provider_code: string;
  provider_name: string;
  trade_name?: string;
  logo_file_path?: string;
  provider_type?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
}

export const useProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('master_insurance_providers')
        .select('*')
        .eq('status', 'Active')
        .order('provider_name');

      if (error) {
        console.error('Error fetching providers:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to fetch insurance providers",
          variant: "destructive",
        });
        return;
      }

      setProviders(data || []);
    } catch (err) {
      console.error('Unexpected error fetching providers:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders
  };
};

export default useProviders;