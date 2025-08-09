import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useSimpleAuth } from "@/components/auth/SimpleAuthContext";

const SimpleLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, user, loading } = useSimpleAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectToPortal(user.role);
    }
  }, [isAuthenticated, user]);

  const redirectToPortal = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Manager':
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
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(phone, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    // Redirect will be handled by useEffect
  };

  const testCredentials = [
    { email: 'admin@test.com', role: 'Admin' },
    { email: 'employee@test.com', role: 'Employee' },
    { email: 'agent@test.com', role: 'Agent' },
    { email: 'customer@test.com', role: 'Customer' },
    { email: 'manager@test.com', role: 'Manager' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">Abiraksha Insurance</h1>
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your portal
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Email / Phone</Label>
              <Input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your email or phone"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6 space-y-3">
            <div className="text-center text-sm font-medium text-muted-foreground">
              Test Credentials (Password: Password123!)
            </div>
            <div className="grid grid-cols-1 gap-2">
              {testCredentials.map((cred) => (
                <Button
                  key={cred.email}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhone(cred.email);
                    setPassword('Password123!');
                  }}
                  className="text-xs"
                >
                  {cred.role}: {cred.email}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleLogin;