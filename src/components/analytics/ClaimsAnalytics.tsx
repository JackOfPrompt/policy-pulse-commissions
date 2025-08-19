import { useState } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, FunnelChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

interface ClaimsAnalyticsProps {
  filters: any;
  userRole: string;
}

export const ClaimsAnalytics = ({ filters, userRole }: ClaimsAnalyticsProps) => {
  const [claimsKpis] = useState({
    claimsReported: 312,
    claimsSettled: 198,
    settlementRatio: 63.5,
    avgTat: 12.3,
    avgClaimAmount: 185000,
    pendingClaims: 89,
  });

  const [claimsFunnel] = useState([
    { stage: 'Intimated', count: 312, percentage: 100 },
    { stage: 'Surveyed', count: 278, percentage: 89.1 },
    { stage: 'Approved', count: 230, percentage: 73.7 },
    { stage: 'Settled', count: 198, percentage: 63.5 },
  ]);

  const [tatMetrics] = useState([
    { stage: 'Intimation to Survey', avgDays: 2.1, target: 3.0, performance: 'good' },
    { stage: 'Survey to Approval', avgDays: 3.4, target: 5.0, performance: 'good' },
    { stage: 'Approval to Settlement', avgDays: 4.8, target: 7.0, performance: 'good' },
    { stage: 'Overall TAT', avgDays: 12.3, target: 15.0, performance: 'good' },
  ]);

  const [claimsTrend] = useState([
    { month: 'Jan', reported: 280, settled: 195, ratio: 69.6 },
    { month: 'Feb', reported: 295, settled: 210, ratio: 71.2 },
    { month: 'Mar', reported: 310, settled: 198, ratio: 63.9 },
    { month: 'Apr', reported: 275, settled: 180, ratio: 65.5 },
    { month: 'May', reported: 320, settled: 215, ratio: 67.2 },
    { month: 'Jun', reported: 298, settled: 195, ratio: 65.4 },
    { month: 'Jul', reported: 285, settled: 185, ratio: 64.9 },
    { month: 'Aug', reported: 312, settled: 198, ratio: 63.5 },
  ]);

  const [highValueClaims] = useState([
    { policyNumber: 'POL-2024-001234', customerName: 'Rajesh Kumar', product: 'Motor', amount: 850000, status: 'Under Review', tat: 8 },
    { policyNumber: 'POL-2024-001567', customerName: 'Priya Sharma', product: 'Health', amount: 750000, status: 'Approved', tat: 12 },
    { policyNumber: 'POL-2024-002890', customerName: 'Amit Patel', product: 'Motor', amount: 680000, status: 'Surveyed', tat: 5 },
    { policyNumber: 'POL-2024-003456', customerName: 'Sunita Reddy', product: 'Health', amount: 620000, status: 'Settled', tat: 14 },
    { policyNumber: 'POL-2024-004123', customerName: 'Vikram Singh', product: 'Motor', amount: 580000, status: 'Intimated', tat: 2 },
  ]);

  const [productClaims] = useState([
    { product: 'Motor Insurance', reported: 178, settled: 115, ratio: 64.6, avgAmount: 195000 },
    { product: 'Health Insurance', reported: 98, settled: 62, ratio: 63.3, avgAmount: 285000 },
    { product: 'Life Insurance', reported: 28, settled: 18, ratio: 64.3, avgAmount: 450000 },
    { product: 'Travel Insurance', reported: 8, settled: 3, ratio: 37.5, avgAmount: 25000 },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Settled': return 'default';
      case 'Approved': return 'secondary';
      case 'Under Review': return 'outline';
      case 'Surveyed': return 'outline';
      default: return 'destructive';
    }
  };

  return (
    <div className="space-y-6">
      {/* Claims KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Reported</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsKpis.claimsReported}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsKpis.claimsSettled}</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Ratio</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(claimsKpis.settlementRatio)}</div>
            <p className="text-xs text-muted-foreground">Claims settled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average TAT</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsKpis.avgTat} days</div>
            <p className="text-xs text-muted-foreground">End to end</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(claimsKpis.avgClaimAmount)}</div>
            <p className="text-xs text-muted-foreground">Per claim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsKpis.pendingClaims}</div>
            <p className="text-xs text-muted-foreground">In process</p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Processing Funnel</CardTitle>
          <CardDescription>Claims progression through various stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {claimsFunnel.map((stage, index) => (
              <div key={stage.stage} className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-24 text-sm font-medium">{stage.stage}</div>
                  <Progress value={stage.percentage} className="flex-1" />
                  <div className="w-16 text-sm text-right">{stage.count}</div>
                  <div className="w-16 text-sm text-right text-muted-foreground">
                    {formatPercentage(stage.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TAT Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Turnaround Time (TAT) Analysis</CardTitle>
          <CardDescription>Average processing time by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Avg Days</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tatMetrics.map((metric) => (
                <TableRow key={metric.stage}>
                  <TableCell className="font-medium">{metric.stage}</TableCell>
                  <TableCell className="text-right">{metric.avgDays}</TableCell>
                  <TableCell className="text-right">{metric.target}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={metric.avgDays <= metric.target ? "default" : "destructive"}>
                      {metric.avgDays <= metric.target ? 'On Target' : 'Delayed'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Claims Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Trend</CardTitle>
          <CardDescription>Monthly claims reported vs settled with ratio</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={claimsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="reported" fill="hsl(var(--muted))" name="Reported" />
              <Bar yAxisId="left" dataKey="settled" fill="hsl(var(--primary))" name="Settled" />
              <Line yAxisId="right" type="monotone" dataKey="ratio" stroke="hsl(var(--secondary))" strokeWidth={3} name="Settlement Ratio %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Value Claims */}
        <Card>
          <CardHeader>
            <CardTitle>High Value Claims</CardTitle>
            <CardDescription>Claims above ₹5 lakhs requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">TAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highValueClaims.map((claim) => (
                  <TableRow key={claim.policyNumber}>
                    <TableCell className="font-mono text-xs">{claim.policyNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.customerName}</div>
                        <div className="text-xs text-muted-foreground">{claim.product}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(claim.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{claim.tat} days</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Claims Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Product Claims Performance</CardTitle>
            <CardDescription>Claims metrics by product type</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Reported</TableHead>
                  <TableHead className="text-right">Settled</TableHead>
                  <TableHead className="text-right">Ratio</TableHead>
                  <TableHead className="text-right">Avg Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productClaims.map((product) => (
                  <TableRow key={product.product}>
                    <TableCell className="font-medium">{product.product}</TableCell>
                    <TableCell className="text-right">{product.reported}</TableCell>
                    <TableCell className="text-right">{product.settled}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.ratio >= 60 ? "default" : "destructive"}>
                        {formatPercentage(product.ratio)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.avgAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};