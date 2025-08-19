import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  employee_id: number;
  name: string;
  email: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
  address: string;
  status: string;
  manager?: {
    employee_id: number;
    name: string;
    email: string;
  };
}

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  branch?: Branch;
}

const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  branch
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    manager_id: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      if (mode === 'edit' && branch) {
        setFormData({
          branch_name: branch.branch_name,
          address: branch.address || '',
          manager_id: branch.manager?.employee_id?.toString() || '',
          status: branch.status
        });
      } else {
        setFormData({
          branch_name: '',
          address: '',
          manager_id: '',
          status: 'ACTIVE'
        });
      }
    }
  }, [isOpen, mode, branch]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const url = mode === 'edit' ? `tenant-branches/${branch?.branch_id}` : 'tenant-branches';
      
      const { data, error } = await supabase.functions.invoke(url, {
        method,
        body: {
          ...formData,
          manager_id: formData.manager_id ? parseInt(formData.manager_id) : null
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || `Branch ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Failed to save branch');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      toast({
        title: "Error",
        description: "Failed to save branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="branch_name">Branch Name *</Label>
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
              placeholder="Enter branch address (optional)"
            />
          </div>
          
          <div>
            <Label htmlFor="manager_id">Branch Manager</Label>
            <Select 
              value={formData.manager_id} 
              onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a manager (optional)" />
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
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (mode === 'edit' ? 'Update Branch' : 'Create Branch')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BranchFormModal;