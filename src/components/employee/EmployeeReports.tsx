import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Target, 
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Users,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const monthlyData = [
  { month: 'Jan', policies: 8, premium: 180000, commission: 18000 },
  { month: 'Feb', policies: 12, premium: 220000, commission: 22000 },
  { month: 'Mar', policies: 15, premium: 280000, commission: 28000 },
  { month: 'Apr', policies: 10, premium: 200000, commission: 20000 },
  { month: 'May', policies: 18, premium: 350000, commission: 35000 },
  { month: 'Jun', policies: 22, premium: 420000, commission: 42000 },
];

const lobData = [
  { name: 'Health', value: 40, color: '#0088FE' },
  { name: 'Life', value: 30, color: '#00C49F' },
  { name: 'Motor', value: 20, color: '#FFBB28' },
  { name: 'General', value: 10, color: '#FF8042' },
];

const performanceData = [
  { metric: 'Monthly Target', target: 300000, achieved: 240000, percentage: 80 },
  { metric: 'Quarterly Target', target: 900000, achieved: 720000, percentage: 80 },
  { metric: 'Annual Target', target: 3600000, achieved: 1800000, percentage: 50 },
];

export const EmployeeReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedLob, setSelectedLob] = useState('all');

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // Implementation for export functionality
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your performance and generate reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="policies">Policy Reports</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Achievement</p>
                    <p className="text-2xl font-bold">80%</p>
                    <p className="text-sm text-green-600">+12% from last month</p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Policies Sold</p>
                    <p className="text-2xl font-bold">22</p>
                    <p className="text-sm text-green-600">This month</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ranking</p>
                    <p className="text-2xl font-bold">#3</p>
                    <p className="text-sm text-muted-foreground">Out of 25 agents</p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Target Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Target Progress</CardTitle>
              <CardDescription>Track your progress against set targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {performanceData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.metric}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        ₹{item.achieved.toLocaleString()} / ₹{item.target.toLocaleString()}
                      </span>
                      <Badge 
                        variant={item.percentage >= 80 ? "default" : item.percentage >= 60 ? "secondary" : "destructive"}
                        className="ml-2"
                      >
                        {item.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trend</CardTitle>
              <CardDescription>Track your monthly sales and commission trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="commission" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Commission (₹)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="policies" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Policies Sold"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">This Week</SelectItem>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="quarterly">This Quarter</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedLob} onValueChange={setSelectedLob}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Line of Business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LOB</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>

                <div className="ml-auto">
                  <DatePickerWithRange />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Policies by Month</CardTitle>
                <CardDescription>Number of policies sold each month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="policies" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution by LOB</CardTitle>
                <CardDescription>Policy distribution across different lines of business</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={lobData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {lobData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Policy Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Statistics</CardTitle>
              <CardDescription>Detailed breakdown of your policy portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">95</p>
                  <p className="text-sm text-muted-foreground">Total Policies</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">78</p>
                  <p className="text-sm text-muted-foreground">Active Policies</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">12</p>
                  <p className="text-sm text-muted-foreground">Pending Renewals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">5</p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          {/* Commission Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">₹42,000</p>
                    <p className="text-sm text-green-600">+15% from last month</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">YTD Commission</p>
                    <p className="text-2xl font-bold">₹2,45,000</p>
                    <p className="text-sm text-muted-foreground">Year to date</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">₹8,500</p>
                    <p className="text-sm text-orange-600">Processing</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Trend</CardTitle>
              <CardDescription>Monthly commission earnings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Commission']} />
                  <Bar dataKey="commission" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Commission Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
              <CardDescription>Commission earnings by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lobData.map((lob, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: lob.color }}
                      />
                      <span className="font-medium">{lob.name} Insurance</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{(lob.value * 1000).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{lob.value}% of total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Deep insights into your performance and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">Advanced Analytics</p>
                <p className="text-muted-foreground">
                  Detailed analytics and insights coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};