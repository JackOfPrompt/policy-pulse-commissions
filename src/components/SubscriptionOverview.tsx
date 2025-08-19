import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Package, Calendar, AlertCircle, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStats {
  totalRevenue: number;
  activeSubscriptions: number;
  totalPlans: number;
  pendingInvoices: number;
  recentSubscriptions: any[];
}

const SubscriptionOverview = () => {
  const [stats, setStats] = useState<SubscriptionStats>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalPlans: 0,
    pendingInvoices: 0,
    recentSubscriptions: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionStats();
  }, []);

  const fetchSubscriptionStats = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription plans count
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*', { count: 'exact', head: true });

      if (plansError) throw plansError;

      // For now, set mock data as the new tables might not have data yet
      setStats({
        totalRevenue: 125000,
        activeSubscriptions: 8,
        totalPlans: plansData ? 3 : 0,
        pendingInvoices: 2,
        recentSubscriptions: []
      });

    } catch (error: any) {
      console.error('Error fetching subscription stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +2 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Plans</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">
              Across all tiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
            <CardDescription>Latest subscription activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { tenant: 'ABC Insurance Co.', plan: 'Premium', status: 'Active', date: '2024-01-15' },
                { tenant: 'XYZ Financial', plan: 'Standard', status: 'Trial', date: '2024-01-14' },
                { tenant: 'DefTech Solutions', plan: 'Enterprise', status: 'Active', date: '2024-01-12' }
              ].map((sub, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{sub.tenant}</p>
                    <p className="text-sm text-muted-foreground">{sub.plan} Plan</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={sub.status === 'Active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{sub.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'January 2024', revenue: 125000, growth: '+15%' },
                { month: 'December 2023', revenue: 108750, growth: '+8%' },
                { month: 'November 2023', revenue: 100625, growth: '+12%' }
              ].map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-sm text-muted-foreground">₹{month.revenue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-green-600">
                      {month.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common subscription management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Create New Plan</h3>
                <p className="text-sm text-muted-foreground">Add a new subscription plan</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Generate Invoice</h3>
                <p className="text-sm text-muted-foreground">Create manual invoice</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">View Reports</h3>
                <p className="text-sm text-muted-foreground">Detailed analytics</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionOverview;