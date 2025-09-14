import { useState, useEffect } from "react";
import { Download, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCommissionCalculator } from "@/hooks/useCommissionCalculator";
import users from "@/data/users.json";

interface EarningsData {
  month: string;
  commission: number;
  reward: number;
  total: number;
  policies: number;
}

interface PolicyCommission {
  policy_number: string;
  customer_name: string;
  product_type: string;
  premium: number;
  commission_rate: number;
  commission_amount: number;
  reward_amount: number;
  total_amount: number;
  issue_date: string;
  status: 'pending' | 'paid';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AgentEarningsTracker() {
  const user = users.agent;
  const { toast } = useToast();
  const { calculateBulkCommissions } = useCommissionCalculator();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PolicyCommission[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [totalEarnings, setTotalEarnings] = useState({
    commission: 0,
    reward: 0,
    total: 0,
    pending: 0
  });

  useEffect(() => {
    fetchAgentEarnings();
  }, [selectedPeriod]);

  const fetchAgentEarnings = async () => {
    try {
      setLoading(true);

      // Fetch policies for the agent
      const { data: policiesData, error } = await supabase
        .from('policies')
        .select(`
          *,
          customers(first_name, last_name),
          product_types(name, category)
        `)
        .eq('agent_id', user.id) // This would be the actual agent ID
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (policiesData && policiesData.length > 0) {
        // Calculate commissions for all policies
        const policyIds = policiesData.map(p => p.id);
        const commissionResults = await calculateBulkCommissions(policyIds);

        // Process policies with commission data
        const processedPolicies: PolicyCommission[] = policiesData.map((policy, index) => {
          const commissionResult = commissionResults[index];
          const premium = policy.premium_without_gst || 0;
          
          return {
            policy_number: policy.policy_number,
            customer_name: `${policy.customers?.first_name || ''} ${policy.customers?.last_name || ''}`.trim(),
            product_type: policy.product_types?.category || 'Unknown',
            premium: premium,
            commission_rate: commissionResult?.commission_rate || 0,
            commission_amount: commissionResult?.commission_amount || 0,
            reward_amount: commissionResult?.reward_amount || 0,
            total_amount: commissionResult?.total_amount || 0,
            issue_date: policy.created_at,
            status: Math.random() > 0.7 ? 'paid' : 'pending' as 'paid' | 'pending' // Mock status
          };
        });

        setPolicies(processedPolicies);

        // Calculate monthly earnings data
        const monthlyData = calculateMonthlyEarnings(processedPolicies);
        setEarningsData(monthlyData);

        // Calculate total earnings
        const totals = processedPolicies.reduce((acc, policy) => {
          acc.commission += policy.commission_amount;
          acc.reward += policy.reward_amount;
          acc.total += policy.total_amount;
          if (policy.status === 'pending') {
            acc.pending += policy.total_amount;
          }
          return acc;
        }, { commission: 0, reward: 0, total: 0, pending: 0 });

        setTotalEarnings(totals);
      }
    } catch (error) {
      console.error('Error fetching agent earnings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyEarnings = (policies: PolicyCommission[]): EarningsData[] => {
    const monthlyMap = new Map<string, EarningsData>();

    policies.forEach(policy => {
      const date = new Date(policy.issue_date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          commission: 0,
          reward: 0,
          total: 0,
          policies: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.commission += policy.commission_amount;
      monthData.reward += policy.reward_amount;
      monthData.total += policy.total_amount;
      monthData.policies += 1;
    });

    return Array.from(monthlyMap.values())
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-parseInt(selectedPeriod.replace('months', '')));
  };

  const productTypeData = policies.reduce((acc, policy) => {
    const existing = acc.find(item => item.name === policy.product_type);
    if (existing) {
      existing.value += policy.total_amount;
      existing.count += 1;
    } else {
      acc.push({
        name: policy.product_type,
        value: policy.total_amount,
        count: 1
      });
    }
    return acc;
  }, [] as { name: string; value: number; count: number }[]);

  if (loading) {
    return (
      <DashboardLayout role="agent" user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading earnings data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Earnings Tracker</h1>
            <p className="text-muted-foreground">
              Track your commission earnings and performance
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings.commission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings.reward.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Bonus earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
              <Calendar className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings.pending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.length}</div>
              <p className="text-xs text-muted-foreground">Policies sold</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings Trend</CardTitle>
              <CardDescription>Commission and reward trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                  <Bar dataKey="commission" fill="hsl(var(--primary))" name="Commission" />
                  <Bar dataKey="reward" fill="hsl(var(--secondary))" name="Reward" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Earnings by Product Type</CardTitle>
              <CardDescription>Commission distribution across products</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {productTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Commission']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Policy Commission Details */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Details</CardTitle>
            <CardDescription>Detailed breakdown of earnings per policy</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Commission Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.slice(0, 10).map((policy, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{policy.policy_number}</TableCell>
                    <TableCell>{policy.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.product_type}</Badge>
                    </TableCell>
                    <TableCell>₹{policy.premium.toLocaleString()}</TableCell>
                    <TableCell>{policy.commission_rate}%</TableCell>
                    <TableCell className="font-medium">₹{policy.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={policy.status === 'paid' ? 'default' : 'secondary'}>
                        {policy.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(policy.issue_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}