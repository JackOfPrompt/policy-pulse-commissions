import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRoles, Role, Permission } from '@/hooks/useRoles';

const roleSchema = z.object({
  role_name: z.string().min(1, 'Role name is required'),
  role_code: z.string().min(1, 'Role code is required'),
  description: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  permissions: z.array(z.number()).min(1, 'At least one permission must be selected'),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface CreateEditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  role?: Role;
  permissions: Permission[];
}

export const CreateEditRoleModal = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  role,
  permissions
}: CreateEditRoleModalProps) => {
  const { createRole, updateRole } = useRoles();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role_name: '',
      role_code: '',
      description: '',
      status: 'Active',
      permissions: [],
    },
  });

  useEffect(() => {
    if (mode === 'edit' && role) {
      form.reset({
        role_name: role.role_name,
        role_code: role.role_code,
        description: role.description || '',
        status: role.status,
        permissions: role.permissions?.map(p => p.permission_id) || [],
      });
      setSelectedPermissions(role.permissions?.map(p => p.permission_id) || []);
    } else {
      form.reset({
        role_name: '',
        role_code: '',
        description: '',
        status: 'Active',
        permissions: [],
      });
      setSelectedPermissions([]);
    }
  }, [mode, role, form]);

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const newSelected = checked
      ? [...selectedPermissions, permissionId]
      : selectedPermissions.filter(id => id !== permissionId);
    
    setSelectedPermissions(newSelected);
    form.setValue('permissions', newSelected);
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      setLoading(true);
      
      if (mode === 'create') {
        await createRole(data);
        toast({
          title: "Success",
          description: "Role created successfully",
        });
      } else if (role) {
        await updateRole(role.role_id, data);
        toast({
          title: "Success", 
          description: "Role updated successfully",
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} role`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    const module = permission.module || 'General';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Role' : 'Edit Role'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter role description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <div className="space-y-4">
                    {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                      <Card key={module}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{module}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {modulePermissions.map((permission) => (
                              <div key={permission.permission_id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`permission-${permission.permission_id}`}
                                  checked={selectedPermissions.includes(permission.permission_id)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.permission_id, checked as boolean)
                                  }
                                />
                                <label
                                  htmlFor={`permission-${permission.permission_id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.permission_name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Update Role'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};