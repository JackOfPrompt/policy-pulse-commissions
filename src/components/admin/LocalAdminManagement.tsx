import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Users } from 'lucide-react';
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
import { CreateAdminModal } from './CreateAdminModal';
import { EditAdminModal } from './EditAdminModal';
import { DeleteAdminModal } from './DeleteAdminModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Admin {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export function LocalAdminManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    loadAdmins();
  }, [profile]);

  const loadAdmins = async () => {
    if (!profile?.org_id) return;

    setLoading(true);
    try {
      // Get admin user IDs for this organization
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('org_id', profile.org_id)
        .eq('role', 'admin');

      if (userOrgsError) throw userOrgsError;

      if (!userOrgs || userOrgs.length === 0) {
        setAdmins([]);
        return;
      }

      // Get profiles for those user IDs
      const userIds = userOrgs.map(uo => uo.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const adminProfiles = profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'Unknown',
        email: profile.email || 'No email',
        role: 'admin',
        created_at: profile.created_at || new Date().toISOString()
      })) || [];

      setAdmins(adminProfiles);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load administrators',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditModalOpen(true);
  };

  const handleDelete = (admin: Admin) => {
    setSelectedAdmin(admin);
    setDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedAdmin(null);
    loadAdmins();
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
                Local Administrators
              </CardTitle>
              <CardDescription>
                Manage administrators for your organization
              </CardDescription>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Administrators</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first administrator to get started</p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Admin
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Email</TableHead>
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

      <CreateAdminModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleModalClose}
      />

      <EditAdminModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        admin={selectedAdmin}
        onSuccess={handleModalClose}
      />

      <DeleteAdminModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        admin={selectedAdmin}
        onSuccess={handleModalClose}
      />
    </>
  );
}