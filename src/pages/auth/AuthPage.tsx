import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Building2, Users, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('Customer');
  const [employeeRole, setEmployeeRole] = useState('');
  const [agentType, setAgentType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // Get role data from navigation state
  const roleData = location.state;
  
  // Pre-fill credentials if available from role selection
  useEffect(() => {
    if (roleData?.credentials) {
      setEmail(roleData.credentials.email);
      setPassword(roleData.credentials.password);
      setIsLogin(true); // Default to login when coming from role selection
    }
  }, [roleData]);

  // Redirect if already authenticated
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user || authLoading) return;
      try {
        const { data: isAdmin } = await supabase.rpc('is_current_user_admin');
        if (isAdmin) {
          navigate('/admin/overview');
          return;
        }
        const { data: tenantUser } = await supabase
          .from('tenant_users' as any)
          .select('tenant_id, role, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        if (tenantUser) {
          navigate('/tenant/overview');
          return;
        }
        navigate('/tenant-select');
      } catch (e) {
        navigate('/tenant-select');
      }
    };
    checkAndRedirect();
  }, [user, authLoading, navigate]);

  const redirectToPortal = (userType: string) => {
    switch (userType) {
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
      default:
        navigate('/');
    }
  };

  const getIcon = (roleId: string) => {
    switch (roleId) {
      case 'admin': return Shield;
      case 'employee': return Building2;
      case 'agent': return Users;
      case 'customer': return User;
      default: return Shield;
    }
  };

  const getIconColor = (roleId: string) => {
    switch (roleId) {
      case 'admin': return 'text-red-600';
      case 'employee': return 'text-blue-600';
      case 'agent': return 'text-green-600';
      case 'customer': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'Admin': return <Shield className="h-5 w-5" />;
      case 'Employee': return <Building2 className="h-5 w-5" />;
      case 'Agent': return <Users className="h-5 w-5" />;
      case 'Customer': return <User className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Allow login with phone number by deriving email
      const input = email.trim();
      const isPhone = !input.includes('@');
      const loginEmail = isPhone ? `${input.replace(/\D/g, '')}@tenants.local` : input;
      const { error } = await signIn(loginEmail, password);
      if (error) {
        setError(error.message || 'Login failed. Please check your credentials.');
      }
      // Redirect will be handled by useEffect when user updates
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signUp(email, password, fullName, userType);
      
      if (error) {
        setError(error.message || 'Sign up failed. Please try again.');
      } else {
        setSuccess('Sign up successful! Please check your email to verify your account.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }; 

  const handleCreateTenantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setCreateError('');
    setCreateMsg(null);
    try {
      const phone = tenantPhone.trim().replace(/\D/g, '');
      if (!tenantId || !phone) {
        setCreateError('Tenant ID and mobile are required');
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-tenant-admin', {
        body: { tenant_id: tenantId, phone_number: phone }
      });
      if (error) {
        setCreateError(error.message || 'Failed to create tenant admin');
        return;
      }
      const loginHint = (data as any)?.login_hint;
      if (loginHint?.email && loginHint?.password) {
        setEmail(loginHint.email);
        setPassword(loginHint.password);
        setIsLogin(true);
      }
      setCreateMsg('Tenant admin created. Credentials have been pre-filled below.');
    } catch (err) {
      setCreateError('Failed to create tenant admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleUseTestCredentials = () => {
    if (roleData?.credentials) {
      setEmail(roleData.credentials.email);
      setPassword(roleData.credentials.password);
    }
  };

  // Determine header content based on whether user came from role selection
  const HeaderContent = () => {
    if (roleData?.roleId) {
      const IconComponent = getIcon(roleData.roleId);
      return (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-muted/50">
              <IconComponent className={`h-12 w-12 ${getIconColor(roleData.roleId)}`} />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {roleData.title}
          </CardTitle>
          <CardDescription>
            Sign in to access your portal
          </CardDescription>
        </>
      );
    } else {
      return (
        <>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">Abiraksha Insurance</h1>
          </div>
          <CardTitle className="text-xl">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to access your portal' : 'Join our insurance platform'}
          </CardDescription>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center relative">
          <HeaderContent />
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Show test credentials if available */}
          {roleData?.credentials && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Test Credentials Available</p>
              <p className="text-xs text-blue-600 mb-2">
                Email: {roleData.credentials.email}<br />
                Password: {roleData.credentials.password}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseTestCredentials}
                className="w-full"
              >
                Use Test Credentials
              </Button>
            </div>
          )}

          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(value) => setIsLogin(value === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email or Mobile</Label>
                  <Input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or mobile number"
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
                  disabled={loading || authLoading}
                >
                  {loading || authLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="signupPassword"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
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

                <div className="space-y-2">
                  <Label htmlFor="userType">Account Type</Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">
                        <div className="flex items-center">
                          {getUserTypeIcon('Admin')}
                          <span className="ml-2">Admin</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Customer">
                        <div className="flex items-center">
                          {getUserTypeIcon('Customer')}
                          <span className="ml-2">Customer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Agent">
                        <div className="flex items-center">
                          {getUserTypeIcon('Agent')}
                          <span className="ml-2">Insurance Agent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Employee">
                        <div className="flex items-center">
                          {getUserTypeIcon('Employee')}
                          <span className="ml-2">Employee</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userType === 'Employee' && (
                  <div className="space-y-2">
                    <Label htmlFor="employeeRole">Employee Role</Label>
                    <Select value={employeeRole} onValueChange={setEmployeeRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Ops">Operations</SelectItem>
                        <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {userType === 'Agent' && (
                  <div className="space-y-2">
                    <Label htmlFor="agentType">Agent Type</Label>
                    <Select value={agentType} onValueChange={setAgentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MISP">MISP (Motor Insurance Service Provider)</SelectItem>
                        <SelectItem value="POSP">POSP (Point of Sale Person)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || authLoading}
                >
                  {loading || authLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="text-sm text-muted-foreground mb-2">
              First-time Tenant Admin? Create your admin using mobile.
            </div>
            {createError && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            {createMsg && (
              <Alert className="mb-3">
                <AlertDescription>{createMsg}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreateTenantAdmin} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-1">
                <Label htmlFor="tenantId">Tenant ID</Label>
                <Input id="tenantId" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="UUID" />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label htmlFor="tenantPhone">Mobile</Label>
                <Input id="tenantPhone" value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} placeholder="10-digit mobile" />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button type="submit" className="w-full" disabled={creatingAdmin}>
                  {creatingAdmin ? 'Creating...' : 'Create Tenant Admin'}
                </Button>
              </div>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              We’ll auto-fill the login with email as mobile@tenants.local and password 1234567.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;