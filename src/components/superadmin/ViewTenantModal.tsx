import { useState, useEffect } from 'react';
import { Building2, MapPin, Calendar, Users, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  phone?: string;
  email?: string;
  status?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface UserCount {
  role: string;
  count: number;
}

interface ViewTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}

export function ViewTenantModal({ open, onOpenChange, organization }: ViewTenantModalProps) {
  const [userCounts, setUserCounts] = useState<UserCount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && organization) {
      loadUserCounts();
    }
  }, [open, organization]);

  const loadUserCounts = async () => {
    if (!organization) return;
    
    setLoading(true);
    try {
      // Get user counts by role for this organization
      const { data, error } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('org_id', organization.id);

      if (error) throw error;

      // Count users by role
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.role] = (counts[item.role] || 0) + 1;
      });

      const roleOrder = ['admin', 'employee', 'agent', 'customer'];
      const userCountsArray = roleOrder.map(role => ({
        role,
        count: counts[role] || 0
      }));

      setUserCounts(userCountsArray);
    } catch (error) {
      console.error('Error loading user counts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!organization) return null;

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1) + 's';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Tenant Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {organization.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={organization.status === 'active' ? 'default' : 'secondary'}>
                    {organization.status || 'active'}
                  </Badge>
                </div>
              </div>
              {organization.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{organization.description}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organization.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{organization.email}</p>
                </div>
              )}
              {organization.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{organization.phone}</p>
                </div>
              )}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* User Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Statistics
            </h3>
            
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading user statistics...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userCounts.map((userCount) => (
                  <Card key={userCount.role}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {formatRole(userCount.role)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold">{userCount.count}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timestamps
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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