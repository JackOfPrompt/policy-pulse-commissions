import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    user,
    profile,
    signIn
  } = useAuth();

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
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to your dashboard..."
        });
        // Navigation will happen via useEffect when user/profile updates
      }
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const quickLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };
  const testCredentials = [{
    email: 'admin@system.com',
    password: 'admin123',
    role: 'System Admin'
  }, {
    email: 'tenant@admin.com',
    password: 'tenant123',
    role: 'Tenant Admin'
  }, {
    email: 'employee@company.com',
    password: 'employee123',
    role: 'Employee'
  }, {
    email: 'agent@insurance.com',
    password: 'agent123',
    role: 'Agent'
  }, {
    email: 'customer@email.com',
    password: 'customer123',
    role: 'Customer'
  }];
  return <div className="min-h-screen flex">
      {/* Left Side - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary to-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-40 right-32 w-48 h-48 border border-white/20 rounded-full"></div>
          <div className="absolute top-1/3 right-20 w-24 h-24 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-36 h-36 border border-white/20 rounded-full"></div>
          
          {/* Insurance themed elements */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full"></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/20 rounded-full"></div>
        </div>
        
        {/* Content */}
        <div className="flex flex-col justify-center items-center text-center text-white p-12 relative z-10 w-full h-full">
          <div className="mb-8">
            <img src="/lovable-uploads/154873ec-48fd-43c5-a8eb-d5a8a3d9fad8.png" alt="CRESTLINE Logo" className="h-20 w-auto ml-auto block mb-6" />
            
            
            
          </div>
          
          {/* Additional tagline */}
          <div className="mt-12 max-w-md">
            
          </div>
        </div>
      </div>

      {/* Right Side - Login Panel */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 lg:p-12" style={{
      backgroundColor: '#FAF9F6'
    }}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block">
              <img src="/lovable-uploads/154873ec-48fd-43c5-a8eb-d5a8a3d9fad8.png" alt="CRESTLINE Logo" className="h-12 w-auto mx-auto mb-3" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                CRESTLINE
              </h1>
              <p className="text-sm text-foreground/60 mt-1">Insurance CRM Platform</p>
            </Link>
          </div>

          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              
              
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email Address
                  </Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 bg-white/70" />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 pr-12 bg-white/70" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-foreground/60" /> : <Eye className="h-4 w-4 text-foreground/60" />}
                    </Button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} className="border-2 border-border/50 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-secondary data-[state=checked]:to-primary data-[state=checked]:border-primary" />
                    <Label htmlFor="remember" className="text-sm text-foreground/80 cursor-pointer font-medium">
                      Remember me
                    </Label>
                  </div>
                  
                  <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold">
                    Forgot password?
                  </Link>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-6">
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-base" disabled={loading}>
                  {loading ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </> : "Sign In"}
                </Button>

                {/* Test Credentials */}
                <div className="space-y-3 w-full">
                  <div className="text-center text-sm text-foreground/60 font-medium">
                    Quick Test Login
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {testCredentials.map((cred, index) => <Button key={index} type="button" variant="outline" size="sm" onClick={() => quickLogin(cred.email, cred.password)} className="text-xs font-medium border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200">
                        {cred.role}
                      </Button>)}
                  </div>
                </div>
                
                {/* Contact Admin */}
                <p className="text-sm text-foreground/60 text-center leading-relaxed">
                  Don't have an account?{" "}
                  <a href="mailto:po@lmvinsurancebroking.com" className="text-primary hover:text-primary/80 transition-colors font-semibold">
                    Contact Admin
                  </a>
                </p>

                {/* Back to Home */}
                <div className="text-center">
                  <BackButton 
                    to="/" 
                    label="Back to Home" 
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>;
};
export default Login;