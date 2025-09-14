import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, UserCheck, Building2, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoleOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
}

const roles: RoleOption[] = [
  {
    id: 'superadmin',
    name: 'Super Admin',
    description: 'Platform-wide management and configuration',
    icon: Building2,
    route: '/superadmin/dashboard',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Organization management and oversight',
    icon: Shield,
    route: '/admin/dashboard',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Customer service and policy management',
    icon: UserCheck,
    route: '/employee/dashboard',
    color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
  },
  {
    id: 'agent',
    name: 'Agent',
    description: 'Sales and commission management',
    icon: Users,
    route: '/agent/dashboard',
    color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  },
  {
    id: 'customer',
    name: 'Customer',
    description: 'Policy viewing and document management',
    icon: User,
    route: '/customer/dashboard',
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
  }
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const navigate = useNavigate();

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role.id);
    // Simulate login delay
    setTimeout(() => {
      navigate(role.route);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">InsureTech Platform</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Multi-tenant Insurance Management System
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Select your role to access the platform
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full ${role.color} text-white transition-colors`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {role.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                    <Button 
                      className={`w-full ${role.color} text-white border-0`}
                      disabled={isSelected}
                    >
                      {isSelected ? 'Logging in...' : 'Login as ' + role.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Notice */}
        <Card className="mt-8 border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Demo Mode:</strong> This is a frontend skeleton with mock data. 
                All roles use dummy authentication for demonstration purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-primary mb-2">🔐</div>
            <h4 className="font-medium text-sm">Role-Based Access</h4>
            <p className="text-xs text-muted-foreground">Different permissions per role</p>
          </div>
          <div className="p-4">
            <div className="text-primary mb-2">📊</div>
            <h4 className="font-medium text-sm">Analytics Dashboard</h4>
            <p className="text-xs text-muted-foreground">Real-time insights and reports</p>
          </div>
          <div className="p-4">
            <div className="text-primary mb-2">🤖</div>
            <h4 className="font-medium text-sm">AI-Powered Extraction</h4>
            <p className="text-xs text-muted-foreground">Automated document processing</p>
          </div>
        </div>
      </div>
    </div>
  );
}