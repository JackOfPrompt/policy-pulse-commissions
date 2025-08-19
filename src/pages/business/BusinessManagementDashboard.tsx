import React from 'react';
import { Building2, Users, Package, AlertCircle, TrendingUp, Award, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const BusinessManagementDashboard = () => {
  const kpis = {
    activeTenants: 24,
    totalAgents: 156,
    totalBranches: 12,
    productsUnderManagement: 48,
    pendingSettlements: 8
  };

  const topProducts = [
    { name: 'Motor Comprehensive', revenue: 2500000, growth: 15.2 },
    { name: 'Health Individual', revenue: 1800000, growth: 12.8 },
    { name: 'Term Life', revenue: 1600000, growth: -2.5 },
    { name: 'Travel Insurance', revenue: 950000, growth: 28.5 },
    { name: 'Home Insurance', revenue: 750000, growth: 8.1 }
  ];

  const agentLeaderboard = [
    { name: 'John Doe', branch: 'Mumbai Central', earnings: 125000, policies: 45 },
    { name: 'Sarah Johnson', branch: 'Delhi NCR', earnings: 118000, policies: 42 },
    { name: 'Rajesh Kumar', branch: 'Bangalore', earnings: 112000, policies: 38 },
    { name: 'Priya Sharma', branch: 'Pune', earnings: 108000, policies: 41 },
    { name: 'Michael Chen', branch: 'Mumbai Central', earnings: 105000, policies: 36 }
  ];

  const orgRevenue = [
    { name: 'Mumbai Central', revenue: 4200000, percentage: 35 },
    { name: 'Delhi NCR', revenue: 3600000, percentage: 30 },
    { name: 'Bangalore', revenue: 2400000, percentage: 20 },
    { name: 'Pune', revenue: 1800000, percentage: 15 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary flex items-center">
                <Building2 className="w-6 h-6 mr-2" />
                Business Management Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Organization performance and business insights</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.activeTenants}</div>
              <p className="text-xs text-muted-foreground">Broker organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalAgents}</div>
              <p className="text-xs text-muted-foreground">Across all branches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branches</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalBranches}</div>
              <p className="text-xs text-muted-foreground">Office locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.productsUnderManagement}</div>
              <p className="text-xs text-muted-foreground">Under management</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{kpis.pendingSettlements}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Org Revenue Contribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Org Revenue Contribution
              </CardTitle>
              <CardDescription>Revenue contribution by branch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orgRevenue.map((org, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{org.name}</span>
                    <span className="text-sm text-muted-foreground">₹{org.revenue.toLocaleString()}</span>
                  </div>
                  <Progress value={org.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">{org.percentage}%</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Products by Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Top 10 Products by Revenue
              </CardTitle>
              <CardDescription>Best performing insurance products</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">₹{product.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={`${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.growth >= 0 ? '+' : ''}{product.growth}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Agent Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Agent Leaderboard
            </CardTitle>
            <CardDescription>Top performing agents by earnings and policies</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead className="text-right">Policies</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentLeaderboard.map((agent, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-bold text-lg mr-2">#{index + 1}</span>
                        {index < 3 && (
                          <Award className={`w-4 h-4 ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            'text-orange-400'
                          }`} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.branch}</TableCell>
                    <TableCell className="text-right font-bold">₹{agent.earnings.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{agent.policies}</TableCell>
                    <TableCell>
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        {index < 3 ? 'Top Performer' : 'Good'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BusinessManagementDashboard;