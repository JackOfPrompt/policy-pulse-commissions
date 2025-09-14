import { useState } from 'react';
import { Building2, Eye, Edit2, Trash2, Plus } from 'lucide-react';
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
import { EnhancedCreateOrganizationModal } from './EnhancedCreateOrganizationModal';
import { EnhancedEditTenantModal } from './EnhancedEditTenantModal';
import { EnhancedViewOrganizationModal } from './EnhancedViewOrganizationModal';
import { DeleteTenantModal } from './DeleteTenantModal';
import { Organization } from '@/types/organization';

interface TenantManagementTableProps {
  organizations: Organization[];
  loading: boolean;
  onRefresh: () => void;
}

export function TenantManagementTable({ organizations, loading, onRefresh }: TenantManagementTableProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const handleView = (org: Organization) => {
    setSelectedOrg(org);
    setViewModalOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setEditModalOpen(true);
  };

  const handleDelete = (org: Organization) => {
    setSelectedOrg(org);
    setDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedOrg(null);
    onRefresh();
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
                <Building2 className="h-5 w-5 text-primary" />
                Tenant Organizations
              </CardTitle>
              <CardDescription>
                Manage all tenant organizations with complete CRUD operations and logo management
              </CardDescription>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Organizations</h3>
              <p className="text-sm text-muted-foreground mb-4">Get started by creating your first tenant organization</p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Tenant
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
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
                            <div className="font-medium">{org.name}</div>
                            {org.email && (
                              <div className="text-sm text-muted-foreground">{org.email}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">{org.code}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.city && org.state ? `${org.city}, ${org.state}` : org.city || org.state || 'N/A'}
                          {org.country && (
                            <div className="text-xs text-muted-foreground">{org.country}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                          {org.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(org.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(org)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(org)}
                            title="Edit Organization"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(org)}
                            title="Delete Organization"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <EnhancedCreateOrganizationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleModalClose}
      />

        <EnhancedEditTenantModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          organization={selectedOrg}
          onSuccess={handleModalClose}
        />

        <EnhancedViewOrganizationModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          organization={selectedOrg}
        />

        <DeleteTenantModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          organization={selectedOrg}
          onSuccess={handleModalClose}
        />
    </>
  );
}