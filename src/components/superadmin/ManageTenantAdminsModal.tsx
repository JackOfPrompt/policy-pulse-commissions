import { useState, useEffect } from 'react';
import { UserPlus, Users, Mail, Trash2, Edit2, Shield, MoreHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/tables/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TenantAdmin {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
  department?: string;
  sub_department?: string;
  profile_role?: string;
  last_sign_in_at?: string;
}

interface Organization {
  id: string;
  name: string;
  code: string;
}

interface ManageTenantAdminsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSuccess: () => void;
}

export function ManageTenantAdminsModal({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: ManageTenantAdminsModalProps) {
  const [admins, setAdmins] = useState<TenantAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<TenantAdmin | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newAdminData, setNewAdminData] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    sub_department: '',
  });

  const [editAdminData, setEditAdminData] = useState({
    fullName: '',
    email: '',
    department: '',
    sub_department: '',
  });

  // Load tenant admins when modal opens
  useEffect(() => {
    if (open && organization) {
      loadTenantAdmins();
    }
  }, [open, organization]);

  const loadTenantAdmins = async () => {
    if (!organization) return;

    setIsLoading(true);
    setError(null);
    try {
      // Get user_organizations for admins of this organization
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('user_id, role')
        .eq('org_id', organization.id)
        .eq('role', 'admin');

      if (userOrgsError) throw userOrgsError;

      if (!userOrgs || userOrgs.length === 0) {
        console.log('No admin user organizations found');
        setAdmins([]);
        return;
      }

      // Get detailed profile information from profiles table
      const userIds = userOrgs.map(uo => uo.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, updated_at, role, department, sub_department')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      console.log('Found profiles:', profiles);

      // Transform and merge the data
      const adminData: TenantAdmin[] = userOrgs.map(userOrg => {
        const profile = profiles?.find(p => p.id === userOrg.user_id);
        return {
          id: userOrg.user_id,
          full_name: profile?.full_name || 'Unknown User',
          email: profile?.email || 'No email available',
          role: userOrg.role,
          created_at: profile?.created_at || new Date().toISOString(),
          updated_at: profile?.updated_at,
          department: profile?.department,
          sub_department: profile?.sub_department,
          profile_role: profile?.role,
        };
      });

      setAdmins(adminData);
      console.log('Loaded tenant admins:', adminData);
    } catch (error: any) {
      console.error('Error loading tenant admins:', error);
      setError(error.message || 'Failed to load tenant admins');
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!organization || !newAdminData.fullName || !newAdminData.email || !newAdminData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setIsAddingAdmin(true);
    setError(null);

    try {
      // Use the edge function to create tenant admin
      const { data: responseData, error: functionError } = await supabase.functions.invoke('create-tenant-admin', {
        body: {
          adminName: newAdminData.fullName,
          adminEmail: newAdminData.email,
          adminPassword: newAdminData.password,
          organizationId: organization.id,
          department: newAdminData.department || null,
          sub_department: newAdminData.sub_department || null,
        }
      });

      if (functionError) throw functionError;
      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Failed to create admin');
      }

      toast({
        title: 'Success',
        description: 'Tenant admin created successfully!',
      });

      // Reset form and reload admins
      setNewAdminData({ fullName: '', email: '', password: '', department: '', sub_department: '' });
      setShowAddForm(false);
      loadTenantAdmins();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating tenant admin:', error);
      setError(error.message || 'Failed to create tenant admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleEditAdmin = (admin: TenantAdmin) => {
    setEditingAdmin(admin);
    setEditAdminData({
      fullName: admin.full_name,
      email: admin.email,
      department: admin.department || '',
      sub_department: admin.sub_department || '',
    });
    setShowEditForm(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin || !editAdminData.fullName || !editAdminData.email) {
      setError('Please fill in all required fields');
      return;
    }

    setIsAddingAdmin(true);
    setError(null);

    try {
      // Update the profile information
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: editAdminData.fullName,
          email: editAdminData.email,
          department: editAdminData.department || null,
          sub_department: editAdminData.sub_department || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingAdmin.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Admin profile updated successfully!',
      });

      // Reset form and reload admins
      setEditingAdmin(null);
      setShowEditForm(false);
      loadTenantAdmins();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating admin:', error);
      setError(error.message || 'Failed to update admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (!organization) return;

    if (!confirm(`Are you sure you want to remove ${adminEmail} as an admin for ${organization.name}?`)) {
      return;
    }

    try {
      // Remove from user_organizations table
      const { error: removeError } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', adminId)
        .eq('org_id', organization.id)
        .eq('role', 'admin');

      if (removeError) throw removeError;

      toast({
        title: 'Success',
        description: 'Admin removed successfully!',
      });

      loadTenantAdmins();
      onSuccess();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Table columns for DataTable
  const columns = [
    {
      key: 'admin_info',
      label: 'Administrator',
      render: (_, admin: TenantAdmin) => (
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{admin.full_name}</p>
            <p className="text-sm text-muted-foreground">ID: {admin.id.slice(0, 8)}...</p>
            {admin.department && (
              <p className="text-xs text-muted-foreground">{admin.department}{admin.sub_department && ` / ${admin.sub_department}`}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (_, admin: TenantAdmin) => (
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{admin.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (_, admin: TenantAdmin) => (
        <Badge variant="default">
          {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (_, admin: TenantAdmin) => formatDate(admin.created_at),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, admin: TenantAdmin) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditAdmin(admin)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleDeleteAdmin(admin.id, admin.email)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Tenant Admins - {organization?.name}
          </DialogTitle>
          <DialogDescription>
            View, add, edit, and remove administrators for this organization. Data is reflected from the profiles table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Admin Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Add New Admin</CardTitle>
                  <CardDescription>
                    Create a new administrator account for this organization
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  variant={showAddForm ? "outline" : "default"}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {showAddForm ? 'Cancel' : 'Add Admin'}
                </Button>
              </div>
            </CardHeader>

            {showAddForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={newAdminData.fullName}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter admin full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter admin email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newAdminData.department}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sub_department">Sub Department</Label>
                    <Input
                      id="sub_department"
                      value={newAdminData.sub_department}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, sub_department: e.target.value }))}
                      placeholder="Enter sub department"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAdminData.password}
                    onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter temporary password (min 6 characters)"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddAdmin}
                    disabled={isAddingAdmin || !newAdminData.fullName || !newAdminData.email || !newAdminData.password}
                    className="flex-1"
                  >
                    {isAddingAdmin ? 'Creating...' : 'Create Admin'}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Edit Admin Form */}
          {showEditForm && editingAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edit Admin Profile</CardTitle>
                <CardDescription>
                  Update administrator profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFullName">Full Name *</Label>
                    <Input
                      id="editFullName"
                      value={editAdminData.fullName}
                      onChange={(e) => setEditAdminData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter admin full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email Address *</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editAdminData.email}
                      onChange={(e) => setEditAdminData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter admin email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editDepartment">Department</Label>
                    <Input
                      id="editDepartment"
                      value={editAdminData.department}
                      onChange={(e) => setEditAdminData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editSubDepartment">Sub Department</Label>
                    <Input
                      id="editSubDepartment"
                      value={editAdminData.sub_department}
                      onChange={(e) => setEditAdminData(prev => ({ ...prev, sub_department: e.target.value }))}
                      placeholder="Enter sub department"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateAdmin}
                    disabled={isAddingAdmin || !editAdminData.fullName || !editAdminData.email}
                  >
                    {isAddingAdmin ? 'Updating...' : 'Update Admin'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingAdmin(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Current Admins List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Administrators ({admins.length})</CardTitle>
              <CardDescription>
                Manage existing administrator accounts for this organization. Data from profiles table.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No administrators found</h3>
                  <p className="text-sm">This organization doesn't have any administrators yet.</p>
                </div>
              ) : (
                <DataTable
                  data={admins}
                  columns={columns}
                  searchPlaceholder="Search administrators..."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}