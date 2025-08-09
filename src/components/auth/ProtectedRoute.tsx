import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: ('Employee' | 'Agent' | 'Customer' | 'Admin')[];
  allowedEmployeeRoles?: ('Admin' | 'Sales' | 'Ops' | 'Branch Manager' | 'Finance')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserTypes = [],
  allowedEmployeeRoles = []
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user type is allowed
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(profile.user_type)) {
    // Redirect to appropriate portal based on user type
    switch (profile.user_type) {
      case 'Admin':
        return <Navigate to="/admin/overview" replace />;
      case 'Employee':
        return <Navigate to="/employee/dashboard" replace />;
      case 'Agent':
        return <Navigate to="/agent/dashboard" replace />;
      case 'Customer':
        return <Navigate to="/customer/dashboard" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  // Check employee role if specified
  if (allowedEmployeeRoles.length > 0 && profile.user_type === 'Employee') {
    if (!profile.employee_role || !allowedEmployeeRoles.includes(profile.employee_role)) {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;