import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Users, 
  PieChart, 
  BarChart3,
  Calculator,
  FileSpreadsheet,
  ArrowRight,
  Target,
  Banknote,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { useFinanceAPI } from '@/hooks/useFinanceAPI';

interface FinanceFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
  status: 'active' | 'coming-soon';
}

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { getDashboardKPIs } = useFinanceAPI();
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    cashBalance: 0,
    openVariances: 0,
    settlementsCompleted: 0,
    totalJournals: 0,
    pendingSettlements: 0,
    totalAccounts: 0
  });
  const [loading, setLoading] = useState(true);

  const financeFeatures: FinanceFeature[] = [
    {
      id: 'general-ledger',
      title: 'General Ledger',
      description: 'View and manage journal entries and accounts',
      icon: FileSpreadsheet,
      route: '/tenant-admin-dashboard/finance/general-ledger',
      color: 'text-blue-600',
      status: 'active'
    },
    {
      id: 'journal-entry',
      title: 'Journal Entry',
      description: 'Create and manage accounting journal entries',
      icon: Receipt,
      route: '/tenant-admin-dashboard/finance/journal-entry',
      color: 'text-green-600',
      status: 'active'
    },
    {
      id: 'accounts',
      title: 'Accounts Workbench',
      description: 'Manage chart of accounts and ledger views',
      icon: Calculator,
      route: '/tenant-admin-dashboard/finance/accounts',
      color: 'text-purple-600',
      status: 'active'
    },
    {
      id: 'settlements',
      title: 'Settlements Workbench',
      description: 'Track and reconcile insurer settlements',
      icon: Banknote,
      route: '/tenant-admin-dashboard/finance/settlements',
      color: 'text-orange-600',
      status: 'active'
    },
    {
      id: 'payouts',
      title: 'Payout Management',
      description: 'Manage commission and reward payouts',
      icon: Users,
      route: '/tenant-admin-dashboard/finance/payouts',
      color: 'text-indigo-600',
      status: 'active'
    },
    {
      id: 'variances',
      title: 'Variance Workbench',
      description: 'Track and resolve financial variances',
      icon: AlertCircle,
      route: '/tenant-admin-dashboard/finance/variances',
      color: 'text-red-600',
      status: 'active'
    }
  ];

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const data = await getDashboardKPIs();
        setKpis(data);
      } catch (error) {
        console.error('Failed to fetch KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [getDashboardKPIs]);

  const handleFeatureClick = (feature: FinanceFeature) => {
    if (feature.status === 'coming-soon') {
      return;
    }
    navigate(feature.route);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10 flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary flex items-center">
                <DollarSign className="w-6 h-6 mr-2" />
                Finance Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Comprehensive financial management and reporting</p>
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{kpis.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">MTD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{kpis.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">MTD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{kpis.cashBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Variances</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{kpis.openVariances}</div>
              <p className="text-xs text-muted-foreground">Require review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settlements</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{kpis.settlementsCompleted}</div>
              <p className="text-xs text-muted-foreground">Completed this month</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Finance Management Modules</h2>
          <p className="text-muted-foreground">
            Access comprehensive financial tools for accounting, settlements, and reporting
          </p>
        </div>

        {/* Finance Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {financeFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.id} 
                className={`group transition-all duration-300 border border-border/50 bg-card ${
                  feature.status === 'active' 
                    ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-accent/30' 
                    : 'opacity-75'
                }`}
                onClick={() => handleFeatureClick(feature)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-4 rounded-full bg-accent/20 group-hover:bg-accent/40 transition-colors duration-300`}>
                      <IconComponent className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                      {feature.status === 'active' ? 'Active' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-sm mb-6">
                    {feature.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    className="w-full group" 
                    disabled={feature.status === 'coming-soon'}
                  >
                    <span>{feature.status === 'active' ? 'Open Module' : 'Coming Soon'}</span>
                    {feature.status === 'active' && (
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Finance Framework Overview */}
        <div className="bg-card/50 rounded-lg p-6 border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" />
            Finance Management Framework
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Accounting Flow */}
            <div className="space-y-4">
              <h4 className="font-medium text-primary">Accounting Process</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Receipt className="w-4 h-4 mr-2 text-green-600" />
                  <span>Journal Entry Creation</span>
                </div>
                <div className="flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" />
                  <span>General Ledger Posting</span>
                </div>
                <div className="flex items-center">
                  <Calculator className="w-4 h-4 mr-2 text-purple-600" />
                  <span>Account Reconciliation</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-cyan-600" />
                  <span>Financial Reporting</span>
                </div>
              </div>
            </div>

            {/* Settlement Flow */}
            <div className="space-y-4">
              <h4 className="font-medium text-primary">Settlement Process</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Banknote className="w-4 h-4 mr-2 text-orange-600" />
                  <span>Settlement Receipt & Matching</span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                  <span>Variance Identification</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-indigo-600" />
                  <span>Payout Processing</span>
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-green-600" />
                  <span>Audit Trail Generation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinanceDashboard;