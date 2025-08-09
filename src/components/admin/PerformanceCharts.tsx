import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Target, Calendar } from "lucide-react";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
  lineOfBusiness: string | null;
  agentId: string | null;
  productId: string | null;
  providerId: string | null;
}

interface PerformanceChartsProps {
  filters: FilterState;
}

interface MonthlyData {
  month: string;
  premium: number;
  commission: number;
  payout: number;
}

interface BranchData {
  branch: string;
  policies: number;
  premium: number;
}

interface ProductData {
  name: string;
  value: number;
  percentage: number;
}

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d'];

export const PerformanceCharts = ({ filters }: PerformanceChartsProps) => {
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([]);
  const [branchPerformance, setBranchPerformance] = useState<BranchData[]>([]);
  const [productDistribution, setProductDistribution] = useState<ProductData[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [filters]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMonthlyTrend(),
        fetchBranchPerformance(),
        fetchProductDistribution(),
        fetchConversionFunnel()
      ]);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTrend = async () => {
    try {
      let policyQuery = supabase.from('policies_new').select('premium_amount, created_at');
      let commissionQuery = supabase.from('commissions').select('commission_amount, created_at');
      let payoutQuery = supabase.from('payout_transactions').select('payout_amount, created_at');

      // Apply filters
      if (filters.branchId) {
        policyQuery = policyQuery.eq('branch_id', filters.branchId);
        payoutQuery = payoutQuery.eq('agent_id', filters.agentId); // Assuming agent filter
      }

      const [policies, commissions, payouts] = await Promise.all([
        policyQuery,
        commissionQuery,
        payoutQuery
      ]);

      // Group by month
      const monthlyData: { [key: string]: MonthlyData } = {};
      
      policies.data?.forEach(policy => {
        const month = new Date(policy.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, premium: 0, commission: 0, payout: 0 };
        }
        monthlyData[month].premium += policy.premium_amount || 0;
      });

      commissions.data?.forEach(commission => {
        const month = new Date(commission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, premium: 0, commission: 0, payout: 0 };
        }
        monthlyData[month].commission += commission.commission_amount || 0;
      });

      payouts.data?.forEach(payout => {
        const month = new Date(payout.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, premium: 0, commission: 0, payout: 0 };
        }
        monthlyData[month].payout += payout.payout_amount || 0;
      });

      setMonthlyTrend(Object.values(monthlyData).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()));
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
    }
  };

  const fetchBranchPerformance = async () => {
    try {
      const { data: branches } = await supabase.from('branches').select('id, name').eq('status', 'Active');
      const branchData: BranchData[] = [];

      for (const branch of branches || []) {
        let query = supabase.from('policies_new').select('*').eq('branch_id', branch.id);
        
        if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
        if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

        const { data: policies } = await query;
        
        branchData.push({
          branch: branch.name,
          policies: policies?.length || 0,
          premium: policies?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0
        });
      }

      setBranchPerformance(branchData.sort((a, b) => b.premium - a.premium).slice(0, 10));
    } catch (error) {
      console.error('Error fetching branch performance:', error);
    }
  };

  const fetchProductDistribution = async () => {
    try {
      let query = supabase.from('policies_with_details').select('product_name, premium_amount');
      
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());
      if (filters.lineOfBusiness) query = query.eq('line_of_business', filters.lineOfBusiness);

      const { data: policies } = await query;

      const productData: { [key: string]: number } = {};
      let total = 0;

      policies?.forEach(policy => {
        const product = policy.product_name || 'Unknown';
        productData[product] = (productData[product] || 0) + (policy.premium_amount || 0);
        total += policy.premium_amount || 0;
      });

      const distribution = Object.entries(productData).map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100)
      })).sort((a, b) => b.value - a.value);

      setProductDistribution(distribution);
    } catch (error) {
      console.error('Error fetching product distribution:', error);
    }
  };

  const fetchConversionFunnel = async () => {
    try {
      let leadQuery = supabase.from('leads').select('lead_status');
      
      if (filters.startDate) leadQuery = leadQuery.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) leadQuery = leadQuery.lte('created_at', filters.endDate.toISOString());
      if (filters.branchId) leadQuery = leadQuery.eq('branch_id', filters.branchId);

      const { data: leads } = await leadQuery;

      const statusCounts = {
        'New': 0,
        'Contacted': 0,
        'Interested': 0,
        'Quoted': 0,
        'Converted': 0
      };

      leads?.forEach(lead => {
        if (statusCounts.hasOwnProperty(lead.lead_status)) {
          statusCounts[lead.lead_status as keyof typeof statusCounts]++;
        }
      });

      const funnelData: FunnelData[] = [
        { name: 'New Leads', value: statusCounts.New + statusCounts.Contacted + statusCounts.Interested + statusCounts.Quoted + statusCounts.Converted, fill: COLORS[0] },
        { name: 'Contacted', value: statusCounts.Contacted + statusCounts.Interested + statusCounts.Quoted + statusCounts.Converted, fill: COLORS[1] },
        { name: 'Interested', value: statusCounts.Interested + statusCounts.Quoted + statusCounts.Converted, fill: COLORS[2] },
        { name: 'Quoted', value: statusCounts.Quoted + statusCounts.Converted, fill: COLORS[3] },
        { name: 'Converted', value: statusCounts.Converted, fill: COLORS[4] }
      ];

      setConversionFunnel(funnelData);
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conversion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Premium & Commission Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="premium" stroke="hsl(var(--primary))" strokeWidth={3} name="Premium Collected" />
                    <Line type="monotone" dataKey="commission" stroke="hsl(var(--secondary))" strokeWidth={3} name="Commission Earned" />
                    <Line type="monotone" dataKey="payout" stroke="hsl(var(--accent))" strokeWidth={3} name="Agent Payouts" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Performing Branches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={branchPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                  <Bar dataKey="premium" fill="hsl(var(--primary))" name="Premium Generated" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Product-wise Business Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={productDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Premium']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lead Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={conversionFunnel}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" stroke="none" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};