import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Building2, Users, User } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();
  const roles = [
    {
      id: 'admin',
      title: 'System Admin',
      description: 'Full system administration and management',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      route: '/admin/overview'
    },
    {
      id: 'employee',
      title: 'Employee Portal',
      description: 'Employee dashboard and task management',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      route: '/employee/dashboard'
    },
    {
      id: 'agent',
      title: 'Agent Portal',
      description: 'Insurance agent dashboard and sales tools',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      route: '/agent/dashboard'
    },
    {
      id: 'customer',
      title: 'Customer Portal',
      description: 'Customer dashboard and policy management',
      icon: User,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      route: '/customer/dashboard'
    },
    {
      id: 'tenant-admin',
      title: 'Tenant Admin',
      description: 'Manage your tenant’s branches, teams and policies',
      icon: Shield,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      route: '/tenant/overview'
    }
  ];

  const handleRoleSelect = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">Abiraksha Insurance</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Select your role to access the relevant dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card 
                key={role.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${role.borderColor} hover:${role.borderColor}`}
                onClick={() => handleRoleSelect(role.route)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full ${role.bgColor} flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className={`h-8 w-8 ${role.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleSelect(role.route);
                    }}
                  >
                    Access {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Select your role to access the appropriate dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;