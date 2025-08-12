import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireRole } from "@/components/auth/RequireRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Shield, Users } from "lucide-react";
import KpiCards from "@/components/admin/dashboard/KpiCards";
import SystemCharts from "@/components/admin/dashboard/SystemCharts";

interface UserRow { user_id: string; role_id: string | null; tenant_id: string | null; }
interface RoleRow { role_id: string; role_name: string; }

const SystemAdminDashboard: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>System Admin Dashboard | Abiraksha Insurtech</title>
        <meta name="description" content="System Admin dashboard for managing platform settings and user access." />
        <link rel="canonical" href={`${window.location.origin}/dashboard/system-admin`} />
      </Helmet>
      <RequireRole allowedRoles={["System Admin"]}>
        <AdminContent />
      </RequireRole>
    </>
  );
};

function AdminContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [expiringCount, setExpiringCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("INR");

useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const today = new Date();
      const in30 = new Date(today);
      in30.setDate(in30.getDate() + 30);

      const [usersRes, rolesRes, expiringRes, activeSubsRes] = await Promise.all([
        supabase.from("users").select("user_id, role_id, tenant_id"),
        supabase.from("login_roles").select("role_id, role_name"),
        supabase
          .from("tenant_subscriptions")
          .select("subscription_id", { count: "exact" })
          .eq("is_active", true)
          .gte("end_date", today.toISOString().slice(0, 10))
          .lte("end_date", in30.toISOString().slice(0, 10)),
        supabase
          .from("tenant_subscriptions")
          .select("subscription_id, plan_id, billing_cycle")
          .eq("is_active", true),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (!cancelled) {
        setUsers((usersRes.data as any) || []);
        setRoles((rolesRes.data as any) || []);
      }

      if (expiringRes.error) throw expiringRes.error;
      const expCount = expiringRes.count || 0;

      if (activeSubsRes.error) throw activeSubsRes.error;
      const subs = (activeSubsRes.data as any[]) || [];
      const planIds = Array.from(new Set(subs.map((s: any) => s.plan_id)));

      let mrr = 0;
      let curr = "INR";
      if (planIds.length) {
        const { data: plans, error: plansErr } = await supabase
          .from("subscription_plans")
          .select("plan_id, monthly_price, annual_price, currency_code")
          .in("plan_id", planIds);
        if (plansErr) throw plansErr;
        const pMap: Record<string, any> = {};
        (plans as any[]).forEach((p) => { pMap[p.plan_id] = p; });
        subs.forEach((s) => {
          const p = pMap[s.plan_id];
          if (!p) return;
          curr = p.currency_code || curr;
          const monthly = s.billing_cycle === "Monthly" ? Number(p.monthly_price || 0) : Number(p.annual_price || 0) / 12;
          mrr += monthly;
        });
      }

      if (!cancelled) {
        setExpiringCount(expCount);
        setMonthlyRevenue(Number(mrr.toFixed(2)));
        setCurrency(curr);
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

  const roleCounts = useMemo(() => {
    const byRoleId = new Map<string, number>();
    users.forEach((u) => {
      if (u.role_id) byRoleId.set(u.role_id, (byRoleId.get(u.role_id) || 0) + 1);
    });
    const byRoleName: { name: string; count: number }[] = [];
    roles.forEach((r) => {
      byRoleName.push({ name: r.role_name, count: byRoleId.get(r.role_id) || 0 });
    });
    return byRoleName;
  }, [users, roles]);

  const activeTenantsCount = useMemo(() => {
    const set = new Set(users.map((u) => u.tenant_id).filter(Boolean));
    return set.size;
  }, [users]);

  return (
    <AdminLayout>
      <div className="w-full px-4 py-6 space-y-6 animate-fade-in">
        <section id="overview" className="space-y-4">
          <header>
            <h1 className="text-3xl font-bold">System Admin Dashboard</h1>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <KpiCards
              tenants={activeTenantsCount}
              users={roleCounts.reduce((a, b) => a + b.count, 0)}
              mrr={monthlyRevenue}
              currency={currency}
              expiring={expiringCount}
            />
          )}
        </section>

        <SystemCharts />
      </div>
    </AdminLayout>
  );
}

export default SystemAdminDashboard;
