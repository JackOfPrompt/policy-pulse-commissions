import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users } from 'lucide-react';

const OrgSelection = () => {
  const { user, profile, userOrganizations, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if user has no organizations or only one organization
  if (!loading && userOrganizations.length <= 1) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleOrgSelect = (orgId: string) => {
    // In a real app, you'd set the selected organization in context/state
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Select Organization</h1>
          <p className="text-muted-foreground mt-2">
            You belong to multiple organizations. Please select one to continue.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {userOrganizations.map((userOrg) => (
            <Card 
              key={userOrg.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOrgSelect(userOrg.org_id)}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{userOrg.organization.name}</CardTitle>
                    <CardDescription className="capitalize">{userOrg.role.replace('_', ' ')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Role: {userOrg.role.replace('_', ' ')}</span>
                  </div>
                  <Button size="sm">
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrgSelection;