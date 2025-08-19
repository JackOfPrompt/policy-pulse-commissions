import { useState } from 'react';
import { RotateCcw, Users, Percent, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface RenewalsRetentionProps {
  filters: any;
  userRole: string;
}

export const RenewalsRetention = ({ filters, userRole }: RenewalsRetentionProps) => {
  const [renewalKpis] = useState({
    renewalEligible: 2890,
    renewed: 2267,
    renewalRate: 78.4,
    churnRate: 21.6,
    onTimeRenewal: 82.3,
  });

  const [renewalTrend] = useState([
    { month: 'Jan', eligible: 2650, renewed: 2120, rate: 80.0 },
    { month: 'Feb', eligible: 2780, renewed: 2180, rate: 78.4 },
    { month: 'Mar', eligible: 2890, renewed: 2310, rate: 79.9 },
    { month: 'Apr', eligible: 2560, renewed: 1970, rate: 77.0 },
    { month: 'May', eligible: 3100, renewed: 2420, rate: 78.1 },
    { month: 'Jun', eligible: 3200, renewed: 2530, rate: 79.1 },
    { month: 'Jul', eligible: 3050, renewed: 2380, rate: 78.0 },
    { month: 'Aug', eligible: 2890, renewed: 2267, rate: 78.4 },
  ]);

  const [cohortData] = useState([
    { cohort: '2024-01', size: 1200, m3: 95.2, m6: 89.1, m9: 83.8, m12: 78.5 },
    { cohort: '2024-02', size: 1350, m3: 94.8, m6: 88.9, m9: 82.1, m12: 76.2 },
    { cohort: '2024-03', size: 1180, m3: 96.1, m6: 90.3, m9: 84.7, m12: 79.1 },
    { cohort: '2024-04', size: 1420, m3: 93.7, m6: 87.2, m9: 81.5, m12: 75.8 },
    { cohort: '2024-05', size: 1280, m3: 95.5, m6: 89.7, m9: 83.2, m12: null },
    { cohort: '2024-06', size: 1380, m3: 94.2, m6: 88.1, m9: null, m12: null },
    { cohort: '2024-07', size: 1520, m3: 96.8, m6: null, m9: null, m12: null },
    { cohort: '2024-08', size: 1450, m3: null, m6: null, m9: null, m12: null },
  ]);

  const [productRenewalRates] = useState([
    { product: 'Motor Insurance', eligible: 1580, renewed: 1264, rate: 80.0 },
    { product: 'Health Insurance', eligible: 890, renewed: 671, rate: 75.4 },
    { product: 'Life Insurance', eligible: 320, renewed: 246, rate: 76.9 },
    { product: 'Travel Insurance', eligible: 100, renewed: 86, rate: 86.0 },
  ]);

  const [churnReasons] = useState([
    { reason: 'Price Sensitivity', count: 187, percentage: 30.1 },
    { reason: 'Poor Claims Experience', count: 124, percentage: 19.9 },
    { reason: 'Better Offers Elsewhere', count: 98, percentage: 15.8 },
    { reason: 'Dissatisfied with Service', count: 76, percentage: 12.2 },
    { reason: 'Changed Requirements', count: 67, percentage: 10.8 },
    { reason: 'Others', count: 71, percentage: 11.4 },
  ]);

  const formatPercentage = (value: number | null) => {
    return value ? `${value.toFixed(1)}%` : '-';
  };

  return (
    <div className="space-y-6">
      {/* Renewal KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Eligible</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{renewalKpis.renewalEligible.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewed</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{renewalKpis.renewed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successfully renewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(renewalKpis.renewalRate)}</div>
            <p className="text-xs text-muted-foreground">Overall rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(renewalKpis.churnRate)}</div>
            <p className="text-xs text-muted-foreground">Customer attrition</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-time Renewal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(renewalKpis.onTimeRenewal)}</div>
            <p className="text-xs text-muted-foreground">Before expiry</p>
          </CardContent>
        </Card>
      </div>

      {/* Renewal Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Renewal Rate Trend</CardTitle>
          <CardDescription>Monthly renewal eligible vs renewed policies</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={renewalTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="eligible" fill="hsl(var(--muted))" name="Eligible" />
              <Bar yAxisId="left" dataKey="renewed" fill="hsl(var(--primary))" name="Renewed" />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="hsl(var(--secondary))" strokeWidth={3} name="Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Retention Cohorts</CardTitle>
          <CardDescription>Retention rate by acquisition cohort over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acquisition Month</TableHead>
                <TableHead className="text-right">Cohort Size</TableHead>
                <TableHead className="text-right">3 Months</TableHead>
                <TableHead className="text-right">6 Months</TableHead>
                <TableHead className="text-right">9 Months</TableHead>
                <TableHead className="text-right">12 Months</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohortData.map((cohort) => (
                <TableRow key={cohort.cohort}>
                  <TableCell className="font-medium">{cohort.cohort}</TableCell>
                  <TableCell className="text-right">{cohort.size.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {cohort.m3 ? (
                      <Badge variant={cohort.m3 >= 95 ? "default" : cohort.m3 >= 90 ? "secondary" : "destructive"}>
                        {formatPercentage(cohort.m3)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {cohort.m6 ? (
                      <Badge variant={cohort.m6 >= 85 ? "default" : cohort.m6 >= 80 ? "secondary" : "destructive"}>
                        {formatPercentage(cohort.m6)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {cohort.m9 ? (
                      <Badge variant={cohort.m9 >= 80 ? "default" : cohort.m9 >= 75 ? "secondary" : "destructive"}>
                        {formatPercentage(cohort.m9)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {cohort.m12 ? (
                      <Badge variant={cohort.m12 >= 75 ? "default" : cohort.m12 >= 70 ? "secondary" : "destructive"}>
                        {formatPercentage(cohort.m12)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Renewal Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Renewal Rate by Product</CardTitle>
            <CardDescription>Product-wise renewal performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Eligible</TableHead>
                  <TableHead className="text-right">Renewed</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productRenewalRates.map((product) => (
                  <TableRow key={product.product}>
                    <TableCell className="font-medium">{product.product}</TableCell>
                    <TableCell className="text-right">{product.eligible.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{product.renewed.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.rate >= 80 ? "default" : product.rate >= 75 ? "secondary" : "destructive"}>
                        {formatPercentage(product.rate)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Churn Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Analysis</CardTitle>
            <CardDescription>Reasons for non-renewal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {churnReasons.map((reason) => (
                <div key={reason.reason} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{reason.reason}</div>
                    <div className="text-xs text-muted-foreground">{reason.count} customers</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{formatPercentage(reason.percentage)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};