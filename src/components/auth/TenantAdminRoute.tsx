import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface TenantAdminRouteProps {
  children: React.ReactNode;
}

export function TenantAdminRoute({ children }: TenantAdminRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Allow access to tenant area for any authenticated user linked to a tenant.
  // Data access is further restricted by RLS in Supabase.
  return <>{children}</>;
}
