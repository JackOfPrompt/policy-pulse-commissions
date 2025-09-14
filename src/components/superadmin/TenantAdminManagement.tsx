import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface TenantAdmin {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  org_name?: string;
  org_id: string;
}

interface TenantAdminManagementProps {
  organizationId?: string;
  organizationName?: string;
}

export function TenantAdminManagement({ 
  organizationId, 
  organizationName 
}: TenantAdminManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<TenantAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<TenantAdmin | null>(null);
  const [formData, setFormData] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    loadTenantAdmins();
  }, [organizationId]);

  const loadTenantAdmins = async () => {
    setLoading(true);
    try {
      // 1) Get admin memberships
      let membershipsQuery = supabase
        .from('user_organizations')
        .select('user_id, org_id, role')
        .eq('role', 'admin');

      if (organizationId) {
        membershipsQuery = membershipsQuery.eq('org_id', organizationId);
      }

      const { data: memberships, error: membershipsError } = await membershipsQuery;
      if (membershipsError) throw membershipsError;

      if (!memberships || memberships.length === 0) {
        setAdmins([]);
        return;
      }

      const userIds = Array.from(new Set(memberships.map((m: any) => m.user_id)));
      const orgIds = Array.from(new Set(memberships.map((m: any) => m.org_id)));

      // 2) Fetch profiles for those user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      // 3) Fetch org names if viewing all organizations
      let orgsMap: Record<string, { id: string; name: string }> = {};
      if (!organizationId) {
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        if (orgsError) throw orgsError;
        orgsMap = Object.fromEntries((orgsData || []).map((o: any) => [o.id, { id: o.id, name: o.name }]));
      }

      const profilesMap: Record<string, any> = Object.fromEntries(
        (profilesData || []).map((p: any) => [p.id, p])
      );

      const adminsList: TenantAdmin[] = memberships.map((m: any) => ({
        id: m.user_id,
        full_name: profilesMap[m.user_id]?.full_name || 'Unknown',
        email: profilesMap[m.user_id]?.email || 'No email',
        role: m.role,
        created_at: profilesMap[m.user_id]?.created_at || new Date().toISOString(),
        org_id: m.org_id,
        org_name: organizationId ? organizationName || '' : (orgsMap[m.org_id]?.name || ''),
      }));

      setAdmins(adminsList);
    } catch (error) {
      console.error('Error loading tenant admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tenant administrators',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.adminName.trim()) {
      errors.adminName = 'Admin name is required';
    }
    
    if (!formData.adminEmail.trim()) {
      errors.adminEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      errors.adminEmail = 'Please enter a valid email address';
    }
    
    if (!formData.adminPassword.trim()) {
      errors.adminPassword = 'Password is required';
    } else if (formData.adminPassword.length < 6) {
      errors.adminPassword = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAdmin = async () => {
    if (!validateForm() || !organizationId) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-tenant-admin', {
        body: {
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          organizationId: organizationId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Success',
        description: 'Tenant admin created successfully!',
      });

      setFormData({ adminName: '', adminEmail: '', adminPassword: '' });
      setCreateModalOpen(false);
      await loadTenantAdmins();
    } catch (error: any) {
      console.error('Error creating tenant admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tenant admin',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (admin: TenantAdmin) => {
    setSelectedAdmin(admin);
    setViewModalOpen(true);
  };

  const handleEdit = (admin: TenantAdmin) => {
    setSelectedAdmin(admin);
    setEditName(admin.full_name || '');
    setEditModalOpen(true);
  };

  const handleDelete = (admin: TenantAdmin) => {
    setSelectedAdmin(admin);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ adminName: '', adminEmail: '', adminPassword: '' });
    setFormErrors({});
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Tenant Administrators
                {organizationName && ` - ${organizationName}`}
              </CardTitle>
              <CardDescription>
                Manage administrators for {organizationName ? 'this organization' : 'all tenant organizations'}
              </CardDescription>
            </div>
            {organizationId && (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Administrators</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {organizationName ? 'This organization has no administrators yet' : 'No tenant administrators found'}
              </p>
              {organizationId && (
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Admin
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Email</TableHead>
                    {!organizationId && <TableHead>Organization</TableHead>}
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="font-medium">{admin.full_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{admin.email}</div>
                      </TableCell>
                      {!organizationId && (
                        <TableCell>
                          <div className="text-sm">{admin.org_name}</div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="default">{admin.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(admin)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(admin)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(admin)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Modal */}
      <Dialog open={createModalOpen} onOpenChange={(open) => {
        setCreateModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Tenant Administrator</DialogTitle>
            <DialogDescription>
              Add a new administrator for {organizationName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="adminName">Full Name</Label>
              <Input
                id="adminName"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="Enter admin full name"
              />
              {formErrors.adminName && (
                <p className="text-sm text-destructive">{formErrors.adminName}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adminEmail">Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="Enter admin email"
              />
              {formErrors.adminEmail && (
                <p className="text-sm text-destructive">{formErrors.adminEmail}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adminPassword">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                placeholder="Enter admin password"
              />
              {formErrors.adminPassword && (
                <p className="text-sm text-destructive">{formErrors.adminPassword}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Admin Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Administrator Details</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <p className="text-sm text-muted-foreground">{selectedAdmin.full_name}</p>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{selectedAdmin.email}</p>
              </div>
              <div className="grid gap-2">
                <Label>Organization</Label>
                <p className="text-sm text-muted-foreground">{selectedAdmin.org_name}</p>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Badge variant="default">{selectedAdmin.role}</Badge>
              </div>
              <div className="grid gap-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedAdmin.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}