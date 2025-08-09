import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';
import { EmployeeSidebar } from '@/components/employee/EmployeeSidebar';
import { LeadPipelineView } from '@/components/lead/LeadPipelineView';
import { useEmployeeDashboardData } from '@/hooks/useEmployeeDashboardData';
import { useNotifications } from '@/hooks/useNotifications';
import { useLeadsDashboard } from '@/hooks/useLeadsDashboard';
import { useTasks } from '@/hooks/useTasks';
import { OfflinePolicyForm } from '@/components/policy/OfflinePolicyForm';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Activity,
  IndianRupee,
  RefreshCw,
  Bell
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const EmployeeDashboard = () => {
  const { user } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [lobFilter, setLobFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Real-time data hooks
  const { loading: dashboardLoading, stats, policies, chartData, refreshData } = useEmployeeDashboardData(dateRange);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { stats: leadStats, leads } = useLeadsDashboard(user?.role || 'Employee');
  const { tasks, stats: taskStats, updateTaskStatus } = useTasks(user?.role || 'Employee');
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  // Format large currency
  const formatLargeCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Issued': return 'default';
      case 'Underwriting': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="flex h-screen">
      <EmployeeSidebar />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Employee Dashboard - {user?.email}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">Employee</Badge>
                <Badge variant="default">Role: {user?.role}</Badge>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    {unreadCount} notifications
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={refreshData} disabled={dashboardLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${dashboardLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter:</span>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dashboardLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading data...
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="offline">Offline Entry</TabsTrigger>
            <TabsTrigger value="graphs">Performance</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Revenue Overview Cards */}
          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Premium Booked</p>
                      <p className="text-2xl font-bold text-blue-600">{formatLargeCurrency(stats.totalPremium)}</p>
                      <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">No. of Policies Added</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalPolicies}</p>
                      <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue Generated</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Total commission</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Policy Status</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="default" className="text-xs">{stats.policiesIssued} Issued</Badge>
                        <Badge variant="secondary" className="text-xs">{stats.policiesUnderwriting} UW</Badge>
                        <Badge variant="destructive" className="text-xs">{stats.policiesRejected} Rejected</Badge>
                      </div>
                    </div>
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>Policy Table View</CardTitle>
                <CardDescription>Policies created by this employee with filters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4 flex-wrap">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={lobFilter} onValueChange={setLobFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Product/LOB" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="life">Life</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="issued">Issued</SelectItem>
                      <SelectItem value="underwriting">Underwriting</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{policy.policy_number}</TableCell>
                        <TableCell>{policy.customer_name}</TableCell>
                        <TableCell>{policy.product_name}</TableCell>
                        <TableCell className="font-medium">₹{policy.premium_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(policy.policy_status)}>
                            {policy.policy_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(policy.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offline Policy Entry Tab */}
          <TabsContent value="offline">
            <OfflinePolicyForm />
          </TabsContent>

          {/* Performance Graphs Tab */}
          <TabsContent value="graphs" className="space-y-6">
            {/* Premium vs Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Premium vs Revenue (Commission)</CardTitle>
                <CardDescription>Monthly premium booked vs revenue generated</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `₹${(value as number).toLocaleString()}`, 
                        name === 'premium' ? 'Premium' : 'Revenue'
                      ]}
                    />
                    <Bar dataKey="premium" fill="#0088FE" name="premium" />
                    <Bar dataKey="revenue" fill="#00C49F" name="revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Performance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance Trend</CardTitle>
                  <CardDescription>Revenue growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Product-wise Business Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Product-wise Business Distribution</CardTitle>
                  <CardDescription>Business share by product type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Product distribution chart coming soon...
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <LeadPipelineView userRole={user?.role || 'employee'} userId={user?.id || ''} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                      <p className="text-2xl font-bold">{taskStats.total}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">{taskStats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due Today</p>
                      <p className="text-2xl font-bold text-red-600">{taskStats.dueToday}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.slice(0, 10).map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.task_title}</TableCell>
                        <TableCell>{task.task_type}</TableCell>
                        <TableCell>
                          <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(task.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, task.status === 'Completed' ? 'Open' : 'Completed')}
                          >
                            {task.status === 'Completed' ? 'Reopen' : 'Complete'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  Mark All as Read
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`${!notification.read_status ? 'border-primary/50 bg-primary/5' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{notification.notification_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{notification.message}</p>
                      </div>
                      {!notification.read_status && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {notifications.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDashboard;