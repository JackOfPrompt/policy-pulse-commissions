import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  RotateCcw,
  FileText,
  Target,
  CreditCard,
  PieChart as PieChartIcon,
  BarChart3,
  Bell,
  Plus,
  Upload,
  FileDown,
  Send,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { AgentLeaderboard } from "@/components/admin/AgentLeaderboard";
import { RenewalsList } from "@/components/admin/RenewalsList";
import { useTenantOverviewData } from "@/hooks/useTenantOverviewData";

// Data is loaded from Supabase via useTenantOverviewData hook

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b"]; // will map to tokens

export default function TenantOverview() {
  useEffect(() => {
    document.title = "Tenant Admin Dashboard | Abiraksha";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Tenant Admin overview: sales, agents, commissions, renewals, claims.");
  }, []);

  const { loading, error, kpis, salesByMonth, commissionsSeries, onboardingStatus, claimsByLOB } = useTenantOverviewData();
  const summaryCards = [
    { label: "Total Policies Issued", value: kpis.totalPoliciesIssued || 0, icon: FileText },
    { label: "Active Policies", value: kpis.activePolicies || 0, icon: TrendingUp },
    { label: "Premium Collected (₹)", value: kpis.premiumCollected || 0, icon: CreditCard },
    { label: "Pending Renewals", value: kpis.pendingRenewals || 0, icon: RotateCcw },
    { label: "Total Agents", value: kpis.totalAgents || 0, icon: Users },
  ];

  return (
    <main className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tenant Admin Overview</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Bell className="h-4 w-4 mr-2" />Notifications</Button>
        </div>
      </header>

      {/* Business Summary Cards */}
      <section aria-labelledby="biz-summary">
        <h2 id="biz-summary" className="sr-only">Business Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {summaryCards.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="text-2xl font-semibold text-foreground mt-1">{k.value.toLocaleString()}</p>
                    </div>
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Sales Performance Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Sales Performance (Online vs Offline)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="online" stackId="a" name="Online" fill="#3b82f6" />
                <Bar dataKey="offline" stackId="a" name="Offline" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-4 w-4" />Customer Onboarding Status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={onboardingStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {onboardingStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Agent Leaderboard and Renewals */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentLeaderboard filters={{ branchId: null, startDate: null, endDate: null, policyType: null }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <RenewalsList filters={{ branchId: null, startDate: null, endDate: null, policyType: null }} showWeekOnly={true} />
          </CardContent>
        </Card>
      </section>

      {/* Commissions & Payouts + Claims Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Commissions & Payouts</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionsSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="earned" name="Earned (L)" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="paid" name="Paid (L)" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claims Overview (by LOB)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={claimsByLOB}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lob" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" />
                <Bar dataKey="approved" name="Approved" fill="#22c55e" />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button><Plus className="h-4 w-4 mr-2" />Add Agent</Button>
            <Button variant="secondary"><Upload className="h-4 w-4 mr-2" />Upload Offline Policy</Button>
            <Button variant="outline"><FileDown className="h-4 w-4 mr-2" />Generate Report</Button>
            <Button variant="ghost"><Send className="h-4 w-4 mr-2" />Send Renewal Reminder</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}