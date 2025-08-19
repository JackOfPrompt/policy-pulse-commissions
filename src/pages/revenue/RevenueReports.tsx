import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Target,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RevenueMetrics {
  total_revenue: number;
  premium_revenue: number;
  commission_revenue: number;
  revenue_growth: number;
  period_comparison: number;
  top_performers: {
    org_name: string;
    revenue: number;
    growth: number;
  }[];
}

interface OrgPerformance {
  org_id: number;
  org_name: string;
  org_type: string;
  total_revenue: number;
  premium_collected: number;
  commission_earned: number;
  policies_count: number;
  revenue_growth: number;
  target_achievement: number;
}

const RevenueReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [orgPerformance, setOrgPerformance] = useState<OrgPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [filters, setFilters] = useState({
    period: 'monthly',
    from_date: '',
    to_date: '',
    org_type: '',
    org_id: '',
    insurer_id: '',
    product_id: ''
  });

  useEffect(() => {
    fetchRevenueMetrics();
    fetchOrgPerformance();
  }, [filters]);

  const fetchRevenueMetrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('revenue-reports', {
        body: { action: 'revenue_metrics', filters }
      });

      if (error) throw error;
      setRevenueMetrics(data);
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load revenue metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgPerformance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('revenue-reports', {
        body: { action: 'org_performance', filters }
      });

      if (error) throw error;
      setOrgPerformance(data || []);
    } catch (error) {
      console.error('Error fetching org performance:', error);
    }
  };

  const handleExportReport = async (reportType: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('revenue-reports', {
        body: { 
          action: 'export',
          report_type: reportType,
          filters 
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report exported successfully"
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTargetColor = (achievement: number) => {
    if (achievement >= 100) return 'text-green-600';
    if (achievement >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BackButton />
              <div className="ml-4">
                <h1 className="text-xl font-bold text-primary flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2" />
                  Revenue Reports
                </h1>
                <p className="text-sm text-muted-foreground">Comprehensive revenue analytics and reporting</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 border-r pr-4 mr-2">
                <Select 
                  value={filters.period} 
                  onValueChange={(value) => setFilters({...filters, period: value})}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExportReport('overview')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Revenue Overview Cards */}
        {revenueMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{revenueMetrics.total_revenue.toLocaleString()}</div>
                <div className={`flex items-center mt-2 ${getGrowthColor(revenueMetrics.revenue_growth)}`}>
                  {getGrowthIcon(revenueMetrics.revenue_growth)}
                  <span className="ml-1 text-sm font-medium">
                    {revenueMetrics.revenue_growth > 0 ? '+' : ''}{revenueMetrics.revenue_growth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Premium Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{revenueMetrics.premium_revenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-2">Gross premium collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" />
                  Commission Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{revenueMetrics.commission_revenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-2">Total commission earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getGrowthColor(revenueMetrics.period_comparison)}`}>
                  {revenueMetrics.period_comparison > 0 ? '+' : ''}{revenueMetrics.period_comparison.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">vs previous period</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
            <TabsTrigger value="performance">Org Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Revenue Distribution
                  </CardTitle>
                  <CardDescription>Revenue breakdown by organization type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Revenue distribution chart will be implemented here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="w-5 h-5 mr-2" />
                    Revenue Trends
                  </CardTitle>
                  <CardDescription>Monthly revenue trend analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <LineChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Revenue trend chart will be implemented here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Performance</CardTitle>
                    <CardDescription>Detailed performance metrics by organizational unit</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport('performance')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Performance Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orgPerformance.map((org) => (
                    <Card key={org.org_id} className="border border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              org.org_type === 'tenant' ? 'bg-blue-600' :
                              org.org_type === 'branch' ? 'bg-green-600' :
                              org.org_type === 'team' ? 'bg-purple-600' : 'bg-orange-600'
                            }`} />
                            <div>
                              <h3 className="font-semibold text-lg">{org.org_name}</h3>
                              <Badge variant="outline">{org.org_type}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">₹{org.total_revenue.toLocaleString()}</div>
                            <div className={`flex items-center ${getGrowthColor(org.revenue_growth)}`}>
                              {getGrowthIcon(org.revenue_growth)}
                              <span className="ml-1 text-sm">
                                {org.revenue_growth > 0 ? '+' : ''}{org.revenue_growth.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground">Premium Collected</Label>
                            <div className="font-semibold">₹{org.premium_collected.toLocaleString()}</div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Commission Earned</Label>
                            <div className="font-semibold">₹{org.commission_earned.toLocaleString()}</div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Policies Count</Label>
                            <div className="font-semibold">{org.policies_count.toLocaleString()}</div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Target Achievement</Label>
                            <div className={`font-semibold ${getTargetColor(org.target_achievement)}`}>
                              {org.target_achievement.toFixed(1)}%
                            </div>
                            <Progress value={Math.min(org.target_achievement, 100)} className="mt-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Revenue growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Monthly trend analysis will be implemented here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forecast Analysis</CardTitle>
                  <CardDescription>Revenue projections and forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Revenue forecasting will be implemented here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Performance Leaderboard
                </CardTitle>
                <CardDescription>Top performing organizational units</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueMetrics?.top_performers && (
                  <div className="space-y-4">
                    {revenueMetrics.top_performers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{performer.org_name}</div>
                            <div className="text-sm text-muted-foreground">₹{performer.revenue.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className={`flex items-center ${getGrowthColor(performer.growth)}`}>
                          {getGrowthIcon(performer.growth)}
                          <span className="ml-1 font-medium">
                            {performer.growth > 0 ? '+' : ''}{performer.growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RevenueReports;