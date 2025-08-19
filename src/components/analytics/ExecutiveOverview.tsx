import { useState, useEffect } from 'react';
import { DollarSign, FileText, TrendingUp, TrendingDown, Users, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAnalytics, AnalyticsFilters } from '@/hooks/useAnalytics';

interface ExecutiveOverviewProps {
  filters: AnalyticsFilters;
  userRole: string;
}

export const ExecutiveOverview = ({ filters, userRole }: ExecutiveOverviewProps) => {
  const { kpis, premiumTrend, loading, error } = useAnalytics(filters);

  // Fallback data while loading or if no data
  const fallbackKpis = {
    activePolicies: 0,
    gwp: 0,
    collectedPremium: 0,
    newPolicies: 0,
    renewalsDue: 0,
    renewalRate: 0,
    claimsIntimated: 0,
    claimsRatio: 0,
    receivables: 0,
    netPnL: 0,
  };

  const currentKpis = kpis || fallbackKpis;

  const currentPremiumTrend = premiumTrend.length > 0 ? premiumTrend : [
    { month: 'Jan', gwp: 3800000, collected: 3600000, claims: 1800000 },
    { month: 'Feb', gwp: 4100000, collected: 3900000, claims: 1950000 },
    { month: 'Mar', gwp: 4300000, collected: 4100000, claims: 2100000 },
    { month: 'Apr', gwp: 4500000, collected: 4200000, claims: 2200000 },
    { month: 'May', gwp: 4200000, collected: 4000000, claims: 2000000 },
    { month: 'Jun', gwp: 4600000, collected: 4300000, claims: 2150000 },
    { month: 'Jul', gwp: 4800000, collected: 4500000, claims: 2300000 },
    { month: 'Aug', gwp: 4250000, collected: 3925000, claims: 1980000 },
  ];

  const [productMix, setProductMix] = useState([
    { name: 'Motor', value: 45, color: 'hsl(var(--primary))' },
    { name: 'Health', value: 28, color: 'hsl(var(--secondary))' },
    { name: 'Life', value: 15, color: 'hsl(var(--accent))' },
    { name: 'Others', value: 12, color: 'hsl(var(--muted))' },
  ]);

  const [branchLeaderboard, setBranchLeaderboard] = useState([
    { branch: 'Bengaluru', premium: 8200000, growth: 12.5 },
    { branch: 'Hyderabad', premium: 7800000, growth: 8.2 },
    { branch: 'Chennai', premium: 6900000, growth: 15.1 },
    { branch: 'Mumbai', premium: 6200000, growth: -2.3 },
    { branch: 'Pune', premium: 5800000, growth: 6.7 },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: filters.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeIndicator = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (value < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentKpis.activePolicies.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              {getChangeIndicator(5.2)}
              <span className="ml-1">+5.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Written Premium</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentKpis.gwp)}</div>
            <div className="flex items-center text-xs text-green-600">
              {getChangeIndicator(8.1)}
              <span className="ml-1">+8.1% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Premium</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentKpis.collectedPremium)}</div>
            <div className="text-xs text-muted-foreground">
              Collection Rate: {formatPercentage((currentKpis.collectedPremium / currentKpis.gwp) * 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(currentKpis.renewalRate)}</div>
            <div className="flex items-center text-xs text-red-600">
              {getChangeIndicator(-1.2)}
              <span className="ml-1">-1.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentKpis.newPolicies.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              This month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Ratio</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(currentKpis.claimsRatio)}</div>
            <div className="text-xs text-muted-foreground">
              {currentKpis.claimsIntimated} claims intimated
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receivables</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentKpis.receivables)}</div>
            <div className="text-xs text-muted-foreground">
              Outstanding amount
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentKpis.netPnL)}</div>
            <div className="flex items-center text-xs text-green-600">
              {getChangeIndicator(15.3)}
              <span className="ml-1">+15.3% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premium Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Trend</CardTitle>
            <CardDescription>Monthly premium collection and claims</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={currentPremiumTrend}>
                <defs>
                  <linearGradient id="gwpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="gwp"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#gwpGradient)"
                  name="GWP"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="hsl(var(--secondary))"
                  fillOpacity={1}
                  fill="url(#collectedGradient)"
                  name="Collected"
                />
                <Line
                  type="monotone"
                  dataKey="claims"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  name="Claims"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Mix */}
        <Card>
          <CardHeader>
            <CardTitle>Product Mix</CardTitle>
            <CardDescription>Premium distribution by product</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productMix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Branch Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Performance</CardTitle>
          <CardDescription>Top performing branches by premium</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branchLeaderboard.map((branch, index) => (
              <div key={branch.branch} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{branch.branch}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(branch.premium)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getChangeIndicator(branch.growth)}
                  <span className={`text-sm ${branch.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Math.abs(branch.growth))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};