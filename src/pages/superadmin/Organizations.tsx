import { useState, useEffect } from "react";
import { Building2, Plus, Search, Eye, Users, UserPlus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EnhancedCreateOrganizationModal } from "@/components/superadmin/EnhancedCreateOrganizationModal";
import { EnhancedViewOrganizationModal } from "@/components/superadmin/EnhancedViewOrganizationModal";
import { EnhancedEditTenantModal } from "@/components/superadmin/EnhancedEditTenantModal";
import { ManageTenantAdminsModal } from "@/components/superadmin/ManageTenantAdminsModal";
import { DeleteTenantModal } from "@/components/superadmin/DeleteTenantModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Organization } from "@/types/organization";

type OrganizationWithAdmins = Organization & {
  tenant_admins: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  }>;
};

export default function Organizations() {
  const { user, profile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isManageAdminsModalOpen, setIsManageAdminsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user object in expected format
  const dashboardUser = profile ? {
    name: profile.full_name || 'Super Admin',
    email: profile.email || user?.email || '',
    role: profile.role,
    avatar: ''
  } : null;

  // Load organizations from Supabase
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Get basic organizations first
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Get admin counts for each organization separately
      const orgsWithAdminCounts = await Promise.all(
        orgsData?.map(async (org) => {
          const { count, error: countError } = await supabase
            .from('user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id)
            .eq('role', 'admin');

          if (countError) {
            console.error('Error loading admin count for org:', org.id, countError);
          }

          return {
            ...org,
            admin_count: count || 0,
            status: 'active'
          };
        }) || []
      );

      setOrganizations(orgsWithAdminCounts);
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

  // Filter organizations
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsViewModalOpen(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsEditModalOpen(true);
  };

  const handleDeleteOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsDeleteModalOpen(true);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Organization Management</h1>
            <p className="text-muted-foreground">
              Manage tenant organizations and their admin accounts ({filteredOrganizations.length} total)
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-primary hover:bg-gradient-primary-hover">
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Organizations</p>
                  <p className="text-2xl font-bold">{organizations.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tenant Admins</p>
                  <p className="text-2xl font-bold">{organizations.reduce((sum, org) => sum + (org.admin_count || 0), 0)}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Organizations</p>
                  <p className="text-2xl font-bold">{organizations.filter(org => org.status === 'active').length}</p>
                </div>
                <Badge className="h-8 w-8 rounded-full flex items-center justify-center">✓</Badge>
              </div>
            </CardContent>
          </Card>
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

        <EnhancedEditTenantModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          organization={selectedOrganization}
          onSuccess={loadOrganizations}
        />

        <DeleteTenantModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          organization={selectedOrganization}
          onSuccess={loadOrganizations}
        />

        <ManageTenantAdminsModal
          open={isManageAdminsModalOpen}
          onOpenChange={setIsManageAdminsModalOpen}
          organization={selectedOrganization}
          onSuccess={loadOrganizations}
        />

        {/* Organizations List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Organization Directory</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[300px]"
                />
              </div>
            </div>
            <CardDescription>
              Manage tenant organizations and their admin accounts • {filteredOrganizations.length} organizations found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tenant Admins</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id} className="hover:bg-muted/50 transition-colors">
                     <TableCell>
                       <div className="flex items-center space-x-3">
                         {org.logo_url ? (
                           <img
                             src={org.logo_url}
                             alt={`${org.name} logo`}
                             className="w-10 h-10 object-cover rounded-lg border"
                           />
                         ) : (
                           <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                             <Building2 className="h-5 w-5 text-primary" />
                           </div>
                         )}
                         <div>
                           <p className="font-medium">{org.name}</p>
                           <p className="text-sm text-muted-foreground">
                             {org.email || `ID: ${org.id.slice(0, 8)}...`}
                           </p>
                         </div>
                       </div>
                     </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">{org.code}</code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {org.city && org.state ? `${org.city}, ${org.state}` : 
                         org.city || org.state || 'Not specified'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={org.admin_count > 0 ? "default" : "secondary"}>
                          <Users className="h-3 w-3 mr-1" />
                          {org.admin_count || 0} Admin{org.admin_count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                        {org.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                     <TableCell className="text-right">
                       <div className="flex items-center justify-end space-x-1">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => handleViewOrganization(org)}
                           title="View Organization Details"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => handleEditOrganization(org)}
                           title="Edit Organization"
                         >
                           <Edit2 className="h-4 w-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => handleManageAdmins(org)}
                           title="Manage Admins"
                         >
                           <UserPlus className="h-4 w-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => handleDeleteOrganization(org)}
                           title="Delete Organization"
                           className="text-destructive hover:text-destructive"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
                {filteredOrganizations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No organizations match your search' : 'No organizations registered yet'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}