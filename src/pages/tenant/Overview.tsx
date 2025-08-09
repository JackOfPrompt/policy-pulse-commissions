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

// Mock datasets
const summaryKPIs = [
  { label: "Total Policies Issued", value: 1842, icon: FileText },
  { label: "Active Policies", value: 1560, icon: TrendingUp },
  { label: "Premium Collected (₹)", value: 12_45_000, icon: CreditCard },
  { label: "Pending Renewals", value: 92, icon: RotateCcw },
  { label: "Total Agents", value: 118, icon: Users },
];

const salesByMonth = [
  { month: "Jan", online: 120, offline: 80 },
  { month: "Feb", online: 140, offline: 90 },
  { month: "Mar", online: 160, offline: 110 },
  { month: "Apr", online: 150, offline: 95 },
  { month: "May", online: 180, offline: 120 },
  { month: "Jun", online: 170, offline: 130 },
];

const commissionsSeries = [
  { month: "Jan", earned: 4.2, paid: 3.6 },
  { month: "Feb", earned: 4.5, paid: 3.8 },
  { month: "Mar", earned: 4.9, paid: 4.0 },
  { month: "Apr", earned: 4.7, paid: 3.9 },
  { month: "May", earned: 5.4, paid: 4.6 },
  { month: "Jun", earned: 5.1, paid: 4.3 },
];

const onboardingStatus = [
  { name: "Onboarded", value: 420 },
  { name: "KYC Pending", value: 96 },
  { name: "Docs Pending", value: 58 },
];

const claimsByLOB = [
  { lob: "Motor", submitted: 38, approved: 22, pending: 10 },
  { lob: "Health", submitted: 25, approved: 15, pending: 6 },
  { lob: "Life", submitted: 12, approved: 6, pending: 4 },
];

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b"]; // will map to tokens

export default function TenantOverview() {
  useEffect(() => {
    document.title = "Tenant Admin Dashboard | Abiraksha";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Tenant Admin overview: sales, agents, commissions, renewals, claims.");
  }, []);

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
          {summaryKPIs.map((k) => {
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