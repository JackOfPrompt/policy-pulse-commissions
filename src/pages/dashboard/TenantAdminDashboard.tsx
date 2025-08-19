// Tenant Admin Dashboard - Fixed Calculator import
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  Package, 
  FileText, 
  AlertTriangle, 
  Download,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  Upload,
  X,
  ArrowRight,
  UserPlus,
  MapPin,
  Database,
  ShoppingCart,
  FileSpreadsheet,
  UserCheck,
  Calculator,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TenantManagementModule } from '@/components/TenantManagementModule';

import TenantMDMManager from '@/components/TenantMDMManager';

interface DashboardKPIs {
  total_branches: number;
  total_users: number;
  total_products: number;
  total_policies: number;
  active_imports: number;
  errors_last_30_days: number;
}

interface BranchData {
  name: string;
  users: number;
  policies: number;
}

interface ErrorData {
  entity: string;
  errors: number;
}

interface ModuleInfo {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
  actions: { label: string; route: string }[];
}

const TenantAdminDashboard = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [branchData, setBranchData] = useState<BranchData[]>([]);
  const [errorData, setErrorData] = useState<ErrorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);
  const [tenantManagementOpen, setTenantManagementOpen] = useState(false);
  const [tenantMDMOpen, setTenantMDMOpen] = useState(false);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const modules: ModuleInfo[] = [
    {
      id: 'organization',
      title: 'Organization Management',
      description: 'Manage organizational structure, personnel, and operations',
      icon: Building2,
      color: 'text-blue-600',
      features: [
        'Employee profiles and management',
        'Branch locations and departments',
        'Agent onboarding and approvals',
        'Organizational hierarchy',
        'Role and permission management'
      ],
      actions: [
        { label: 'Organization Management', route: '/tenant-admin-dashboard/organization' },
        { label: 'Employee Management', route: '/tenant-admin-dashboard/organization/employees' },
        { label: 'Branch Management', route: '/tenant-admin-dashboard/organization/branches' },
        { label: 'Agent Management', route: '/tenant-admin-dashboard/management/agent-management' }
      ]
    },
    {
      id: 'masterdata',
      title: 'Master Data Management',
      description: 'Manage all master data entities and configurations',
      icon: Database,
      color: 'text-purple-600',
      features: [
        'Product categories and subcategories',
        'Insurance providers and LOBs',
        'Policy types and plan configurations',
        'Geographic data (cities, pincodes)',
        'Business rules and validations'
      ],
      actions: [
        { label: 'Tenant MDM', route: 'tenant-mdm' },
        { label: 'Insurance Providers', route: '/manage-insurance-providers' },
        { label: 'Product Categories', route: '/admin/subproducts' }
      ]
    },
    {
      id: 'policies',
      title: 'Policies & Product Sales',
      description: 'Manage insurance policies, products, and sales operations',
      icon: ShoppingCart,
      color: 'text-orange-600',
      features: [
        'Policy lifecycle management',
        'Product catalog and pricing',
        'Sales tracking and commission',
        'Quote and proposal management',
        'Customer enrollment and onboarding'
      ],
      actions: [
        { label: 'Product Management', route: '/admin/products' },
        { label: 'Policy Management', route: '/admin/policies' },
        { label: 'Sales Dashboard', route: '/admin/sales-dashboard' }
      ]
    },
    {
      id: 'imports',
      title: 'Import & Data Management',
      description: 'Handle bulk data imports and data quality management',
      icon: Upload,
      color: 'text-teal-600',
      features: [
        'Bulk data import operations',
        'Data validation and cleansing',
        'Import error tracking and resolution',
        'Data migration tools',
        'Automated data synchronization'
      ],
      actions: [
        { label: 'Bulk Import Tools', route: '/admin/bulk-import' },
        { label: 'Data Quality', route: '/admin/data-quality' },
        { label: 'Import History', route: '/admin/import-history' }
      ]
    },
    {
      id: 'analytics',
      title: 'Reports & Analytics',
      description: 'Comprehensive reporting and business intelligence',
      icon: BarChart3,
      color: 'text-indigo-600',
      features: [
        'Executive dashboards and KPIs',
        'Financial and operational reports',
        'Performance analytics',
        'Custom report builder',
        'Data visualization and insights'
      ],
      actions: [
        { label: 'Analytics Dashboard', route: '/admin/tenant-analytics' },
        { label: 'Custom Reports', route: '/admin/custom-reports' },
        { label: 'Export Center', route: '/admin/export-center' }
      ]
    },
    {
      id: 'commission',
      title: 'Commission Management',
      description: 'Manage commission rules, performance tracking, and compliance',
      icon: Calculator,
      color: 'text-green-600',
      features: [
        'Commission performance tracking by LOB',
        'Active commission rules management',
        'IRDAI compliance monitoring',
        'Campaign bonus tracking',
        'Tenant-Insurer-Product drilldown',
        'Commission rule builder and overrides'
      ],
      actions: [
        { label: 'Commission Management', route: '/admin/commission-management' },
        { label: 'Rules & Builder', route: '/admin/commission-rules' },
        { label: 'Compliance Monitor', route: '/admin/commission-compliance' },
        { label: 'Performance Analytics', route: '/admin/commission-analytics' }
      ]
    },
    {
      id: 'revenue',
      title: 'Revenue Management',
      description: 'Comprehensive revenue tracking and organizational allocation',
      icon: DollarSign,
      color: 'text-emerald-600',
      features: [
        'Organizational hierarchy revenue tracking',
        'Premium collection and allocation',
        'Commission earnings by organization',
        'Revenue sharing matrix management',
        'Settlement reconciliation with insurers',
        'Multi-dimensional revenue analytics'
      ],
      actions: [
        { label: 'Revenue Management', route: '/tenant-admin-dashboard/revenue' },
        { label: 'Organization Hierarchy', route: '/tenant-admin-dashboard/revenue/hierarchy' },
        { label: 'Premium Management', route: '/tenant-admin-dashboard/revenue/premiums' },
        { label: 'Revenue Reports', route: '/tenant-admin-dashboard/revenue/reports' }
      ]
    },
    {
      id: 'finance',
      title: 'Finance & Business Management',
      description: 'Complete financial management and business intelligence',
      icon: CreditCard,
      color: 'text-cyan-600',
      features: [
        'General Ledger and Journal Entries',
        'Settlements and Payout Management',
        'Variance Tracking and Resolution',
        'Business Performance Analytics',
        'Organizational Management Tools',
        'Comprehensive Financial Reporting'
      ],
      actions: [
        { label: 'Finance Dashboard', route: '/tenant-admin-dashboard/finance' },
        { label: 'General Ledger', route: '/tenant-admin-dashboard/finance/general-ledger' },
        { label: 'Journal Entry', route: '/tenant-admin-dashboard/finance/journal-entry' },
        { label: 'Business Management', route: '/tenant-admin-dashboard/business' }
      ]
    }
  ];

  useEffect(() => {
    if (!user || !profile) {
      navigate('/login');
      return;
    }

    if (profile.role !== 'tenant_admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this dashboard",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, profile, navigate, toast]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('tenant-dashboard-data', {
        body: { tenantId: profile?.tenant_id || 1 }
      });

      if (error) throw error;

      setKpis(data.kpis);
      setBranchData(data.branchData);
      setErrorData(data.errorData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast({
      title: "Export Started",
      description: "Preparing dashboard report for download",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/" />
              <Building2 className="w-8 h-8 text-primary mr-3" />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <span className="text-sm text-muted-foreground">
                {profile?.first_name} {profile?.last_name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branches</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.total_branches || 0}</div>
              <p className="text-xs text-muted-foreground">Active locations</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.total_products || 0}</div>
              <p className="text-xs text-muted-foreground">Insurance products</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Policies</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.total_policies || 0}</div>
              <p className="text-xs text-muted-foreground">Active policies</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Imports</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.active_imports || 0}</div>
              <p className="text-xs text-muted-foreground">Data imports running</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors (30d)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{kpis?.errors_last_30_days || 0}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Module Management Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Management Modules</h2>
          <p className="text-muted-foreground mb-8">Access comprehensive tools for organizational management</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {modules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Dialog key={module.id}>
                  <DialogTrigger asChild>
                    <div className="group cursor-pointer">
                      <div className="flex flex-col items-center p-6 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fade-in">
                        <div className={`p-4 rounded-full bg-accent/20 group-hover:bg-accent/40 transition-colors duration-300 mb-4`}>
                          <IconComponent className={`w-8 h-8 ${module.color}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-center text-foreground group-hover:text-primary transition-colors duration-300">
                          {module.title}
                        </h3>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-3 rounded-lg bg-accent/20`}>
                          <IconComponent className={`w-6 h-6 ${module.color}`} />
                        </div>
                        <DialogTitle className="text-xl">{module.title}</DialogTitle>
                      </div>
                      <DialogDescription className="text-base">
                        {module.description}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-6">
                      <h4 className="font-semibold text-foreground mb-3">Key Features</h4>
                      <ul className="space-y-2 mb-6">
                        {module.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <h4 className="font-semibold text-foreground mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {module.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="justify-between group"
                            onClick={() => {
                              if (action.route === 'tenant-management') {
                                setTenantManagementOpen(true);
                              } else if (action.route === 'tenant-mdm') {
                                setTenantMDMOpen(true);
                              } else {
                                navigate(action.route);
                              }
                            }}
                          >
                            <span>{action.label}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Branch Performance
              </CardTitle>
              <CardDescription>User and policy distribution across locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branchData.map((branch, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-accent/20 transition-colors duration-200">
                    <span className="font-medium text-foreground">{branch.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">{branch.users} users</div>
                      <div className="text-xs text-muted-foreground">{branch.policies} policies</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Import Errors
              </CardTitle>
              <CardDescription>Recent data import issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorData.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors duration-200">
                    <span className="font-medium text-foreground">{error.entity}</span>
                    <span className="text-destructive font-medium text-sm px-2 py-1 rounded-md bg-destructive/20">
                      {error.errors} errors
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Tenant Management Module */}
      <Dialog open={tenantManagementOpen} onOpenChange={setTenantManagementOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Management</DialogTitle>
            <DialogDescription>
              Manage tenant organization, subscription, and activity logs
            </DialogDescription>
          </DialogHeader>
          <TenantManagementModule />
        </DialogContent>
      </Dialog>


      {/* Tenant MDM Module */}
      <Dialog open={tenantMDMOpen} onOpenChange={setTenantMDMOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Master Data Management</DialogTitle>
            <DialogDescription>
              Manage system and tenant-specific master data entities
            </DialogDescription>
          </DialogHeader>
          <TenantMDMManager />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantAdminDashboard;