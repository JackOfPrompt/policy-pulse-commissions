import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Insurance SaaS Platform</h1>
        <p className="text-xl text-muted-foreground">
          Multi-tenant insurance management system
        </p>
        
        <div className="space-y-4">
          {user ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">Welcome back!</p>
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In / Sign Up</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
