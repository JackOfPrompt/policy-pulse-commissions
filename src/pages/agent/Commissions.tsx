import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCommissionCalculator } from "@/hooks/useCommissionCalculator";
import users from "@/data/users.json";

interface PolicyCommission {
  id: string;
  policy_number: string;
  customer_name: string;
  premium: number;
  commission_rate: number;
  commission_amount: number;
  reward_amount: number;
  total_amount: number;
  status: 'pending' | 'paid';
  payout_date?: string;
  created_at: string;
}

export default function AgentCommissions() {
  const user = users.agent;
  const [policies, setPolicies] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<PolicyCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const { calculateBulkCommissions } = useCommissionCalculator();

  useEffect(() => {
    fetchAgentPolicies();
  }, []);

  const fetchAgentPolicies = async () => {
    try {
      // Fetch policies for the current agent
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

      setPolicies(policiesData || []);

      // Calculate commissions for all policies
      if (policiesData && policiesData.length > 0) {
        const policyIds = policiesData.map(p => p.id);
        const commissionResults = await calculateBulkCommissions(policyIds);

        const commissionsWithPolicies = policiesData.map(policy => {
          const commissionResult = commissionResults.find(c => 
            // Note: We'd need to match this properly in real implementation
            true // For now, just use first result per policy
          );

          return {
            id: policy.id,
            policy_number: policy.policy_number,
            customer_name: `${policy.customers?.first_name || ''} ${policy.customers?.last_name || ''}`.trim(),
            premium: policy.premium_without_gst || 0,
            commission_rate: commissionResult?.commission_rate || 0,
            commission_amount: commissionResult?.commission_amount || 0,
            reward_amount: commissionResult?.reward_amount || 0,
            total_amount: commissionResult?.total_amount || 0,
            status: Math.random() > 0.5 ? 'paid' : 'pending' as 'paid' | 'pending', // Mock status for now
            payout_date: Math.random() > 0.5 ? new Date().toISOString() : undefined,
            created_at: policy.created_at
          };
        });

        setCommissions(commissionsWithPolicies);
      }
    } catch (error) {
      console.error('Error fetching agent policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.total_amount, 0);

  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.total_amount, 0);

  // Group commissions by month for chart
  const monthlyData = commissions
    .filter(c => c.status === 'paid')
    .reduce((acc: any[], comm) => {
      const date = new Date(comm.created_at);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === monthYear);
      
      if (existing) {
        existing.amount += comm.total_amount;
      } else {
        acc.push({
          month: monthYear,
          amount: comm.total_amount
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  if (loading) {
    return (
      <DashboardLayout role="agent" user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading commissions...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Commissions</h1>
            <p className="text-muted-foreground">
              Track your earnings and payouts
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(totalPending + totalPaid).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending + paid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Trends</CardTitle>
            <CardDescription>
              Monthly commission earnings (last 6 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Commission']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Details</CardTitle>
            <CardDescription>
              All commission records and payout status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Commission Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payout Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.policy_number}</TableCell>
                    <TableCell>{commission.customer_name}</TableCell>
                    <TableCell>₹{commission.premium.toLocaleString()}</TableCell>
                    <TableCell>{commission.commission_rate}%</TableCell>
                    <TableCell>₹{commission.commission_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusChip
                        variant={commission.status === 'paid' ? 'success' : 'warning'}
                      >
                        {commission.status}
                      </StatusChip>
                    </TableCell>
                    <TableCell>
                      {commission.payout_date ? 
                        new Date(commission.payout_date).toLocaleDateString() : 
                        'Pending'
                      }
                    </TableCell>
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