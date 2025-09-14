import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Globe, Building2, Users, MapIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Organization {
  id: string;
  name: string;
  code: string;
  status: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  industry_type?: string;
  business_type?: string;
  employee_count?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  admin_count?: number;
  user_count?: number;
  policy_count?: number;
  monthly_revenue?: number;
}

interface EnhancedViewOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}

export function EnhancedViewOrganizationModal({
  open,
  onOpenChange,
  organization,
}: EnhancedViewOrganizationModalProps) {
  if (!organization) return null;

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={`${organization.name} logo`}
                className="w-16 h-16 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <DialogTitle className="text-2xl">{organization.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">{organization.code}</span>
                <Badge variant={getStatusVariant(organization.status)}>
                  {organization.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry Type</label>
                    <p className="capitalize">{organization.industry_type || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                    <p className="capitalize">{organization.business_type?.replace('_', ' ') || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employee Count</label>
                    <p>{organization.employee_count || "Not specified"}</p>
                  </div>
                  {organization.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p>{organization.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p>{formatDate(organization.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p>{formatDate(organization.updated_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
                    <p className="font-mono text-sm">{organization.id}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {organization.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p>{organization.email}</p>
                      </div>
                    </div>
                  )}
                  {organization.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p>{organization.phone}</p>
                      </div>
                    </div>
                  )}
                  {organization.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Website</label>
                        <a 
                          href={organization.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {organization.website}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Person */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Person</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {organization.contact_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p>{organization.contact_name}</p>
                    </div>
                  )}
                  {organization.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p>{organization.contact_email}</p>
                      </div>
                    </div>
                  )}
                  {organization.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p>{organization.contact_phone}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(organization.address || organization.city) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <div className="space-y-1">
                      {organization.address && <p>{organization.address}</p>}
                      <p>
                        {[organization.city, organization.state, organization.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {organization.country && <p>{organization.country}</p>}
                    </div>
                  </div>
                )}

                {(organization.latitude && organization.longitude) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-mono text-sm">
                        {organization.latitude.toFixed(6)}, {organization.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mock Map Preview */}
                {(organization.latitude && organization.longitude) && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Map Preview</label>
                    <div className="mt-2 h-64 bg-muted rounded-lg flex items-center justify-center border">
                      <div className="text-center">
                        <MapIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Map view for {organization.city || "location"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {organization.latitude.toFixed(6)}, {organization.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.admin_count || 0}</div>
                  <p className="text-xs text-muted-foreground">Admin users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.user_count || 0}</div>
                  <p className="text-xs text-muted-foreground">All users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Policies</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.policy_count || 0}</div>
                  <p className="text-xs text-muted-foreground">Active policies</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <div className="text-xs">$</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(organization.monthly_revenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Performance indicators and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Growth</span>
                    <span className="text-sm text-success">+12% this month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Policy Issuance</span>
                    <span className="text-sm text-success">+8% this month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <span className="text-sm text-success">+15% this month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm text-primary">4.7/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}