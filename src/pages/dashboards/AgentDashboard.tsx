import { Shield, DollarSign, Upload, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import policies from "@/data/agent/policies.json";
import commissions from "@/data/agent/commissions.json";
import users from "@/data/users.json";

export default function AgentDashboard() {
  const user = users.agent;

  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0);

  // Group commissions by month for chart
  const monthlyCommissions = commissions
    .filter(c => c.status === 'paid')
    .reduce((acc: any[], comm) => {
      const monthYear = comm.month;
      const existing = acc.find(item => item.month === monthYear);
      
      if (existing) {
        existing.amount += comm.commissionAmount;
      } else {
        acc.push({
          month: monthYear,
          amount: comm.commissionAmount
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  const stats = [
    {
      title: "Total Policies",
      value: totalPolicies.toString(),
      change: "All time",
      icon: Shield,
      color: "text-primary"
    },
    {
      title: "Active Policies", 
      value: activePolicies.toString(),
      change: "Currently active",
      icon: TrendingUp,
      color: "text-success"
    },
    {
      title: "Total Commissions",
      value: `₹${totalCommissions.toLocaleString()}`,
      change: "Earned to date",
      icon: DollarSign,
      color: "text-info"
    },
    {
      title: "Paid Commissions",
      value: `₹${paidCommissions.toLocaleString()}`,
      change: "Received payouts",
      icon: DollarSign,
      color: "text-success"
    }
  ];

  return (
    <DashboardLayout role="agent" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agent Dashboard</h1>
            <p className="text-muted-foreground">
              Track your policies and commission earnings
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Policy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Policy Document</DialogTitle>
                <DialogDescription>
                  Upload policy PDF for processing and commission calculation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Upload Document</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-primary font-medium">Click to upload</span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept=".pdf" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">PDF up to 10MB</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-warning rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">AI Extraction will process commission details automatically</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline">Cancel</Button>
                <Button>Upload & Process</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Commission Trends</CardTitle>
            <CardDescription>
              Monthly commission earnings over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyCommissions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Commission']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}