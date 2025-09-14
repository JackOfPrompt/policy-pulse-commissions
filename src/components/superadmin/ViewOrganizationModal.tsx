import { useState, useEffect } from 'react';
import { Building2, MapPin, Calendar, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
}

interface TenantAdmin {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ViewOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}

export function ViewOrganizationModal({
  open,
  onOpenChange,
  organization,
}: ViewOrganizationModalProps) {
  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && organization) {
      loadTenantAdmins();
    }
  }, [open, organization]);

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
    } finally {
      setLoading(false);
    }
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organization Details
          </DialogTitle>
          <DialogDescription>
            Complete information about {organization.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                <p className="text-sm font-medium">{organization.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization Code</label>
                <p className="text-sm">
                  <code className="rounded bg-muted px-2 py-1">{organization.code}</code>
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Details
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {organization.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm">{organization.address}</p>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                {organization.city && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">City</label>
                    <p className="text-sm">{organization.city}</p>
                  </div>
                )}
                {organization.state && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">State</label>
                    <p className="text-sm">{organization.state}</p>
                  </div>
                )}
                {organization.pincode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                    <p className="text-sm">{organization.pincode}</p>
                  </div>
                )}
              </div>
              
              {organization.country && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Country</label>
                  <p className="text-sm">{organization.country}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tenant Admins */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tenant Administrators ({tenantAdmins.length})
            </h3>
            
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading admins...</div>
            ) : tenantAdmins.length > 0 ? (
              <div className="space-y-3">
                {tenantAdmins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{admin.full_name}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge variant="secondary">{admin.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No tenant administrators found</div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timestamps
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{new Date(organization.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{new Date(organization.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}