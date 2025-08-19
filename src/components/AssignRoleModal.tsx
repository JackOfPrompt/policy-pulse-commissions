import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRoles, Role, User } from '@/hooks/useRoles';

const assignRoleSchema = z.object({
  roles: z.array(z.object({
    role_id: z.number(),
    tenant_id: z.number(),
    branch_id: z.number().optional(),
    department_id: z.number().optional(),
  })).min(1, 'At least one role must be selected'),
});

type AssignRoleFormData = z.infer<typeof assignRoleSchema>;

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
  roles: Role[];
}

export const AssignRoleModal = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  roles
}: AssignRoleModalProps) => {
  const { assignRoleToUser } = useRoles();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Array<{
    role_id: number;
    tenant_id: number;
    branch_id?: number;
    department_id?: number;
  }>>([]);

  const form = useForm<AssignRoleFormData>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      roles: [],
    },
  });

  useEffect(() => {
    if (user?.user_roles) {
      const existingRoles = user.user_roles.map(ur => ({
        role_id: ur.role_id,
        tenant_id: ur.tenant_id || 1,
        branch_id: ur.branch_id,
        department_id: ur.department_id,
      }));
      setSelectedRoles(existingRoles);
      form.setValue('roles', existingRoles);
    }
  }, [user, form]);

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    let newSelectedRoles;
    
    if (checked) {
      newSelectedRoles = [...selectedRoles, { 
        role_id: roleId, 
        tenant_id: 1 // Default tenant for now
      }];
    } else {
      newSelectedRoles = selectedRoles.filter(r => r.role_id !== roleId);
    }
    
    setSelectedRoles(newSelectedRoles);
    form.setValue('roles', newSelectedRoles);
  };

  const onSubmit = async (data: AssignRoleFormData) => {
    try {
      setLoading(true);
      
      await assignRoleToUser(user.user_id, data.roles);
      
      toast({
        title: "Success",
        description: "Roles assigned successfully",
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeRoles = roles.filter(role => role.status === 'Active');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Roles to User</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="text-sm text-muted-foreground">User:</div>
          <div className="font-medium">
            {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'} ({user.email})
          </div>
          <Badge variant="outline" className="mt-1">{user.role}</Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="roles"
              render={() => (
                <FormItem>
                  <FormLabel>Available Roles</FormLabel>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {activeRoles.map((role) => {
                          const isSelected = selectedRoles.some(sr => sr.role_id === role.role_id);
                          
                          return (
                            <div key={role.role_id} className="space-y-2">
                              <div className="flex items-start space-x-3">
                                <Checkbox
                                  id={`role-${role.role_id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => 
                                    handleRoleToggle(role.role_id, checked as boolean)
                                  }
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`role-${role.role_id}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {role.role_name}
                                  </label>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {role.role_code}
                                  </div>
                                  {role.description && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {role.description}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {role.permission_count || 0} permissions
                                  </div>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <div className="ml-6 p-3 bg-muted rounded-md">
                                  <div className="text-xs font-medium mb-2">Scope (Optional)</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs text-muted-foreground">Branch</label>
                                      <Select>
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="All branches" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">All branches</SelectItem>
                                          <SelectItem value="1">Branch 1</SelectItem>
                                          <SelectItem value="2">Branch 2</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">Department</label>
                                      <Select>
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="All departments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">All departments</SelectItem>
                                          <SelectItem value="1">Sales</SelectItem>
                                          <SelectItem value="2">Operations</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Roles'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};