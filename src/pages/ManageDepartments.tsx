import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Pencil, Eye, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  department_id: number;
  department_name: string;
  department_code: string;
  tenant_id: number | null;
  branch_id: number | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  tenant_id: number;
}

const departmentSchema = z.object({
  department_name: z.string().min(1, 'Department name is required'),
  department_code: z.string().min(1, 'Department code is required'),
  tenant_id: z.number().min(1, 'Tenant is required'),
  branch_id: z.number().optional(),
  description: z.string().optional(),
  status: z.string().default('Active'),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

const ManageDepartments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      department_name: '',
      department_code: '',
      tenant_id: undefined,
      branch_id: undefined,
      description: '',
      status: 'Active',
    },
  });

  // Fetch departments
  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('departments', {
        method: 'GET'
      });
      
      if (error) throw error;
      return data as Department[];
    }
  });

  // Mock data for tenants and branches (replace with actual API calls)
  const mockTenants: Tenant[] = [
    { id: '1', name: 'Tenant A' },
    { id: '2', name: 'Tenant B' },
    { id: '3', name: 'Tenant C' },
  ];

  const mockBranches: Branch[] = [
    { id: 1, name: 'Main Branch', tenant_id: 1 },
    { id: 2, name: 'Secondary Branch', tenant_id: 1 },
    { id: 3, name: 'Regional Office', tenant_id: 2 },
  ];

  // Create department mutation
  const createMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      const { data: result, error } = await supabase.functions.invoke('departments', {
        method: 'POST',
        body: data
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Department created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create department",
        variant: "destructive",
      });
    }
  });

  // Update department mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DepartmentFormData }) => {
      const { data: result, error } = await supabase.functions.invoke('departments', {
        method: 'PUT',
        body: { ...data, id }
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingDepartment(null);
      form.reset();
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update department",
        variant: "destructive",
      });
    }
  });

  const handleCreate = (data: DepartmentFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: DepartmentFormData) => {
    if (editingDepartment) {
      updateMutation.mutate({
        id: editingDepartment.department_id,
        data
      });
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    form.reset({
      department_name: department.department_name,
      department_code: department.department_code,
      tenant_id: department.tenant_id || undefined,
      branch_id: department.branch_id || undefined,
      description: department.description || '',
      status: department.status
    });
  };

  const filteredDepartments = departments?.filter(dept => {
    const matchesSearch = dept.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dept.department_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
    const matchesTenant = tenantFilter === 'all' || dept.tenant_id?.toString() === tenantFilter;
    return matchesSearch && matchesStatus && matchesTenant;
  }) || [];

  const DepartmentForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(isEdit ? handleUpdate : handleCreate)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Finance" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="department_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., FIN" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tenant_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant *</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="branch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch (optional)" />
                    </SelectTrigger>
                  </FormControl>
                   <SelectContent>
                     <SelectItem value="none">No Branch</SelectItem>
                    {mockBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Textarea placeholder="Department description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Status</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  Enable to activate this department
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === 'Active'}
                  onCheckedChange={(checked) => field.onChange(checked ? 'Active' : 'Inactive')}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              if (isEdit) {
                setEditingDepartment(null);
              } else {
                setIsCreateOpen(false);
              }
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? 'Update' : 'Create'} Department
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton to="/admin-dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Departments</h1>
            <p className="text-muted-foreground">Create and manage organizational departments</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Department Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {mockTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Department</DialogTitle>
                  </DialogHeader>
                  <DepartmentForm />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Departments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Departments ({filteredDepartments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading departments...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((department) => (
                    <TableRow key={department.department_id}>
                      <TableCell className="font-medium">{department.department_name}</TableCell>
                      <TableCell>{department.department_code}</TableCell>
                      <TableCell>
                        {department.tenant_id ? 
                          mockTenants.find(t => t.id === department.tenant_id?.toString())?.name || 'Unknown' 
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {department.branch_id ? 
                          mockBranches.find(b => b.id === department.branch_id)?.name || 'Unknown'
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={department.status === 'Active' ? 'default' : 'secondary'}>
                          {department.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(department.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDepartment(department)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(department)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingDepartment} onOpenChange={() => setEditingDepartment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <DepartmentForm isEdit />
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewingDepartment} onOpenChange={() => setViewingDepartment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Department Details</DialogTitle>
            </DialogHeader>
            {viewingDepartment && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department Name</Label>
                    <p className="text-sm font-medium">{viewingDepartment.department_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department Code</Label>
                    <p className="text-sm font-medium">{viewingDepartment.department_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tenant</Label>
                    <p className="text-sm">
                      {viewingDepartment.tenant_id ? 
                        mockTenants.find(t => t.id === viewingDepartment.tenant_id?.toString())?.name || 'Unknown'
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Branch</Label>
                    <p className="text-sm">
                      {viewingDepartment.branch_id ? 
                        mockBranches.find(b => b.id === viewingDepartment.branch_id)?.name || 'Unknown'
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={viewingDepartment.status === 'Active' ? 'default' : 'secondary'}>
                      {viewingDepartment.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p className="text-sm">{new Date(viewingDepartment.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
                    <p className="text-sm">{new Date(viewingDepartment.updated_at).toLocaleString()}</p>
                  </div>
                </div>
                {viewingDepartment.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingDepartment.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageDepartments;