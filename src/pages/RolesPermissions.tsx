import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, MoreHorizontal, Users, Shield, Settings, Filter, Download, UserPlus, Building2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CreateEditRoleModal } from '@/components/CreateEditRoleModal';
import { AssignRoleModal } from '@/components/AssignRoleModal';
import { RoleDetailModal } from '@/components/RoleDetailModal';
import { useRoles } from '@/hooks/useRoles';

const RolesPermissions = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isRoleDetailOpen, setIsRoleDetailOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    roles, 
    users, 
    permissions, 
    loading, 
    fetchRoles, 
    fetchUsers, 
    fetchPermissions,
    deleteRole,
    updateRoleStatus 
  } = useRoles();

  useEffect(() => {
    if (!user || profile?.role !== 'system_admin') {
      navigate('/login');
      return;
    }
    fetchRoles();
    fetchUsers();
    fetchPermissions();
  }, [user, profile, navigate]);

  const handleDeleteRole = async (roleId: number) => {
    try {
      await deleteRole(roleId);
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      fetchRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (roleId: number, newStatus: string) => {
    try {
      await updateRoleStatus(roleId, newStatus);
      toast({
        title: "Success",
        description: "Role status updated successfully",
      });
      fetchRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'Active' ? 'default' : 'secondary';
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = !searchTerm || 
      role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.role_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || role.status === statusFilter;
    const matchesTenant = tenantFilter === 'all' || role.tenant_id?.toString() === tenantFilter;
    const matchesModule = moduleFilter === 'all' || role.permissions?.some(p => p.module === moduleFilter);
    return matchesSearch && matchesStatus && matchesTenant && matchesModule;
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'all' || user.user_roles?.some(ur => ur.branch_id?.toString() === branchFilter);
    const matchesDepartment = departmentFilter === 'all' || user.user_roles?.some(ur => ur.department_id?.toString() === departmentFilter);
    return matchesSearch && matchesBranch && matchesDepartment;
  });

  if (!user || profile?.role !== 'system_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton to="/admin-dashboard" />
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
                  <p className="text-muted-foreground">Manage user roles and permission assignments</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {filteredRoles.length} of {roles.length} Roles
              </Badge>
              <Badge variant="outline" className="text-xs">
                {permissions.length} Permissions
              </Badge>
              <Badge variant="outline" className="text-xs">
                {filteredUsers.length} of {users.length} Users
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Roles Management
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Assignment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Roles</CardTitle>
                    <CardDescription>Manage system roles and their permissions</CardDescription>
                  </div>
                  <Button onClick={() => setIsCreateRoleOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search roles by name, code, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={tenantFilter} onValueChange={setTenantFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Tenants" />
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Tenants</SelectItem>
                          <SelectItem value="1">Tenant 1</SelectItem>
                          <SelectItem value="2">Tenant 2</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={moduleFilter} onValueChange={setModuleFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Modules" />
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Modules</SelectItem>
                          {Array.from(new Set(permissions.map(p => p.module).filter(Boolean))).map(module => (
                            <SelectItem key={module} value={module}>{module}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setStatusFilter('all');
                          setTenantFilter('all');
                          setModuleFilter('all');
                          setSearchTerm('');
                        }}
                        className="text-muted-foreground"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-muted-foreground">Loading roles...</div>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-2">No roles found</p>
                    <p className="text-sm text-muted-foreground">Create your first role to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Role Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead># Permissions</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.map((role) => (
                        <TableRow key={role.role_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-muted-foreground" />
                              {role.role_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-mono">
                              {role.role_code}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm text-muted-foreground">
                              {role.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              {role.tenant_id || 'System Wide'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(role.status)}>
                              {role.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {role.permission_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(role.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRole(role);
                                  setIsRoleDetailOpen(true);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRole(role);
                                  setIsEditRoleOpen(true);
                                }}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(role.role_id, role.status === 'Active' ? 'Inactive' : 'Active')}
                                >
                                  {role.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteRole(role.role_id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>User Role Assignment</CardTitle>
                    <CardDescription>Assign roles to users and manage permissions</CardDescription>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search users by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Users
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Branches</SelectItem>
                          <SelectItem value="1">Branch 1</SelectItem>
                          <SelectItem value="2">Branch 2</SelectItem>
                          <SelectItem value="3">Branch 3</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="1">Sales</SelectItem>
                          <SelectItem value="2">Operations</SelectItem>
                          <SelectItem value="3">Claims</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setBranchFilter('all');
                          setDepartmentFilter('all');
                          setSearchTerm('');
                        }}
                        className="text-muted-foreground"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-muted-foreground">Loading users...</div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-2">No users found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Base Role</TableHead>
                        <TableHead>Assigned Roles</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">
                                {user.user_roles?.find(ur => ur.branch_id)?.branch_id || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">
                                {user.user_roles?.find(ur => ur.department_id)?.department_id || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {user.user_roles?.length > 0 ? 
                                user.user_roles.slice(0, 2).map((ur, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {ur.role_name}
                                  </Badge>
                                )) : 
                                <span className="text-sm text-muted-foreground">No roles assigned</span>
                              }
                              {user.user_roles?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.user_roles.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsAssignRoleOpen(true);
                                }}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Assign
                              </Button>
                              {user.user_roles?.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsRoleDetailOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <CreateEditRoleModal
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        onSuccess={() => {
          setIsCreateRoleOpen(false);
          fetchRoles();
        }}
        mode="create"
        permissions={permissions}
      />

      {selectedRole && (
        <CreateEditRoleModal
          isOpen={isEditRoleOpen}
          onClose={() => {
            setIsEditRoleOpen(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setIsEditRoleOpen(false);
            setSelectedRole(null);
            fetchRoles();
          }}
          mode="edit"
          role={selectedRole}
          permissions={permissions}
        />
      )}

      {selectedRole && (
        <RoleDetailModal
          isOpen={isRoleDetailOpen}
          onClose={() => {
            setIsRoleDetailOpen(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
        />
      )}

      {selectedUser && (
        <AssignRoleModal
          isOpen={isAssignRoleOpen}
          onClose={() => {
            setIsAssignRoleOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setIsAssignRoleOpen(false);
            setSelectedUser(null);
            fetchUsers();
          }}
          user={selectedUser}
          roles={roles}
        />
      )}
    </div>
  );
};

export default RolesPermissions;