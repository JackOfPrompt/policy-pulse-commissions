import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Role {
  role_id: number;
  role_name: string;
  role_code: string;
  description?: string;
  status: string;
  tenant_id?: number;
  permission_count?: number;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  permission_id: number;
  permission_name: string;
  permission_code: string;
  module?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
  user_roles?: UserRole[];
}

export interface UserRole {
  role_id: number;
  role_name: string;
  tenant_id: number;
  branch_id?: number;
  department_id?: number;
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'GET',
        body: { action: 'get_roles' }
      });

      if (error) throw error;
      if (data?.success) {
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'GET',
        body: { action: 'get_users' }
      });

      if (error) throw error;
      if (data?.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'GET',
        body: { action: 'get_permissions' }
      });

      if (error) throw error;
      if (data?.success) {
        setPermissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (roleData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'POST',
        body: { 
          action: 'create_role',
          ...roleData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  };

  const updateRole = async (roleId: number, roleData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'PUT',
        body: { 
          action: 'update_role',
          role_id: roleId,
          ...roleData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  const deleteRole = async (roleId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'DELETE',
        body: { 
          action: 'delete_role',
          role_id: roleId 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  };

  const updateRoleStatus = async (roleId: number, status: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'PATCH',
        body: { 
          action: 'update_role_status',
          role_id: roleId,
          status 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating role status:', error);
      throw error;
    }
  };

  const assignRoleToUser = async (userId: string, roleAssignments: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'POST',
        body: { 
          action: 'assign_roles',
          user_id: userId,
          roles: roleAssignments
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning roles:', error);
      throw error;
    }
  };

  const removeRoleFromUser = async (userId: string, roleId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'DELETE',
        body: { 
          action: 'remove_role',
          user_id: userId,
          role_id: roleId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  };

  const getRoleDetail = async (roleId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('roles-permissions', {
        method: 'GET',
        body: { 
          action: 'get_role_detail',
          role_id: roleId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching role detail:', error);
      throw error;
    }
  };

  return {
    roles,
    users,
    permissions,
    loading,
    fetchRoles,
    fetchUsers,
    fetchPermissions,
    createRole,
    updateRole,
    deleteRole,
    updateRoleStatus,
    assignRoleToUser,
    removeRoleFromUser,
    getRoleDetail,
  };
};