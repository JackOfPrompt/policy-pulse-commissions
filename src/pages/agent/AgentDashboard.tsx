import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';
import { AgentSidebar } from '@/components/agent/AgentSidebar';
import { LeadPipelineView } from '@/components/lead/LeadPipelineView';
import { useAgentDashboardData } from '@/hooks/useAgentDashboardData';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Clock, 
  Target,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  BarChart3,
  Download,
  Eye,
  Upload,
  RefreshCw,
  Bell
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AgentDashboard = () => {
  const { user } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('performance');
  const [dateRange, setDateRange] = useState('30');

  // Real-time data hooks
  const { loading, stats, payouts, policies, chartData } = useAgentDashboardData(dateRange);
  const { notifications: liveNotifications, unreadCount } = useNotifications();

  // Format currency helper
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(1)}K`;
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="flex h-screen">
      <AgentSidebar />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, Agent {user?.email}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">Agent</Badge>
            <Badge variant="default">KYC: Verified</Badge>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} notifications</Badge>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Filter:</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="performance">My Performance</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="renewals">Renewals</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* My Performance Tab - Payout KPIs */}
          <TabsContent value="performance" className="space-y-6">
            {/* Payout KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Commission Earned</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCommission)}</p>
                      <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingPayouts)}</p>
                      <p className="text-xs text-muted-foreground">{payouts.filter(p => p.payout_status === 'Pending').length} transactions</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">No. of Policies Closed</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalPolicies}</p>
                      <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Free-look Reversals</p>
                      <p className="text-2xl font-bold text-red-600">{stats.freeLookReversals}</p>
                      <p className="text-xs text-muted-foreground">Cancelled policies</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payout History Graph */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Commission Trend</CardTitle>
                <CardDescription>Track your earnings over time</CardDescription>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Commission']} />
                      <Bar dataKey="commission" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Commission by LOB/Product */}
            <Card>
              <CardHeader>
                <CardTitle>Commission by Line of Business</CardTitle>
                <CardDescription>Breakdown of earnings by product type</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Commission by LOB chart - Coming soon with enhanced analytics
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>Policies Submitted</CardTitle>
                <CardDescription>Track your submitted policies and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy No.</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.slice(0, 10).map((policy, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{policy.policy_number}</TableCell>
                      <TableCell>{policy.customer_name}</TableCell>
                      <TableCell>{policy.product_name}</TableCell>
                      <TableCell>₹{policy.premium_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={policy.policy_status === 'Issued' ? 'default' : 'secondary'}>
                          {policy.policy_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-600">₹{policy.commission_amount.toLocaleString()}</TableCell>
                      <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm"><Upload className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            {/* Download Statements */}
            <Card>
              <CardHeader>
                <CardTitle>Download Statements</CardTitle>
                <CardDescription>Export payout history and agent-friendly summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Excel Export
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Agent Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payout Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Detailed commission tracking by policy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by LOB" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All LOBs</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="life">Life</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy No</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Commission %</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{transaction.policy_number}</TableCell>
                        <TableCell>{transaction.product_name}</TableCell>
                        <TableCell>₹{transaction.premium_amount.toLocaleString()}</TableCell>
                        <TableCell>8.5%</TableCell>
                        <TableCell className="font-medium text-green-600">₹{transaction.commission_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getPayoutStatusBadge(transaction.payout_status)}>
                            {transaction.payout_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(transaction.payout_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Free Look Cancellation Alerts - Show if any exist */}
            {stats.freeLookReversals > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Free Look Cancellation Notice
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    You have {stats.freeLookReversals} policy(ies) cancelled during free look period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700">
                    Please contact your supervisor for commission adjustment details.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <LeadPipelineView userRole="agent" userId={user?.id || ''} />
          </TabsContent>

          {/* Renewals Tab - Coming Soon */}
          <TabsContent value="renewals">
            <Card>
              <CardHeader>
                <CardTitle>Policy Renewals</CardTitle>
                <CardDescription>Track renewal opportunities and follow-ups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Renewal tracking system coming soon...</p>
                  <p className="text-sm mt-2">This will show policies due for renewal and their status</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Recent updates and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveNotifications.map((notification, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{notification.notification_type}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <span className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {liveNotifications.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;