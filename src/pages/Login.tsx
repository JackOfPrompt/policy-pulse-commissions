import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, signIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      redirectBasedOnRole(profile.role);
    }
  }, [user, profile]);

  const redirectBasedOnRole = (userRole: string) => {
    console.log('🔄 Redirecting based on role:', userRole);
    switch (userRole) {
      case 'system_admin':
        navigate('/admin-dashboard');
        break;
      case 'tenant_admin':
        navigate('/tenant-admin-dashboard');
        break;
      case 'tenant_employee':
        navigate('/employee-dashboard');
        break;
      case 'tenant_agent':
        navigate('/agent-dashboard');
        break;
      case 'customer':
        navigate('/customer-dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to your dashboard...",
        });
        // Navigation will happen via useEffect when user/profile updates
      }
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  const testCredentials = [
    { email: 'admin@system.com', password: 'admin123', role: 'System Admin' },
    { email: 'tenant@admin.com', password: 'tenant123', role: 'Tenant Admin' },
    { email: 'employee@company.com', password: 'employee123', role: 'Employee' },
    { email: 'agent@insurance.com', password: 'agent123', role: 'Agent' },
    { email: 'customer@email.com', password: 'customer123', role: 'Customer' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">LMV Insurance</h1>
            <p className="text-sm text-muted-foreground mt-1">Secure • Trusted • Reliable</p>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="shadow-[var(--shadow-card)] border border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Test Credentials */}
              <div className="space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  Quick Test Login
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {testCredentials.map((cred, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickLogin(cred.email, cred.password)}
                      className="text-xs"
                    >
                      {cred.role}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="text-center text-sm space-y-2">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot your password?
                </Link>
                <div className="text-muted-foreground">
                  <Link to="/" className="text-primary hover:underline">
                    Back to Home
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;