import React, { useState } from 'react';
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
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';

interface RevenueFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
  status: 'active' | 'coming-soon';
}

const RevenueManagement = () => {
  const navigate = useNavigate();

  const revenueFeatures: RevenueFeature[] = [
    {
      id: 'hierarchy',
      title: 'Organization Hierarchy',
      description: 'Manage revenue-traceable organizational structure',
      icon: Building2,
      route: '/tenant-admin-dashboard/revenue/hierarchy',
      color: 'text-blue-600',
      status: 'active'
    },
    {
      id: 'premiums',
      title: 'Premium Management',
      description: 'Track and manage premium collections and allocations',
      icon: Receipt,
      route: '/tenant-admin-dashboard/revenue/premiums',
      color: 'text-green-600',
      status: 'active'
    },
    {
      id: 'commission-earnings',
      title: 'Commission Earnings',
      description: 'Calculate and track commission earnings by organization',
      icon: Calculator,
      route: '/tenant-admin-dashboard/revenue/commission-earnings',
      color: 'text-purple-600',
      status: 'active'
    },
    {
      id: 'revenue-allocation',
      title: 'Revenue Allocation',
      description: 'Manage revenue sharing across organizational levels',
      icon: PieChart,
      route: '/tenant-admin-dashboard/revenue/allocation',
      color: 'text-orange-600',
      status: 'active'
    },
    {
      id: 'settlements',
      title: 'Settlement Management',
      description: 'Track settlements and reconciliation with insurers',
      icon: Banknote,
      route: '/tenant-admin-dashboard/revenue/settlements',
      color: 'text-indigo-600',
      status: 'active'
    },
    {
      id: 'reports',
      title: 'Revenue Reports',
      description: 'Comprehensive revenue analytics and reporting',
      icon: BarChart3,
      route: '/tenant-admin-dashboard/revenue/reports',
      color: 'text-cyan-600',
      status: 'active'
    }
  ];

  const handleFeatureClick = (feature: RevenueFeature) => {
    if (feature.status === 'coming-soon') {
      return;
    }
    navigate(feature.route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton to="/admin-dashboard" />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary flex items-center">
                <DollarSign className="w-6 h-6 mr-2" />
                Revenue Management
              </h1>
              <p className="text-sm text-muted-foreground">Comprehensive revenue tracking and management system</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Revenue Management System</h2>
          <p className="text-muted-foreground">
            Manage organizational revenue tracking, commission calculations, and settlement reconciliation
          </p>
        </div>

        {/* Revenue Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {revenueFeatures.map((feature) => {
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

        {/* Revenue Management Overview */}
        <div className="bg-card/50 rounded-lg p-6 border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" />
            Revenue Management Framework
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Hierarchy Structure */}
            <div className="space-y-4">
              <h4 className="font-medium text-primary">Organizational Hierarchy</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mr-3"></div>
                  <span>Tenant (Broker) Organization</span>
                </div>
                <div className="flex items-center ml-6">
                  <div className="w-3 h-3 rounded-full bg-green-600 mr-3"></div>
                  <span>Branches / Offices</span>
                </div>
                <div className="flex items-center ml-12">
                  <div className="w-3 h-3 rounded-full bg-purple-600 mr-3"></div>
                  <span>Teams (Sales / Ops / Renewals)</span>
                </div>
                <div className="flex items-center ml-16">
                  <div className="w-3 h-3 rounded-full bg-orange-600 mr-3"></div>
                  <span>Agents / POSPs / Channel Partners</span>
                </div>
              </div>
            </div>

            {/* Revenue Flow */}
            <div className="space-y-4">
              <h4 className="font-medium text-primary">Revenue Flow Process</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Receipt className="w-4 h-4 mr-2 text-green-600" />
                  <span>Premium Collection & Logging</span>
                </div>
                <div className="flex items-center">
                  <Calculator className="w-4 h-4 mr-2 text-purple-600" />
                  <span>Commission Calculation</span>
                </div>
                <div className="flex items-center">
                  <PieChart className="w-4 h-4 mr-2 text-orange-600" />
                  <span>Revenue Allocation (70%-20%-10%)</span>
                </div>
                <div className="flex items-center">
                  <Banknote className="w-4 h-4 mr-2 text-indigo-600" />
                  <span>Settlement & Reconciliation</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-cyan-600" />
                  <span>Performance Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <h4 className="font-medium text-primary mb-4">Key Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">Revenue Tracking</span>
                </div>
                <ul className="text-xs text-muted-foreground ml-6 space-y-1">
                  <li>• GWP and Net Revenue by Organization</li>
                  <li>• Commission tracking by LOB</li>
                  <li>• Multi-level allocation matrix</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm font-medium">Settlement Management</span>
                </div>
                <ul className="text-xs text-muted-foreground ml-6 space-y-1">
                  <li>• Insurer settlement reconciliation</li>
                  <li>• Variance tracking and resolution</li>
                  <li>• Automated settlement matching</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-cyan-600" />
                  <span className="text-sm font-medium">Analytics & Reports</span>
                </div>
                <ul className="text-xs text-muted-foreground ml-6 space-y-1">
                  <li>• Performance leaderboards</li>
                  <li>• Multi-dimensional reporting</li>
                  <li>• Revenue forecasting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RevenueManagement;