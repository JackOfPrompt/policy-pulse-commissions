import { useState, useEffect } from "react";
import { Building2, Users, Shield, Activity, HardDrive, Zap, MoreHorizontal, Edit, Eye, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EnhancedCreateOrganizationModal } from "@/components/superadmin/EnhancedCreateOrganizationModal";
import { EnhancedViewOrganizationModal } from "@/components/superadmin/EnhancedViewOrganizationModal";
import { EnhancedEditTenantModal } from "@/components/superadmin/EnhancedEditTenantModal";
import { ManageTenantAdminsModal } from "@/components/superadmin/ManageTenantAdminsModal";
import { TenantAdminManagement } from "@/components/superadmin/TenantAdminManagement";
import { OrganizationLogoManagement } from "@/components/layout/OrganizationLogoManagement";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Organization = {
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
  storage_used?: string;
  api_calls_month?: number;
};

export default function TenantManagement() {
  const { user, profile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageAdminsModalOpen, setIsManageAdminsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // Create user object in expected format
  const dashboardUser = profile ? {
    name: profile.full_name || 'Super Admin',
    email: profile.email || user?.email || '',
    role: profile.role,
    avatar: ''
  } : null;

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Get organizations with enhanced data
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*, logo_url, latitude, longitude, contact_name, contact_email, contact_phone')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

  // Get enhanced data for each organization  
      const orgsWithStats = await Promise.all(
        orgsData?.map(async (org: any) => {
          // Get admin count
          const { count: adminCount } = await supabase
            .from('user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id)
            .eq('role', 'admin');

          // Get total user count
          const { count: userCount } = await supabase
            .from('user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);

          // Get policy count
          const { count: policyCount } = await supabase
            .from('policies')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);

          return {
            ...org,
            admin_count: adminCount || 0,
            user_count: userCount || 0,
            policy_count: policyCount || 0,
            monthly_revenue: Math.floor(Math.random() * 10000) + 1000, // Mock revenue
            storage_used: `${Math.floor(Math.random() * 100)}GB`, // Mock storage
            api_calls_month: Math.floor(Math.random() * 100000) + 1000, // Mock API calls
          };
        }) || []
      );

      setOrganizations(orgsWithStats);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'trial': return 'info';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredOrganizations = organizations.filter((org) => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeTenants = organizations.filter(t => t.status === 'active');
  const totalRevenue = organizations.reduce((sum, org) => sum + (org.monthly_revenue || 0), 0);
  const totalUsers = organizations.reduce((sum, org) => sum + (org.user_count || 0), 0);
  const totalPolicies = organizations.reduce((sum, org) => sum + (org.policy_count || 0), 0);

  const handleViewOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsViewModalOpen(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsEditModalOpen(true);
  };

  const handleManageAdmins = (org: Organization) => {
    setSelectedOrganization(org);
    setIsManageAdminsModalOpen(true);
  };

  if (loading || !dashboardUser) {
    return (
      <DashboardLayout role="superadmin" user={dashboardUser}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="superadmin" user={dashboardUser}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage tenant organizations and their resources ({filteredOrganizations.length} tenants)
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px]"
              />
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-primary hover:bg-gradient-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </div>
        </div>

        <EnhancedCreateOrganizationModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={loadOrganizations}
        />

        <EnhancedViewOrganizationModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          organization={selectedOrganization}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Tenants
              </CardTitle>
              <Building2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenants.length}</div>
              <p className="text-xs text-muted-foreground">
                Out of {organizations.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Across all tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Policies
              </CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPolicies.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Active policies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <Activity className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total recurring
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resource Usage</TabsTrigger>
            <TabsTrigger value="admins">Admin Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Overview</CardTitle>
                <CardDescription>
                  Complete tenant directory with status and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Policies</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((tenant) => (
                      <TableRow key={tenant.id}>
                         <TableCell>
                           <div className="flex items-center space-x-3">
                             <OrganizationLogoManagement
                               organizationId={tenant.id}
                               currentLogoUrl={tenant.logo_url}
                               organizationName={tenant.name}
                               onLogoUpdate={(newUrl) => {
                                 setOrganizations(prev => 
                                   prev.map(org => 
                                     org.id === tenant.id ? { ...org, logo_url: newUrl } : org
                                   )
                                 );
                               }}
                               size="sm"
                               readonly={false}
                             />
                             <div className="space-y-1">
                               <p className="font-medium">{tenant.name}</p>
                               <p className="text-sm text-muted-foreground">{tenant.code}</p>
                               {tenant.city && tenant.state && (
                                 <p className="text-xs text-muted-foreground">{tenant.city}, {tenant.state}</p>
                               )}
                             </div>
                           </div>
                         </TableCell>
                        <TableCell>
                          <StatusChip variant={getStatusVariant(tenant.status)}>
                            {tenant.status}
                          </StatusChip>
                        </TableCell>
                        <TableCell>{tenant.user_count}</TableCell>
                        <TableCell>{tenant.policy_count?.toLocaleString() || 0}</TableCell>
                        <TableCell className="font-medium">
                          ${tenant.monthly_revenue}
                        </TableCell>
                        <TableCell>
                          {formatDate(tenant.updated_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewOrganization(tenant)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditOrganization(tenant)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Organization
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManageAdmins(tenant)}>
                                <Users className="mr-2 h-4 w-4" />
                                Manage Admins
                              </DropdownMenuItem>
                              {tenant.status === 'active' ? (
                                <DropdownMenuItem className="text-destructive">
                                  Suspend Tenant
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-success">
                                  Reactivate Tenant
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrganizations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No organizations match your search' : 'No organizations found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>
                  Monitor storage, API usage, and system resources per tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Storage Used</TableHead>
                      <TableHead>API Calls (Month)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{tenant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.storage_used}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.api_calls_month?.toLocaleString() || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusChip variant={getStatusVariant(tenant.status)}>
                            {tenant.status}
                          </StatusChip>
                        </TableCell>
                        <TableCell>
                          {formatDate(tenant.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrganizations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No organizations match your search' : 'No organizations found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            <TenantAdminManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Settings</CardTitle>
                <CardDescription>
                  Feature access and customization settings per tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Custom Branding</TableHead>
                      <TableHead>API Access</TableHead>
                      <TableHead>White Label</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <span className="font-medium">{tenant.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={Math.random() > 0.5 ? "default" : "secondary"}>
                            {Math.random() > 0.5 ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={Math.random() > 0.5 ? "default" : "secondary"}>
                            {Math.random() > 0.5 ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={Math.random() > 0.5 ? "default" : "secondary"}>
                            {Math.random() > 0.5 ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusChip variant={getStatusVariant(tenant.status)}>
                            {tenant.status}
                          </StatusChip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrganizations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No organizations match your search' : 'No organizations found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <EnhancedCreateOrganizationModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={loadOrganizations}
        />

        <EnhancedViewOrganizationModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          organization={selectedOrganization}
        />

        <EnhancedEditTenantModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          organization={selectedOrganization}
          onSuccess={loadOrganizations}
        />

        <ManageTenantAdminsModal
          open={isManageAdminsModalOpen}
          onOpenChange={setIsManageAdminsModalOpen}
          organization={selectedOrganization}
          onSuccess={loadOrganizations}
        />
      </div>
    </DashboardLayout>
  );
}