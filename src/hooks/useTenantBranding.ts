import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TenantBranding {
  brandName: string;
  logoUrl?: string;
  brandColor?: string;
  tenantSubdomain?: string | null;
  isTenantSubdomain: boolean;
  loading: boolean;
}

function getSubdomain(hostname: string): string | null {
  // e.g., xyzbroker.abiraksha.com -> xyzbroker
  const parts = hostname.split('.');
  if (hostname.includes('localhost')) return null;
  if (parts.length > 2) {
    const sub = parts[0];
    if (sub && sub !== 'www') return sub;
  }
  return null;
}

export function useTenantBranding(): TenantBranding {
  const [brandName, setBrandName] = useState<string>('Abiraksha Insuretech');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [brandColor, setBrandColor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const tenantSubdomain = useMemo(() => getSubdomain(window.location.hostname), []);
  const isTenantSubdomain = !!tenantSubdomain;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Try fetching tenant branding (table may not exist in all environments)
        if (!tenantSubdomain) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('tenants')
          .select('tenant_name, logo_url, subdomain')
          .eq('subdomain', tenantSubdomain)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (data) {
          setBrandName((data as any).tenant_name ?? 'Abiraksha Insuretech');
          setLogoUrl((data as any).logo_url ?? undefined);
          setBrandColor((data as any).brand_color ?? undefined);
        }
      } catch {
        // Silently ignore and use defaults
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tenantSubdomain]);

  return { brandName, logoUrl, brandColor, tenantSubdomain, isTenantSubdomain, loading };
}
