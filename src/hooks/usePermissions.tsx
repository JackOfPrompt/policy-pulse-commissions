import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Permission {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

interface UserRole {
  id: string;
  name: string;
  slug: string;
  default_dashboard: string;
  is_active: boolean;
}

interface UserPermissions {
  role: UserRole | null;
  permissions: Permission[];
  loading: boolean;
  hasPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export') => boolean;
  canAccessModule: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<UserPermissions | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      
      // DEVELOPMENT MODE: Grant full admin access without authentication
      // TODO: Remove this section in production and implement proper authentication
      console.log('Development Mode: Granting full admin access');
      
      // Set admin role with full permissions using existing admin user
      setRole({
        id: '11111111-1111-1111-1111-111111111111', // Use existing admin user ID
        name: 'Development Admin',
        slug: 'admin',
        default_dashboard: '/admin/overview',
        is_active: true
      });

      // Create full permissions for all modules
      const adminPermissions = [
        'dashboard', 'policies', 'agents', 'employees', 'branches', 
        'providers', 'products', 'commissions', 'payouts', 'reports', 
        'renewals', 'tasks', 'document-validation', 'roles', 'users', 'leads',
        'finance', 'revenue', 'business', 'master-data', 'tenant-management'
      ].map(module => ({
        module_name: module,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_export: true
      }));

      setPermissions(adminPermissions);
      setLoading(false);
      return;
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
      // Fallback to admin permissions on error
      setRole({
        id: 'admin',
        name: 'Admin',
        slug: 'admin',
        default_dashboard: '/admin/overview',
        is_active: true
      });

      const adminPermissions = [
        'dashboard', 'policies', 'agents', 'employees', 'branches',
        'providers', 'products', 'commissions', 'payouts', 'reports',
        'renewals', 'tasks', 'document-validation', 'roles', 'users', 'leads',
        'finance', 'revenue', 'business', 'master-data', 'tenant-management'
      ].map(module => ({
        module_name: module,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_export: true
      }));

      setPermissions(adminPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export'): boolean => {
    const permission = permissions.find(p => p.module_name === module);
    if (!permission) return false;

    switch (action) {
      case 'view':
        return permission.can_view;
      case 'create':
        return permission.can_create;
      case 'edit':
        return permission.can_edit;
      case 'delete':
        return permission.can_delete;
      case 'export':
        return permission.can_export;
      default:
        return false;
    }
  };

  const canAccessModule = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  const value: UserPermissions = {
    role,
    permissions,
    loading,
    hasPermission,
    canAccessModule,
    refreshPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Utility hook for protecting components
export const usePermissionGuard = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export' = 'view') => {
  const { hasPermission, loading } = usePermissions();
  
  return {
    canAccess: hasPermission(module, action),
    loading
  };
};

// HOC for protecting routes
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  module: string,
  action: 'view' | 'create' | 'edit' | 'delete' | 'export' = 'view'
) => {
  return function PermissionProtectedComponent(props: any) {
    const { canAccess, loading } = usePermissionGuard(module, action);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading permissions...</div>
        </div>
      );
    }

    if (!canAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};