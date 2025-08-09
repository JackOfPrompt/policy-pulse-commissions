import { useEffect } from "react";
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

// Mock data (replace with Supabase queries later)
const platformKPIs = [
  { label: "Total Tenants", value: 42, icon: Building2 },
  { label: "Active Policies", value: 12840, icon: FileText },
  { label: "Premium Volume (₹)", value: 9_850_000, icon: Wallet },
  { label: "Claims In Process", value: 312, icon: Activity },
  { label: "Uptime", value: "99.96%", icon: Server },
];

const planDistribution = [
  { name: "Free", value: 8 },
  { name: "Basic", value: 14 },
  { name: "Premium", value: 15 },
  { name: "Enterprise", value: 5 },
];

const recentSignups = [
  { name: "Sapphire Brokers", date: "2025-08-01", plan: "Premium", status: "Active" },
  { name: "Trident Insurance", date: "2025-07-30", plan: "Basic", status: "Trial" },
  { name: "MetroSecure", date: "2025-07-28", plan: "Enterprise", status: "Active" },
  { name: "NovaCover", date: "2025-07-27", plan: "Free", status: "Email Pending" },
];

const monthlyPolicyStats = [
  { month: "Jan", policies: 820, premium: 72, claims: 12 },
  { month: "Feb", policies: 910, premium: 78, claims: 18 },
  { month: "Mar", policies: 1040, premium: 85, claims: 22 },
  { month: "Apr", policies: 980, premium: 81, claims: 19 },
  { month: "May", policies: 1120, premium: 93, claims: 25 },
  { month: "Jun", policies: 1190, premium: 98, claims: 20 },
];

const topTenants = [
  { name: "MetroSecure", premium: 1850 },
  { name: "Sapphire Brokers", premium: 1720 },
  { name: "NorthStar", premium: 1690 },
  { name: "NovaCover", premium: 1550 },
  { name: "ShieldOne", premium: 1490 },
  { name: "Trident", premium: 1420 },
  { name: "Aegis", premium: 1350 },
  { name: "Orbit", premium: 1310 },
  { name: "SureTrust", premium: 1280 },
  { name: "ZenGuard", premium: 1210 },
];

const healthSeries = [
  { t: "10:00", latency: 210, errors: 1 },
  { t: "10:05", latency: 190, errors: 0 },
  { t: "10:10", latency: 240, errors: 2 },
  { t: "10:15", latency: 200, errors: 0 },
  { t: "10:20", latency: 230, errors: 1 },
  { t: "10:25", latency: 195, errors: 0 },
];

const COLORS = ["#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"]; // will be themed via tokens

export default function SystemOverview() {
  useEffect(() => {
    document.title = "System Admin Dashboard | Abiraksha";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "System Admin overview: tenants, subscriptions, uptime, policies, claims.");
  }, []);

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
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Subscription Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {planDistribution.map((entry, index) => (
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
                <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} />
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
              <LineChart data={monthlyPolicyStats}>
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
              <BarChart data={topTenants}>
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
              {recentSignups.map((t) => (
                <div key={t.name} className="grid grid-cols-4 gap-3 items-center text-sm p-2 rounded-md border border-border">
                  <span className="truncate text-foreground">{t.name}</span>
                  <span>{t.date}</span>
                  <span>{t.plan}</span>
                  <span>{t.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-md border border-warning/30 bg-warning/10 flex items-center justify-between">
              <div className="text-sm">
                IRDA: Pending UIN document verifications (3 tenants)
              </div>
              <Button variant="outline" size="sm">Review</Button>
            </div>
            <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 flex items-center justify-between">
              <div className="text-sm">
                Data Retention: Logs exceeding 90 days in 1 tenant
              </div>
              <Button variant="outline" size="sm">Resolve</Button>
            </div>
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