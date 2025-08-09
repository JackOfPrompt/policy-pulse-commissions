import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimpleAuth } from "@/components/auth/SimpleAuthContext";
import { useNavigate } from "react-router-dom";
import { Shield, Building2, Users, User } from "lucide-react";

const Index = () => {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their portal
  if (user) {
    switch (user.role) {
      case 'Admin':
        navigate('/admin/overview');
        break;
      case 'Employee':
        navigate('/employee/dashboard');
        break;
      case 'Agent':
        navigate('/agent/dashboard');
        break;
      case 'Customer':
        navigate('/customer/dashboard');
        break;
    }
  }

  const roles = [
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'Full system administration and management',
      icon: Shield,
      route: '/admin/overview',
      bgColor: 'text-red-600',
      credentials: {
        email: 'admin@test.com',
        password: 'Password123!'
      }
    },
    {
      id: 'employee', 
      title: 'Employee Portal',
      description: 'Sales, Operations & Finance tools',
      icon: Building2,
      route: '/employee/dashboard',
      bgColor: 'text-blue-600',
      credentials: {
        email: 'employee@test.com',
        password: 'Password123!'
      }
    },
    {
      id: 'agent',
      title: 'Agent Portal', 
      description: 'MISP & POSP Agent Management',
      icon: Users,
      route: '/agent/dashboard',
      bgColor: 'text-green-600',
      credentials: {
        email: 'agent1@test.com',
        password: 'Password123!'
      }
    },
    {
      id: 'customer',
      title: 'Customer Portal',
      description: 'Policy Management & Services',
      icon: User,
      route: '/customer/dashboard', 
      bgColor: 'text-purple-600',
      credentials: {
        email: 'customer@test.com',
        password: 'Password123!'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Abiraksha Insurance
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8">
            Multi-Portal Insurance Management System
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Test Environment</h3>
            <p className="text-yellow-700">RLS is disabled. Test credentials are provided for each portal.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card 
                key={role.id} 
                className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                onClick={() => navigate('/auth', { 
                  state: { 
                    roleId: role.id,
                    credentials: role.credentials,
                    title: role.title,
                    targetRoute: role.route
                  } 
                })}
              >
                <CardHeader className="text-center">
                  <IconComponent className={`h-12 w-12 ${role.bgColor} mx-auto mb-3`} />
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Test Credentials:</p>
                      <p className="text-xs text-muted-foreground">Email: {role.credentials.email}</p>
                      <p className="text-xs text-muted-foreground">Password: {role.credentials.password}</p>
                    </div>
                    <Button className="w-full" variant="outline">
                      Access Portal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Additional Test Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-700">
              <div className="bg-white/50 p-3 rounded">
                <p className="font-medium">Branch Manager</p>
                <p className="text-xs">manager@test.com</p>
                <p className="text-xs">Password123!</p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="font-medium">Operations</p>
                <p className="text-xs">ops@test.com</p>
                <p className="text-xs">Password123!</p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="font-medium">Finance</p>
                <p className="text-xs">finance@test.com</p>
                <p className="text-xs">Password123!</p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="font-medium">POSP Agent</p>
                <p className="text-xs">agent2@test.com</p>
                <p className="text-xs">Password123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;