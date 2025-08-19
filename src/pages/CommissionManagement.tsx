import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Calculator, BarChart3, Shield, FileText, Settings, Home } from 'lucide-react';
import { CommissionDashboard } from '@/components/commission/CommissionDashboard';
import { CommissionRuleBuilder } from '@/components/commission/CommissionRuleBuilder';
import { BackButton } from '@/components/ui/back-button';

const CommissionManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Set initial tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('commission-rules')) {
      setActiveTab('rules');
    } else if (path.includes('commission-compliance')) {
      setActiveTab('compliance');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <BackButton to="/admin-dashboard" />
              <Calculator className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-primary">Commission Management</h1>
                <p className="text-sm text-muted-foreground">Performance tracking, rules, and compliance</p>
              </div>
            </div>
            
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="w-4 h-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/tenant-admin-dashboard">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Commission Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Rules & Slabs
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CommissionDashboard />
          </TabsContent>

          <TabsContent value="rules">
            <CommissionRuleBuilder />
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  IRDAI Compliance Monitoring
                </CardTitle>
                <CardDescription>
                  Monitor commission rates against IRDAI regulatory caps and guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Compliance monitoring dashboard will be implemented here</p>
                  <p className="text-sm">Track regulatory adherence and generate compliance reports</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Commission Audit Trail
                </CardTitle>
                <CardDescription>
                  Complete history of commission rule changes and modifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Audit log viewer will be implemented here</p>
                  <p className="text-sm">Track all changes to commission rules with full audit trail</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CommissionManagement;