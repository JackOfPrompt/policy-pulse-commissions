import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LOB {
  lob_id: string;
  lob_code: string;
  lob_name: string;
  description?: string;
  icon_file_path?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const useLOBs = () => {
  const [lobs, setLobs] = useState<LOB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLOBs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('master_line_of_business')
        .select('*')
        .eq('status', 'Active')
        .order('lob_name');

      if (error) {
        console.error('Error fetching LOBs:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to fetch Lines of Business",
          variant: "destructive",
        });
        return;
      }

      setLobs(data || []);
    } catch (err) {
      console.error('Unexpected error fetching LOBs:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching LOBs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLOBIcon = (iconPath?: string) => {
    if (!iconPath || iconPath.trim() === '') return null;
    
    // If it's already a full URL, return as is
    if (iconPath.startsWith('http')) {
      return iconPath;
    }
    
    // If it's a storage path, get the public URL
    try {
      const { data } = supabase.storage
        .from('lob_icons')
        .getPublicUrl(iconPath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting LOB icon URL:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchLOBs();
  }, []);

  return {
    lobs,
    loading,
    error,
    refetch: fetchLOBs,
    getLOBIcon
  };
};

export default useLOBs;