import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, UserCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';

interface ManagementFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
}

const TenantOrganizationManagement = () => {
  const navigate = useNavigate();

  const managementFeatures: ManagementFeature[] = [
    {
      id: 'employees',
      title: 'Employee Management',
      description: 'Manage employee profiles, roles, and permissions',
      icon: Users,
      route: '/tenant-admin-dashboard/organization/employees',
      color: 'text-green-600'
    },
    {
      id: 'agents',
      title: 'Agent Management',
      description: 'Manage POSP and MISP agents, approvals, and onboarding',
      icon: UserCheck,
      route: '/tenant-admin-dashboard/management/agent-management',
      color: 'text-cyan-600'
    },
    {
      id: 'branches',
      title: 'Branch Management',
      description: 'Manage branch locations, departments, and managers',
      icon: Building2,
      route: '/tenant-admin-dashboard/organization/branches',
      color: 'text-blue-600'
    }
  ];

  const handleFeatureClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton to="/tenant-admin-dashboard" />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary">Organization Management</h1>
              <p className="text-sm text-muted-foreground">Manage your organization's structure and personnel</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Management Features</h2>
          <p className="text-muted-foreground">Select a management module to get started</p>
        </div>

        {/* Management Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border border-border/50 bg-card hover:bg-accent/30"
                onClick={() => handleFeatureClick(feature.route)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`p-6 rounded-full bg-accent/20 group-hover:bg-accent/40 transition-colors duration-300 mb-4 mx-auto w-fit`}>
                    <IconComponent className={`w-12 h-12 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base mb-6">
                    {feature.description}
                  </CardDescription>
                  <Button variant="outline" className="w-full group">
                    <span>Open Module</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 bg-card/50 rounded-lg p-6 border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Organization Management Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-primary flex items-center">
                <Users className="w-4 h-4 mr-2 text-green-600" />
                Employee Management
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Employee profiles and records</li>
                <li>• Role and permission assignment</li>
                <li>• Salary management and history</li>
                <li>• Department assignments</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-primary flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-cyan-600" />
                Agent Management
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• POSP and MISP agent onboarding</li>
                <li>• Agent approval workflows</li>
                <li>• Exam management and tracking</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-primary flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                Branch Management
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Branch location management</li>
                <li>• Department assignments</li>
                <li>• Manager assignments</li>
                <li>• Operational oversight</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantOrganizationManagement;