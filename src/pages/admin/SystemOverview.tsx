import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SystemDbDiagnostics from "@/components/admin/SystemDbDiagnostics";
import {
  Building2,
  FileText,
  Shield,
  Activity,
  Users,
  Wallet,
  Server,
  Gauge,
  Bell,
  Plus,
  Settings,
  ClipboardList,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

// Data loaded via Supabase queries at runtime

const COLORS = ["#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"]; // will be themed via tokens

export default function SystemOverview() {
  useEffect(() => {
    document.title = "System Admin Dashboard | Abiraksha";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "System Admin overview: tenants, subscriptions, uptime, policies, claims.");
  }, []);

  const monthLabel = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short' });
  };

  const getLastMonths = (n: number) => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(dt.toLocaleString('en-US', { month: 'short' }));
    }
    return labels;
  };

  // KPIs
  const { data: kpis } = useQuery({
    queryKey: ['system_kpis'],
    queryFn: async () => {
      const [tenantsRes, policiesRes, premiumRes, claimsRes] = await Promise.all([
        supabase.from('tenants' as any).select('*', { count: 'exact', head: true }),
        supabase.from('policies_new' as any).select('*', { count: 'exact', head: true }).in('policy_status', ['Issued','Active'] as any),
        supabase.from('policies_new' as any).select('premium_amount').in('policy_status', ['Issued','Active'] as any),
        supabase.from('claims' as any).select('*', { count: 'exact', head: true }).neq('status', 'SETTLED'),
      ]);
      const totalPremium = (premiumRes.data ?? []).reduce((s: number, r: any) => s + (r.premium_amount || 0), 0);
      return {
        tenants: tenantsRes.count ?? 0,
        policies: policiesRes.count ?? 0,
        premium: totalPremium,
        claimsInProcess: claimsRes.count ?? 0,
      };
    },
  });

  // Build KPI array for UI
  const platformKPIs = [
    { label: "Total Tenants", value: kpis?.tenants ?? 0, icon: Building2 },
    { label: "Active Policies", value: kpis?.policies ?? 0, icon: FileText },
    { label: "Premium Volume (₹)", value: kpis?.premium ?? 0, icon: Wallet },
    { label: "Claims In Process", value: kpis?.claimsInProcess ?? 0, icon: Activity },
  ];

  // Tenants distribution (by status)
  const { data: planDistribution } = useQuery({
    queryKey: ['tenant_status_dist'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants' as any).select('status');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((t: any) => {
        const s = t.status || 'Unknown';
        counts[s] = (counts[s] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  // Recent signups
  const { data: recentSignups } = useQuery({
    queryKey: ['recent_tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants' as any)
        .select('tenant_name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Monthly policy stats (last 6 months)
  const { data: monthlyPolicyStats } = useQuery({
    queryKey: ['monthly_policy_stats'],
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 5);
      since.setDate(1);
      const sinceIso = since.toISOString();
      const [pol, clm] = await Promise.all([
        supabase.from('policies_new' as any).select('created_at, premium_amount').gte('created_at', sinceIso),
        supabase.from('claims' as any).select('created_at').gte('created_at', sinceIso),
      ]);
      const months = getLastMonths(6);
      const map: Record<string, { policies: number; premium: number; claims: number }> = {};
      months.forEach((m) => (map[m] = { policies: 0, premium: 0, claims: 0 }));
      (pol.data ?? []).forEach((r: any) => {
        const m = monthLabel(r.created_at);
        if (!map[m]) map[m] = { policies: 0, premium: 0, claims: 0 };
        map[m].policies += 1;
        map[m].premium += r.premium_amount || 0;
      });
      (clm.data ?? []).forEach((r: any) => {
        const m = monthLabel(r.created_at);
        if (!map[m]) map[m] = { policies: 0, premium: 0, claims: 0 };
        map[m].claims += 1;
      });
      return months.map((m) => ({
        month: m,
        policies: map[m]?.policies || 0,
        premium: Math.round((map[m]?.premium || 0) / 100000), // in L
        claims: map[m]?.claims || 0,
      }));
    },
  });

  // Top tenants by premium (last 3 months)
  const { data: topTenants } = useQuery({
    queryKey: ['top_tenants_premium'],
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 3);
      const { data, error } = await supabase
        .from('policies_new' as any)
        .select('tenant_id, premium_amount, created_at')
        .gte('created_at', since.toISOString());
      if (error) throw error;
      const sums = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        if (!r.tenant_id) return;
        sums.set(r.tenant_id, (sums.get(r.tenant_id) || 0) + (r.premium_amount || 0));
      });
      const top = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (top.length === 0) return [] as any[];
      const ids = top.map(([id]) => id);
      const { data: tenants } = await supabase
        .from('tenants' as any)
        .select('tenant_id, tenant_name')
        .in('tenant_id', ids as any);
      const nameMap = new Map<string, string>((tenants ?? []).map((t: any) => [t.tenant_id, t.tenant_name]));
      return top.map(([id, value]) => ({ name: nameMap.get(id) || id, premium: Math.round(value / 100000) }));
    },
  });

  // Activity (last hour)
  const { data: healthSeries } = useQuery({
    queryKey: ['system_activity_last_hour'],
    queryFn: async () => {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const buckets: Record<string, number> = {};
      const now = new Date();
      const start = new Date(now.getTime() - 50 * 60 * 1000);
      start.setSeconds(0, 0);
      for (let i = 0; i < 6; i++) {
        const label = new Date(start.getTime() + i * 10 * 60 * 1000)
          .toTimeString()
          .slice(0, 5);
        buckets[label] = 0;
      }
      (data ?? []).forEach((r: any) => {
        const d = new Date(r.created_at);
        const minBucket = Math.floor(d.getMinutes() / 10) * 10;
        const label = `${d.getHours().toString().padStart(2, '0')}:${minBucket.toString().padStart(2, '0')}`;
        if (buckets[label] === undefined) buckets[label] = 0;
        buckets[label] += 1;
      });
      return Object.entries(buckets).map(([t, count]) => ({ t, events: count, errors: 0 }));
    },
  });

  // Compliance alerts
  const { data: complianceAlerts } = useQuery({
    queryKey: ['compliance_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('id, message, notification_type, created_at')
        .in('notification_type', ['underwriting_delay', 'payout_reversal'] as any)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">System Admin Overview</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Bell className="h-4 w-4 mr-2" />Notifications</Button>
          <Button variant="default"><Shield className="h-4 w-4 mr-2" />Profile</Button>
        </div>
      </header>

      {/* Platform Summary Cards */}
      <section aria-labelledby="platform-summary">
        <h2 id="platform-summary" className="sr-only">Platform Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {platformKPIs.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-semibold text-foreground mt-1">{kpi.value.toLocaleString()}</p>
                    </div>
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Tenants by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planDistribution ?? []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {(planDistribution ?? []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health Monitor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4" />System Health Monitor</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" />
                <YAxis yAxisId="left" label={{ value: "ms", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Global Policy Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Policy Stats</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPolicyStats ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="policies" name="Policies" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="premium" name="Premium (L)" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="claims" name="Claims" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Top Performing Tenants</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTenants ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="premium" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Recent Signups & Compliance Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenant Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 text-sm font-medium text-muted-foreground">
              <div>Tenant</div>
              <div>Signup Date</div>
              <div>Plan</div>
              <div>Status</div>
            </div>
            <div className="mt-2 space-y-2">
              {(recentSignups ?? []).map((t: any) => (
                <div key={t.tenant_name + t.created_at} className="grid grid-cols-4 gap-3 items-center text-sm p-2 rounded-md border border-border">
                  <span className="truncate text-foreground">{t.tenant_name}</span>
                  <span>{new Date(t.created_at).toISOString().slice(0,10)}</span>
                  <span>-</span>
                  <span>{t.status ?? '-'}</span>
                </div>
              ))}
              {(recentSignups ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No recent signups.</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Alerts</CardTitle>
          </CardHeader>
            <CardContent className="space-y-3">
              {(complianceAlerts ?? []).length > 0 ? (
                (complianceAlerts ?? []).map((a: any) => (
                  <div key={a.id} className="p-3 rounded-md border border-warning/30 bg-warning/10 flex items-center justify-between">
                    <div className="text-sm">{a.message}</div>
                    <Button variant="outline" size="sm">Review</Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No compliance alerts.</div>
              )}
            </CardContent>
        </Card>
      </section>

      {/* System DB Diagnostics */}
      <section>
        {/* Diagnostics panel runs CRUD tests for LOBs, Providers, Products */}
        <SystemDbDiagnostics />
      </section>

      {/* Quick Actions */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button><Plus className="h-4 w-4 mr-2" />Add Tenant</Button>
            <Button variant="secondary"><Settings className="h-4 w-4 mr-2" />Manage Plans</Button>
            <Button variant="outline"><ClipboardList className="h-4 w-4 mr-2" />View Audit Logs</Button>
            <Button variant="ghost"><Shield className="h-4 w-4 mr-2" />Toggle Features</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}