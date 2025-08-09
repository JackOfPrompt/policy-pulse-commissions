import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, Download, Target, Users, Package, Building2, Loader2, AlertTriangle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { useRevenueData } from "@/hooks/useRevenueData";

export default function Revenue() {
  const { data: revenueData, loading, error } = useRevenueData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedLOB, setSelectedLOB] = useState("all");
  const [selectedInsurer, setSelectedInsurer] = useState("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading revenue data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Error Loading Revenue Data</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { 
    revenueSummary, 
    monthlyRevenueData, 
    lobRevenueData, 
    agentPerformanceData, 
    productRevenueData 
  } = revenueData;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Revenue Management</h1>
          <p className="text-muted-foreground">
            Track and analyze revenue performance across all business lines
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Revenue Report
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Set Targets
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueSummary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{revenueSummary.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueSummary.achievementRate}%</div>
            <Progress value={revenueSummary.achievementRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {formatCurrency(revenueSummary.expectedRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueSummary.totalPolicies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all lines of business
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing LOB</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{revenueSummary.topPerformingLOB}</div>
            <p className="text-xs text-muted-foreground">
              48% of total revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lob">By Line of Business</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="products">Product Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue vs Target comparison over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatCompactCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Actual Revenue" />
                    <Line type="monotone" dataKey="expected" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Target Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Line of Business</CardTitle>
                <CardDescription>
                  Distribution of revenue across different product lines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={lobRevenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {lobRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Filters & Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <DatePickerWithRange
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range"
                />
                <Select value={selectedLOB} onValueChange={setSelectedLOB}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Line of Business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lines of Business</SelectItem>
                    <SelectItem value="motor">Motor Insurance</SelectItem>
                    <SelectItem value="health">Health Insurance</SelectItem>
                    <SelectItem value="life">Life Insurance</SelectItem>
                    <SelectItem value="travel">Travel Insurance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedInsurer} onValueChange={setSelectedInsurer}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Insurer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Insurers</SelectItem>
                    <SelectItem value="hdfc">HDFC ERGO</SelectItem>
                    <SelectItem value="icici">ICICI Lombard</SelectItem>
                    <SelectItem value="star">Star Health</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lob" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Line of Business Performance</CardTitle>
              <CardDescription>
                Detailed revenue breakdown by business line
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={lobRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCompactCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Revenue Performance</CardTitle>
              <CardDescription>
                Top performing agents by revenue generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Policies Sold</TableHead>
                      <TableHead>Avg Commission</TableHead>
                      <TableHead>Growth Rate</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformanceData.map((agent, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.agentName}</div>
                            <div className="text-sm text-muted-foreground">{agent.agentCode}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(agent.totalRevenue)}</TableCell>
                        <TableCell>{agent.policies}</TableCell>
                        <TableCell>{formatCurrency(agent.avgCommission)}</TableCell>
                        <TableCell>
                          <span className={agent.growth >= 0 ? "text-green-600" : "text-red-600"}>
                            {agent.growth >= 0 ? "+" : ""}{agent.growth}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Revenue Analysis</CardTitle>
              <CardDescription>
                Revenue performance by insurance products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Insurer</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Policies</TableHead>
                      <TableHead>Avg Premium</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productRevenueData.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.insurer}</TableCell>
                        <TableCell>{formatCurrency(product.revenue)}</TableCell>
                        <TableCell>{product.policies}</TableCell>
                        <TableCell>{formatCurrency(product.avgPremium)}</TableCell>
                        <TableCell>{formatCurrency(product.commission)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Analyze</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth Analysis</CardTitle>
                <CardDescription>
                  Month-over-month revenue growth trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                  <p>Detailed trend analysis and forecasting</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Renewal Revenue Tracking</CardTitle>
                <CardDescription>
                  Revenue from policy renewals vs new business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Renewal Analytics</h3>
                  <p>Track renewal revenue patterns</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}