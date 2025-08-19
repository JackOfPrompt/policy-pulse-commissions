import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MasterDepartment {
  department_id: number;
  department_name: string;
  department_code: string;
  description: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
  departments?: Array<{
    dept_id: number;
  }>;
}

interface AssignDepartmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branch: Branch;
}

const AssignDepartmentsModal: React.FC<AssignDepartmentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  branch
}) => {
  const [masterDepartments, setMasterDepartments] = useState<MasterDepartment[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchMasterDepartments();
      const currentDeptIds = branch.departments?.map(d => d.dept_id) || [];
      setSelectedDepartments(currentDeptIds);
    }
  }, [isOpen, branch]);

  const fetchMasterDepartments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('system-master-departments', {
        method: 'GET'
      });

      if (error) throw error;
      setMasterDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching master departments:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke(
        `tenant-branches/${branch.branch_id}/departments`,
        {
          method: 'POST',
          body: { dept_ids: selectedDepartments }
        }
      );

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Departments assigned successfully",
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Failed to assign departments');
      }
    } catch (error) {
      console.error('Error assigning departments:', error);
      toast({
        title: "Error",
        description: "Failed to assign departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentToggle = (departmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedDepartments([...selectedDepartments, departmentId]);
    } else {
      setSelectedDepartments(selectedDepartments.filter(id => id !== departmentId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Assign Departments to {branch.branch_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the departments to assign to this branch:
          </p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-4">
            {masterDepartments.map((dept) => (
              <div key={dept.department_id} className="flex items-start space-x-3">
                <Checkbox
                  id={`dept-${dept.department_id}`}
                  checked={selectedDepartments.includes(dept.department_id)}
                  onCheckedChange={(checked) => {
                    handleDepartmentToggle(dept.department_id, checked as boolean);
                  }}
                />
                <Label 
                  htmlFor={`dept-${dept.department_id}`} 
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  <div>
                    <div className="font-medium">{dept.department_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Code: {dept.department_code}
                      {dept.description && ` • ${dept.description}`}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>

          {masterDepartments.length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">No departments available</p>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedDepartments.length} department(s) selected
            </p>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Departments'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDepartmentsModal;