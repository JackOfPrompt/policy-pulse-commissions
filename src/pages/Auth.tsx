import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, profile, signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'agent' | 'employee' | 'admin'>('customer');
  const [orgId, setOrgId] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  // Load organizations for signup
  useEffect(() => {
    const loadOrganizations = async () => {
      setLoadingOrgs(true);
      setOrgError(null);
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, code')
          .order('name');
        
        if (error) {
          setOrgError('Failed to load organizations');
          console.error('Error loading organizations:', error);
          return;
        }
        
        setOrganizations(data || []);
      } catch (error) {
        setOrgError('Failed to load organizations');
        console.error('Error loading organizations:', error);
      } finally {
        setLoadingOrgs(false);
      }
    };
    loadOrganizations();
  }, []);

  // Redirect if already authenticated
  if (user && profile) {
    const roleRoutes: Record<string, string> = {
      super_admin: '/superadmin/dashboard',
      admin: '/admin',
      agent: '/agent',
      employee: '/employee/dashboard',
      customer: '/customer'
    };
    return <Navigate to={roleRoutes[profile.role] || '/'} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let { error } = await signIn(email, password);

    // Auto-seed super admin on invalid credentials
    if (error && email.toLowerCase() === 'superadmin@insurtech.com') {
      try {
        await supabase.functions.invoke('seed-superadmin');
        // Retry sign in
        const retry = await signIn(email, password || 'SuperAdmin@123!');
        error = retry.error;
      } catch (seedErr: any) {
        console.error('Seeding super admin failed:', seedErr);
      }
    }
    
    if (error) {
      setError(error.message || 'Sign in failed');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await signUp(email, password, {
      full_name: fullName,
      role: role,
      org_id: orgId || null
    });
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created successfully! Please check your email for verification.');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">InsureTech</h1>
          </div>
          <p className="text-muted-foreground">
            Secure Insurance Management Platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select value={role} onValueChange={(value: any) => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(role === 'agent' || role === 'employee' || role === 'admin') && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-org">Organization</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Select value={orgId} onValueChange={setOrgId} disabled={loadingOrgs}>
                          <SelectTrigger className="pl-10">
                            <SelectValue 
                              placeholder={
                                loadingOrgs 
                                  ? "Loading organizations..." 
                                  : organizations.length === 0 
                                    ? "No organizations available" 
                                    : "Select organization"
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name} ({org.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {orgError && (
                        <p className="text-sm text-destructive mt-1">{orgError}</p>
                      )}
                      {organizations.length === 0 && !loadingOrgs && !orgError && (
                        <p className="text-sm text-muted-foreground mt-1">
                          No organizations found. Contact your administrator.
                        </p>
                      )}
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demo Notice */}
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Multi-Tenant Platform:</strong> Each organization has isolated data access.
                Role-based permissions ensure secure data management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}