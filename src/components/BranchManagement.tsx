import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit, Trash2, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Branch {
  branch_id: number;
  branch_name: string;
  address: string;
  status: string;
  created_at: string;
  manager?: {
    employee_id: number;
    name: string;
    email: string;
  };
  departments?: Array<{
    dept_id: number;
    master_departments: {
      department_id: number;
      department_name: string;
      department_code: string;
    };
  }>;
}

interface Employee {
  employee_id: number;
  name: string;
  email: string;
}

interface MasterDepartment {
  department_id: number;
  department_name: string;
  department_code: string;
  description: string;
}

const BranchManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [masterDepartments, setMasterDepartments] = useState<MasterDepartment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    manager_id: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
    fetchMasterDepartments();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('tenant-branches', {
        method: 'GET'
      });

      if (error) throw error;
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        method: 'GET'
      });

      if (error) throw error;
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMasterDepartments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('master-departments-list', {
        method: 'GET'
      });

      if (error) throw error;
      setMasterDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching master departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = selectedBranch ? 'PUT' : 'POST';
      const url = selectedBranch ? `tenant-branches/${selectedBranch.branch_id}` : 'tenant-branches';
      
      const { data, error } = await supabase.functions.invoke(url, {
        method,
        body: {
          ...formData,
          manager_id: formData.manager_id ? parseInt(formData.manager_id) : null
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Branch ${selectedBranch ? 'updated' : 'created'} successfully`,
      });

      setShowCreateDialog(false);
      setSelectedBranch(null);
      setFormData({ branch_name: '', address: '', manager_id: '', status: 'ACTIVE' });
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast({
        title: "Error",
        description: "Failed to save branch",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (branchId: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      const { error } = await supabase.functions.invoke(`tenant-branches/${branchId}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Branch deleted successfully",
      });

      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      });
    }
  };

  const handleAssignDepartments = async () => {
    if (!selectedBranch) return;

    try {
      const { error } = await supabase.functions.invoke(
        `tenant-branches/${selectedBranch.branch_id}/departments`,
        {
          method: 'POST',
          body: { dept_ids: selectedDepartments }
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Departments assigned successfully",
      });

      setShowAssignDialog(false);
      setSelectedBranch(null);
      setSelectedDepartments([]);
      fetchBranches();
    } catch (error) {
      console.error('Error assigning departments:', error);
      toast({
        title: "Error",
        description: "Failed to assign departments",
        variant: "destructive",
      });
    }
  };

  const openAssignDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    const currentDeptIds = branch.departments?.map(d => d.dept_id) || [];
    setSelectedDepartments(currentDeptIds);
    setShowAssignDialog(true);
  };

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      branch_name: branch.branch_name,
      address: branch.address || '',
      manager_id: branch.manager?.employee_id?.toString() || '',
      status: branch.status
    });
    setShowCreateDialog(true);
  };

  const filteredBranches = branches.filter(branch =>
    branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Branch Management</h2>
          <p className="text-muted-foreground">Manage your organization's branches</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-background">
            <DialogHeader>
              <DialogTitle>{selectedBranch ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="branch_name">Branch Name</Label>
                <Input
                  id="branch_name"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="manager_id">Branch Manager</Label>
                <Select value={formData.manager_id} onValueChange={(value) => setFormData({ ...formData, manager_id: value })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                   <SelectContent className="bg-background border shadow-md z-50">
                     <SelectItem value="none">No manager assigned</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.employee_id} value={employee.employee_id.toString()}>
                        {employee.name} ({employee.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedBranch(null);
                  setFormData({ branch_name: '', address: '', manager_id: '', status: 'ACTIVE' });
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedBranch ? 'Update' : 'Create'} Branch
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search branches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBranches.map((branch) => (
          <Card key={branch.branch_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                {branch.branch_name}
              </CardTitle>
              <Badge variant={branch.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {branch.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {branch.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm text-muted-foreground">{branch.address}</span>
                </div>
              )}
              
              {branch.manager && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Manager: {branch.manager.name}
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Assigned Departments:</p>
                <div className="flex flex-wrap gap-1">
                  {branch.departments && branch.departments.length > 0 ? (
                    branch.departments.map((dept) => (
                      <Badge key={dept.dept_id} variant="outline" className="text-xs">
                        {dept.master_departments.department_code}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No departments assigned</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAssignDialog(branch)}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Assign Depts
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(branch)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(branch.branch_id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Departments Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle>Assign Departments to {selectedBranch?.branch_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the departments to assign to this branch:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {masterDepartments.map((dept) => (
                <div key={dept.department_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${dept.department_id}`}
                    checked={selectedDepartments.includes(dept.department_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDepartments([...selectedDepartments, dept.department_id]);
                      } else {
                        setSelectedDepartments(selectedDepartments.filter(id => id !== dept.department_id));
                      }
                    }}
                  />
                  <Label htmlFor={`dept-${dept.department_id}`} className="text-sm font-normal">
                    <span className="font-medium">{dept.department_code}</span> - {dept.department_name}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAssignDialog(false);
                setSelectedBranch(null);
                setSelectedDepartments([]);
              }}>
                Cancel
              </Button>
              <Button onClick={handleAssignDepartments}>
                Assign Departments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchManagement;