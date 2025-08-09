import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Edit, Users, Shield } from "lucide-react";

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  default_dashboard: string;
  is_active: boolean;
  created_at: string;
  user_count?: number;
}

interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

const AVAILABLE_MODULES = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'policies', label: 'Policies' },
  { name: 'agents', label: 'Agents' },
  { name: 'employees', label: 'Employees' },
  { name: 'branches', label: 'Branches' },
  { name: 'providers', label: 'Insurance Providers' },
  { name: 'products', label: 'Products' },
  { name: 'commissions', label: 'Commissions' },
  { name: 'payouts', label: 'Payouts' },
  { name: 'reports', label: 'Reports' },
  { name: 'renewals', label: 'Renewals' },
  { name: 'tasks', label: 'Tasks' },
  { name: 'document-validation', label: 'Document Validation' },
  { name: 'roles', label: 'Role Management' },
  { name: 'users', label: 'User Management' }
];

const DASHBOARD_OPTIONS = [
  { value: '/admin/overview', label: 'Admin Overview' },
  { value: '/admin/policies', label: 'Policies Dashboard' },
  { value: '/admin/agents', label: 'Agents Dashboard' },
  { value: '/admin/payouts', label: 'Payouts Dashboard' },
  { value: '/admin/commissions', label: 'Commissions Dashboard' },
  { value: '/admin/reports', label: 'Reports Dashboard' }
];

const RolesManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    slug: '',
    description: '',
    default_dashboard: '/admin/overview',
    is_active: true
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      // Fetch roles with user count
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          users_auth(count)
        `)
        .order('name');

      if (rolesError) throw rolesError;

      // Transform the data to include user count
      const rolesWithCount = rolesData?.map(role => ({
        ...role,
        user_count: role.users_auth?.[0]?.count || 0
      })) || [];

      setRoles(rolesWithCount);
      
      if (rolesWithCount.length > 0 && !selectedRole) {
        setSelectedRole(rolesWithCount[0]);
        fetchPermissions(rolesWithCount[0].id);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleId);

      if (error) throw error;

      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch permissions",
        variant: "destructive",
      });
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setEditingRole(false);
    fetchPermissions(role.id);
  };

  const handleCreateRole = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          name: newRole.name,
          slug: newRole.slug,
          description: newRole.description,
          default_dashboard: newRole.default_dashboard,
          is_active: newRole.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      // Create default permissions (view-only)
      const defaultPermissions = AVAILABLE_MODULES.map(module => ({
        role_id: data.id,
        module_name: module.name,
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false
      }));

      await supabase
        .from('role_permissions')
        .insert(defaultPermissions);

      setNewRole({
        name: '',
        slug: '',
        description: '',
        default_dashboard: '/admin/overview',
        is_active: true
      });

      fetchRoles();
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: selectedRole.name,
          slug: selectedRole.slug,
          description: selectedRole.description,
          default_dashboard: selectedRole.default_dashboard,
          is_active: selectedRole.is_active
        })
        .eq('id', selectedRole.id);

      if (error) throw error;

      setEditingRole(false);
      fetchRoles();
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = async (moduleName: string, permissionType: string, value: boolean) => {
    if (!selectedRole) return;

    try {
      const existingPermission = permissions.find(p => p.module_name === moduleName);
      
      if (existingPermission) {
        const { error } = await supabase
          .from('role_permissions')
          .update({ [permissionType]: value })
          .eq('id', existingPermission.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .insert([{
            role_id: selectedRole.id,
            module_name: moduleName,
            can_view: permissionType === 'can_view' ? value : false,
            can_create: permissionType === 'can_create' ? value : false,
            can_edit: permissionType === 'can_edit' ? value : false,
            can_delete: permissionType === 'can_delete' ? value : false,
            can_export: permissionType === 'can_export' ? value : false
          }]);

        if (error) throw error;
      }

      fetchPermissions(selectedRole.id);
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const getPermissionValue = (moduleName: string, permissionType: string): boolean => {
    const permission = permissions.find(p => p.module_name === moduleName);
    return permission ? permission[permissionType as keyof Permission] as boolean : false;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Roles & Permissions Management
        </h1>
        <p className="text-muted-foreground">Configure user roles and their system permissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Roles
              <Button size="sm" onClick={() => setEditingRole(false)}>
                <Plus className="h-4 w-4 mr-2" />
                New Role
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole?.id === role.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{role.name}</h3>
                  <Badge variant={role.is_active ? "default" : "secondary"}>
                    {role.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {role.user_count || 0} users
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Role Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {selectedRole ? (editingRole ? 'Edit Role' : selectedRole.name) : 'Create New Role'}
              {selectedRole && !editingRole && (
                <Button variant="outline" size="sm" onClick={() => setEditingRole(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Role Details</TabsTrigger>
                {selectedRole && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {selectedRole && !editingRole ? (
                  // View Mode
                  <div className="space-y-4">
                    <div>
                      <Label>Role Name</Label>
                      <p className="mt-1">{selectedRole.name}</p>
                    </div>
                    <div>
                      <Label>Role Code</Label>
                      <p className="mt-1">{selectedRole.slug}</p>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <p className="mt-1">{selectedRole.description || 'No description'}</p>
                    </div>
                    <div>
                      <Label>Default Dashboard</Label>
                      <p className="mt-1">{selectedRole.default_dashboard}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p className="mt-1">
                        <Badge variant={selectedRole.is_active ? "default" : "secondary"}>
                          {selectedRole.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                ) : (
                  // Edit/Create Mode
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Role Name</Label>
                      <Input
                        id="name"
                        value={selectedRole ? selectedRole.name : newRole.name}
                        onChange={(e) => {
                          if (selectedRole) {
                            setSelectedRole({ ...selectedRole, name: e.target.value });
                          } else {
                            setNewRole({ ...newRole, name: e.target.value });
                          }
                        }}
                        placeholder="Enter role name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Role Code</Label>
                      <Input
                        id="slug"
                        value={selectedRole ? selectedRole.slug : newRole.slug}
                        onChange={(e) => {
                          const slug = e.target.value.toLowerCase().replace(/\s+/g, '-');
                          if (selectedRole) {
                            setSelectedRole({ ...selectedRole, slug });
                          } else {
                            setNewRole({ ...newRole, slug });
                          }
                        }}
                        placeholder="Enter role code (slug)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={selectedRole ? selectedRole.description : newRole.description}
                        onChange={(e) => {
                          if (selectedRole) {
                            setSelectedRole({ ...selectedRole, description: e.target.value });
                          } else {
                            setNewRole({ ...newRole, description: e.target.value });
                          }
                        }}
                        placeholder="Enter role description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard">Default Dashboard</Label>
                      <Select
                        value={selectedRole ? selectedRole.default_dashboard : newRole.default_dashboard}
                        onValueChange={(value) => {
                          if (selectedRole) {
                            setSelectedRole({ ...selectedRole, default_dashboard: value });
                          } else {
                            setNewRole({ ...newRole, default_dashboard: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DASHBOARD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={selectedRole ? selectedRole.is_active : newRole.is_active}
                        onCheckedChange={(checked) => {
                          if (selectedRole) {
                            setSelectedRole({ ...selectedRole, is_active: checked });
                          } else {
                            setNewRole({ ...newRole, is_active: checked });
                          }
                        }}
                      />
                      <Label htmlFor="active">Active Role</Label>
                    </div>
                    <Button 
                      onClick={selectedRole ? handleUpdateRole : handleCreateRole}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {selectedRole ? 'Update Role' : 'Create Role'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {selectedRole && (
                <TabsContent value="permissions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Permissions Matrix</CardTitle>
                      <CardDescription>
                        Configure what actions this role can perform in each module
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Module</TableHead>
                            <TableHead className="text-center">View</TableHead>
                            <TableHead className="text-center">Create</TableHead>
                            <TableHead className="text-center">Edit</TableHead>
                            <TableHead className="text-center">Delete</TableHead>
                            <TableHead className="text-center">Export</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {AVAILABLE_MODULES.map((module) => (
                            <TableRow key={module.name}>
                              <TableCell className="font-medium">{module.label}</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={getPermissionValue(module.name, 'can_view')}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(module.name, 'can_view', checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={getPermissionValue(module.name, 'can_create')}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(module.name, 'can_create', checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={getPermissionValue(module.name, 'can_edit')}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(module.name, 'can_edit', checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={getPermissionValue(module.name, 'can_delete')}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(module.name, 'can_delete', checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={getPermissionValue(module.name, 'can_export')}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(module.name, 'can_export', checked)
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RolesManagement;