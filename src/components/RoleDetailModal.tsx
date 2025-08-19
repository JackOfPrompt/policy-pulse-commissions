import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRoles, Role } from '@/hooks/useRoles';

interface RoleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

export const RoleDetailModal = ({
  isOpen,
  onClose,
  role
}: RoleDetailModalProps) => {
  const { getRoleDetail } = useRoles();
  const [roleDetail, setRoleDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && role) {
      fetchRoleDetail();
    }
  }, [isOpen, role]);

  const fetchRoleDetail = async () => {
    try {
      setLoading(true);
      const data = await getRoleDetail(role.role_id);
      if (data?.success) {
        setRoleDetail(data.data);
      }
    } catch (error) {
      console.error('Error fetching role detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Role Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role Name</label>
                  <div className="mt-1">{role.role_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role Code</label>
                  <div className="mt-1">{role.role_code}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={role.status === 'Active' ? 'default' : 'secondary'}>
                      {role.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                  <div className="mt-1">{formatDate(role.created_at)}</div>
                </div>
                {role.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <div className="mt-1">{role.description}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Permissions and Users */}
          <Tabs defaultValue="permissions">
            <TabsList>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="users">Assigned Users</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assigned Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">Loading permissions...</div>
                    </div>
                  ) : role.permissions && role.permissions.length > 0 ? (
                    <div className="space-y-4">
                      {/* Group permissions by module */}
                      {Object.entries(
                        role.permissions.reduce((acc, permission) => {
                          const module = permission.module || 'General';
                          if (!acc[module]) {
                            acc[module] = [];
                          }
                          acc[module].push(permission);
                          return acc;
                        }, {} as Record<string, any[]>)
                      ).map(([module, permissions]) => (
                        <div key={module}>
                          <h4 className="font-medium mb-2">{module}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {permissions.map((permission) => (
                              <div key={permission.permission_id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                                <div>
                                  <div className="text-sm font-medium">{permission.permission_name}</div>
                                  <div className="text-xs text-muted-foreground">{permission.permission_code}</div>
                                  {permission.description && (
                                    <div className="text-xs text-muted-foreground mt-1">{permission.description}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">No permissions assigned</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Users with this Role</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">Loading users...</div>
                    </div>
                  ) : roleDetail?.assigned_users && roleDetail.assigned_users.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Assigned Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleDetail.assigned_users.map((user: any) => (
                          <TableRow key={user.user_id}>
                            <TableCell className="font-medium">
                              {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.branch_name || 'All'}</TableCell>
                            <TableCell>{user.department_name || 'All'}</TableCell>
                            <TableCell>{formatDate(user.assigned_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">No users assigned to this role</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};