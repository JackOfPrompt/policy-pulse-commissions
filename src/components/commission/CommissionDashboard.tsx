import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Calculator,
  DollarSign,
  Shield,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  lobPerformance: Array<{
    name: string;
    avgRate: number;
    count: number;
  }>;
  rulesCount: Record<string, number>;
  complianceAlerts: Array<{
    rule_id: string;
    provider_name: string;
    product_name: string;
    current_rate: number;
    max_allowed: number;
    severity: 'high' | 'medium';
  }>;
  upcomingCampaigns: Array<{
    campaign_name: string;
    bonus_rate: number;
    valid_from: string;
    valid_to: string;
  }>;
}

export const CommissionDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('commission-management', {
        body: {
          action: 'GET_DASHBOARD_DATA',
          tenantId: profile?.tenant_id
        }
      });

      if (error) throw error;

      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load commission dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calculator className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading commission dashboard...</p>
        </div>
      </div>
    );
  }

  const rulesChartData = dashboardData?.rulesCount ? 
    Object.entries(dashboardData.rulesCount).map(([type, count]) => ({
      name: type,
      value: count
    })) : [];

  const totalRules = rulesChartData.reduce((sum, item) => sum + item.value, 0);
  const highAlerts = dashboardData?.complianceAlerts?.filter(alert => alert.severity === 'high').length || 0;
  const mediumAlerts = dashboardData?.complianceAlerts?.filter(alert => alert.severity === 'medium').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Commission Dashboard</h2>
          <p className="text-muted-foreground">Performance overview, compliance monitoring, and active rules</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRules}</div>
            <p className="text-xs text-muted-foreground">Active commission rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highAlerts + mediumAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {highAlerts} high, {mediumAlerts} medium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.upcomingCampaigns?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Running bonus campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.lobPerformance?.length ? 
                (dashboardData.lobPerformance.reduce((sum, lob) => sum + lob.avgRate, 0) / dashboardData.lobPerformance.length).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all LOBs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Performance by LOB */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Commission Performance by LOB
            </CardTitle>
            <CardDescription>Average commission rates across lines of business</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.lobPerformance?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.lobPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Avg Rate']} />
                  <Bar dataKey="avgRate" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-muted-foreground">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Rules by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Active Rules by Type
            </CardTitle>
            <CardDescription>Distribution of commission rule types</CardDescription>
          </CardHeader>
          <CardContent>
            {rulesChartData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rulesChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {rulesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-muted-foreground">
                No rules data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Alerts */}
      {dashboardData?.complianceAlerts?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              Compliance Alerts
            </CardTitle>
            <CardDescription>Commission rules exceeding IRDAI caps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.complianceAlerts.map((alert, index) => (
                <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <strong>{alert.provider_name}</strong> - {alert.product_name}
                      <br />
                      Current: {alert.current_rate}% | Max Allowed: {alert.max_allowed}%
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity === 'high' ? 'High Risk' : 'Medium Risk'}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Upcoming Campaigns */}
      {dashboardData?.upcomingCampaigns?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Upcoming Campaign Bonuses
            </CardTitle>
            <CardDescription>Active and scheduled bonus campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.upcomingCampaigns.map((campaign, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{campaign.campaign_name}</h4>
                    <Badge variant="secondary">+{campaign.bonus_rate}%</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(campaign.valid_from).toLocaleDateString()} - {new Date(campaign.valid_to).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};