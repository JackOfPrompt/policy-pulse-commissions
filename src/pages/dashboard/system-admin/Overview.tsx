import React, { useEffect, useMemo, useState } from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Skeleton } from "@/components/ui/skeleton";
import FiltersBar, { type FilterState } from "@/components/admin/dashboard/filters/FiltersBar";
import ExtendedKpiCards from "@/components/admin/dashboard/ExtendedKpiCards";
import ChartsPanel from "@/components/admin/dashboard/ChartsPanel";
import HealthStatusTable from "@/components/admin/dashboard/HealthStatusTable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TenantRow { tenant_id: string; tenant_name: string; status: string }
interface UserRow { user_id: string; role_id: string | null; tenant_id: string | null; is_email_verified: boolean | null }

export default function Overview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tRes, uRes] = await Promise.all([
          supabase.from("tenants").select("tenant_id, tenant_name, status"),
          supabase.from("users").select("user_id, role_id, tenant_id, is_email_verified"),
        ]);
        if (tRes.error) throw tRes.error;
        if (uRes.error) throw uRes.error;
        if (!cancelled) {
          setTenants((tRes.data as any) || []);
          setUsers((uRes.data as any) || []);
        }
      } catch (e: any) {
        console.error(e);
        toast({ title: "Failed to load dashboard", description: e?.message || String(e), variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filteredTenants = useMemo(() => {
    if (!filters.tenantId) return tenants;
    return tenants.filter((t) => t.tenant_id === filters.tenantId);
  }, [tenants, filters]);

  const tenantsCount = filteredTenants.length || tenants.length;
  const activeUsers = useMemo(() => {
    const scopeTenantIds = new Set(filteredTenants.map((t) => t.tenant_id));
    return users.filter((u) => (!filters.tenantId || (u.tenant_id && scopeTenantIds.has(u.tenant_id))) && !!u.role_id).length;
  }, [users, filteredTenants, filters]);

  return (
    <SystemAdminModulePage slug="Overview" title="Overview" description="High level status and actions.">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="space-y-4">
          <FiltersBar tenants={tenants} value={filters} onChange={setFilters} />

          <ExtendedKpiCards
            tenantsCount={tenantsCount}
            activeUsers={activeUsers}
            activePolicies={null}
            mtdNewPolicies={null}
            mtdRenewals={null}
            totalPremium={null}
            topTenant={null}
            lowestTenantByRenewal={null}
            uptimePct={null}
            integrationHealth={null}
            pendingTickets={null}
          />

          <ChartsPanel tenants={filteredTenants} />

          <HealthStatusTable tenants={filteredTenants} />
        </div>
      )}
    </SystemAdminModulePage>
  );
}
