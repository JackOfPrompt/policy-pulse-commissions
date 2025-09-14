import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, User, Mail, Lock, Trash2, Plus } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const adminSchema = z.object({
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type AdminFormData = z.infer<typeof adminSchema>;

interface Organization {
  id: string;
  name: string;
  code: string;
}

interface TenantAdmin {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ManageAdminsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSuccess: () => void;
}

export function ManageAdminsModal({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: ManageAdminsModalProps) {
  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

  useEffect(() => {
    if (open && organization) {
      loadTenantAdmins();
      form.reset();
      setIsAdding(false);
      setError(null);
    }
  }, [open, organization, form]);

  const loadTenantAdmins = async () => {
    if (!organization) return;
    
    setLoading(true);
    try {
      // First get user_ids for this organization's admins
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('user_id, role')
        .eq('org_id', organization.id)
        .eq('role', 'admin');

      if (userOrgsError) throw userOrgsError;

      if (!userOrgs || userOrgs.length === 0) {
        setTenantAdmins([]);
        return;
      }

      // Then get profiles for those user_ids
      const userIds = userOrgs.map(uo => uo.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const admins = profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'Unknown',
        email: profile.email || 'No email',
        role: 'admin',
        created_at: profile.created_at || new Date().toISOString()
      })) || [];

      setTenantAdmins(admins);
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

  const onSubmit = async (data: AdminFormData) => {
    if (!organization) return;

    setLoading(true);
    setError(null);

    try {
      // Use the edge function to create tenant admin without auto-login
      const { data: result, error: functionError } = await supabase.functions.invoke(
        'create-tenant-admin',
        {
          body: {
            adminName: data.adminName,
            adminEmail: data.adminEmail,
            adminPassword: data.adminPassword,
            organizationId: organization.id,
          },
        }
      );

      if (functionError || !result?.success) {
        throw new Error(result?.error || functionError?.message || 'Failed to create tenant admin');
      }

      toast({
        title: 'Success',
        description: 'Tenant admin created successfully!',
      });

      form.reset();
      setIsAdding(false);
      await loadTenantAdmins();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating tenant admin:', error);
      setError(error.message || 'Failed to create tenant admin');
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async (adminId: string, adminEmail: string) => {
    if (!organization) return;

    try {
      setLoading(true);

      // Remove from user_organizations
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', adminId)
        .eq('org_id', organization.id)
        .eq('role', 'admin');

      if (userOrgError) throw userOrgError;

      toast({
        title: 'Success',
        description: `Admin ${adminEmail} removed successfully`,
      });

      await loadTenantAdmins();
      onSuccess();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove admin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Tenant Administrators
          </DialogTitle>
          <DialogDescription>
            Manage admin users for {organization.name} ({organization.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Admins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Administrators ({tenantAdmins.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && tenantAdmins.length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading admins...</div>
              ) : tenantAdmins.length > 0 ? (
                <div className="space-y-3">
                  {tenantAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{admin.full_name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Added: {new Date(admin.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{admin.role}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdmin(admin.id, admin.email)}
                          disabled={loading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tenant administrators found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Add New Admin */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Add New Administrator</CardTitle>
                {!isAdding && (
                  <Button onClick={() => setIsAdding(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                )}
              </div>
            </CardHeader>
            {isAdding && (
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Admin Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminName"
                        {...form.register('adminName')}
                        placeholder="Enter admin full name"
                        className={`pl-10 ${form.formState.errors.adminName ? 'border-destructive' : ''}`}
                        disabled={loading}
                      />
                    </div>
                    {form.formState.errors.adminName && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.adminName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminEmail"
                        type="email"
                        {...form.register('adminEmail')}
                        placeholder="Enter admin email"
                        className={`pl-10 ${form.formState.errors.adminEmail ? 'border-destructive' : ''}`}
                        disabled={loading}
                      />
                    </div>
                    {form.formState.errors.adminEmail && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.adminEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPassword"
                        type="password"
                        {...form.register('adminPassword')}
                        placeholder="Create admin password"
                        className={`pl-10 ${form.formState.errors.adminPassword ? 'border-destructive' : ''}`}
                        disabled={loading}
                      />
                    </div>
                    {form.formState.errors.adminPassword && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.adminPassword.message}
                      </p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAdding(false);
                        form.reset();
                        setError(null);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Admin'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}