import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'agent' | 'employee' | 'customer';
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRole && profile.role !== requiredRole) {
    // Redirect based on user's actual role
    const roleRoutes = {
      super_admin: '/superadmin/dashboard',
      admin: '/admin',
      agent: '/agent',
      employee: '/employee/dashboard',
      customer: '/customer'
    };
    
    return <Navigate to={roleRoutes[profile.role]} replace />;
  }

  // Check if user has one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const roleRoutes = {
      super_admin: '/superadmin/dashboard',
      admin: '/admin',
      agent: '/agent',
      employee: '/employee/dashboard',
      customer: '/customer'
    };
    
    return <Navigate to={roleRoutes[profile.role]} replace />;
  }

  return <>{children}</>;
}