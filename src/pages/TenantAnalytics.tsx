import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Users, Building2, DollarSign, FileText, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { ExecutiveOverview } from '@/components/analytics/ExecutiveOverview';
import { SalesAnalytics } from '@/components/analytics/SalesAnalytics';
import { RenewalsRetention } from '@/components/analytics/RenewalsRetention';
import { ClaimsAnalytics } from '@/components/analytics/ClaimsAnalytics';
import { CollectionsDunning } from '@/components/analytics/CollectionsDunning';
import { ProductPerformance } from '@/components/analytics/ProductPerformance';
import { TeamAgentPerformance } from '@/components/analytics/TeamAgentPerformance';
import { BranchGeography } from '@/components/analytics/BranchGeography';
import { OperationsSLA } from '@/components/analytics/OperationsSLA';
import { FinancePnL } from '@/components/analytics/FinancePnL';
import { AnalyticsFilters as AnalyticsFiltersType } from '@/hooks/useAnalytics';

const TenantAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFiltersType>({
    dateRange: 'MTD',
    granularity: 'day',
    currency: 'INR',
    gstToggle: false,
    product: [],
  });
  
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/login');
      return;
    }

    // Check if user has access to analytics
    const allowedRoles = ['system_admin', 'tenant_admin', 'tenant_employee'];
    if (!allowedRoles.includes(profile.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access analytics",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [user, profile, navigate, toast]);

  const handleFiltersChange = (newFilters: Partial<AnalyticsFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (reportType: string, format: string) => {
    try {
      toast({
        title: "Export Started",
        description: `Generating ${reportType} report in ${format} format`,
      });
      // TODO: Implement export functionality via edge function
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/admin/system-dashboard" />
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-primary mr-3" />
                <h1 className="text-xl font-bold text-primary">Tenant Analytics</h1>
                <span className="ml-4 text-sm text-muted-foreground">
                  Live insights and performance metrics
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => handleExport('dashboard', 'pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <span className="text-sm text-muted-foreground">
                {profile?.first_name} {profile?.last_name} ({profile?.role})
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <AnalyticsFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="overview">Executive</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="renewals">Renewals</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ExecutiveOverview filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <SalesAnalytics filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="renewals" className="mt-6">
            <RenewalsRetention filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="claims" className="mt-6">
            <ClaimsAnalytics filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            <CollectionsDunning filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductPerformance filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <TeamAgentPerformance filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="geography" className="mt-6">
            <BranchGeography filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="operations" className="mt-6">
            <OperationsSLA filters={filters} userRole={profile.role} />
          </TabsContent>

          <TabsContent value="finance" className="mt-6">
            <FinancePnL filters={filters} userRole={profile.role} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TenantAnalytics;