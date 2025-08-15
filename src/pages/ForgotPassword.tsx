import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } else {
      setSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    }
    
    setLoading(false);
  };

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

        {/* Forgot Password Card */}
        <Card className="shadow-[var(--shadow-card)] border border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Forgot Password</CardTitle>
            <CardDescription>
              {sent 
                ? "Check your email for reset instructions"
                : "Enter your email to receive password reset instructions"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Email"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="text-secondary" size={24} />
                </div>
                <p className="text-muted-foreground">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <Button 
                  onClick={() => setSent(false)}
                  variant="outline"
                  className="w-full"
                >
                  Try Different Email
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-sm text-primary hover:text-primary/80"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;