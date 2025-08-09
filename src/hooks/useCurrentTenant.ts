import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UseCurrentTenantResult {
  tenantId: string | null;
  tenants: string[];
  loading: boolean;
  error?: string;
}

export function useCurrentTenant(): UseCurrentTenantResult {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('current_user_tenant_ids');
        if (error) throw error;
        const ids: string[] = Array.isArray(data) ? data : [];
        if (!isMounted) return;
        setTenants(ids);
        setTenantId(ids[0] ?? null);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load tenant');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return { tenantId, tenants, loading, error };
}
