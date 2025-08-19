import { useState } from 'react';
import { TrendingUp, Target, Users, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

interface SalesAnalyticsProps {
  filters: any;
  userRole: string;
}

export const SalesAnalytics = ({ filters, userRole }: SalesAnalyticsProps) => {
  const [salesKpis] = useState({
    quotesToIssued: 68.5,
    newPolicies: 1580,
    endorsements: 342,
    renewals: 1896,
    averagePremium: 28500,
    crossSellRate: 23.4,
  });

  const [salesTrend] = useState([
    { month: 'Jan', quotes: 2800, issued: 1890, renewals: 1650 },
    { month: 'Feb', quotes: 3100, issued: 2140, renewals: 1780 },
    { month: 'Mar', quotes: 3200, issued: 2200, renewals: 1920 },
    { month: 'Apr', quotes: 2900, issued: 1980, renewals: 1650 },
    { month: 'May', quotes: 3300, issued: 2250, renewals: 2100 },
    { month: 'Jun', quotes: 3500, issued: 2380, renewals: 2050 },
    { month: 'Jul', quotes: 3400, issued: 2310, renewals: 1980 },
    { month: 'Aug', quotes: 2300, issued: 1580, renewals: 1896 },
  ]);

  const [productPerformance] = useState([
    { product: 'Motor Insurance', issued: 892, premium: 25400000, conversion: 72.3, avgPremium: 28475 },
    { product: 'Health Insurance', issued: 456, premium: 12800000, conversion: 65.8, avgPremium: 28070 },
    { product: 'Life Insurance', issued: 167, premium: 8900000, conversion: 58.2, avgPremium: 53293 },
    { product: 'Travel Insurance', issued: 65, premium: 780000, conversion: 81.2, avgPremium: 12000 },
  ]);

  const [channelPerformance] = useState([
    { channel: 'Direct Online', policies: 628, premium: 15600000, conversion: 78.5 },
    { channel: 'Agent Network', policies: 542, premium: 18200000, conversion: 64.2 },
    { channel: 'Broker Partners', policies: 298, premium: 10800000, conversion: 59.8 },
    { channel: 'Corporate Sales', policies: 112, premium: 12900000, conversion: 85.4 },
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

  return (
    <div className="space-y-6">
      {/* Sales KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(salesKpis.quotesToIssued)}</div>
            <p className="text-xs text-muted-foreground">Quotes to Issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Policies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesKpis.newPolicies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesKpis.averagePremium)}</div>
            <p className="text-xs text-muted-foreground">Per policy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesKpis.renewals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endorsements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesKpis.endorsements.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cross-sell Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(salesKpis.crossSellRate)}</div>
            <p className="text-xs text-muted-foreground">Additional products</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Activity Trend</CardTitle>
          <CardDescription>Monthly quotes, issued policies, and renewals</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quotes" stroke="hsl(var(--muted-foreground))" name="Quotes" />
              <Line type="monotone" dataKey="issued" stroke="hsl(var(--primary))" name="Issued" strokeWidth={2} />
              <Line type="monotone" dataKey="renewals" stroke="hsl(var(--secondary))" name="Renewals" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Performance metrics by product type</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Policies Issued</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
                <TableHead className="text-right">Avg Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productPerformance.map((product) => (
                <TableRow key={product.product}>
                  <TableCell className="font-medium">{product.product}</TableCell>
                  <TableCell className="text-right">{product.issued.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.premium)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={product.conversion >= 70 ? "default" : product.conversion >= 60 ? "secondary" : "destructive"}>
                      {formatPercentage(product.conversion)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(product.avgPremium)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>Sales performance by distribution channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={channelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Bar dataKey="policies" fill="hsl(var(--primary))" name="Policies" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {channelPerformance.map((channel) => (
                <div key={channel.channel} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{channel.channel}</div>
                    <div className="text-sm text-muted-foreground">
                      {channel.policies} policies • {formatCurrency(channel.premium)}
                    </div>
                  </div>
                  <Badge variant={channel.conversion >= 75 ? "default" : "secondary"}>
                    {formatPercentage(channel.conversion)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};