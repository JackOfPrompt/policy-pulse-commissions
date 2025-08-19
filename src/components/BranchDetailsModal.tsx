import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Settings, MapPin, Users, Building2 } from 'lucide-react';

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

interface BranchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  onEdit: () => void;
  onAssignDepartments: () => void;
}

const BranchDetailsModal: React.FC<BranchDetailsModalProps> = ({
  isOpen,
  onClose,
  branch,
  onEdit,
  onAssignDepartments
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              {branch.branch_name}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" onClick={onAssignDepartments}>
                <Settings className="w-4 h-4 mr-1" />
                Assign Departments
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Branch Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Branch Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Branch ID</label>
                  <p className="text-sm font-semibold">{branch.branch_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={branch.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {branch.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {branch.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Address
                  </label>
                  <p className="text-sm mt-1">{branch.address}</p>
                </div>
              )}

              {branch.manager ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Branch Manager
                  </label>
                  <div className="mt-1">
                    <p className="text-sm font-medium">{branch.manager.name}</p>
                    <p className="text-xs text-muted-foreground">{branch.manager.email}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Branch Manager
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">No manager assigned</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="text-sm mt-1">{formatDate(branch.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Departments Assigned */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Assigned Departments</CardTitle>
              <Button size="sm" variant="outline" onClick={onAssignDepartments}>
                <Settings className="w-4 h-4 mr-1" />
                Manage
              </Button>
            </CardHeader>
            <CardContent>
              {branch.departments && branch.departments.length > 0 ? (
                <div className="space-y-2">
                  {branch.departments.map((dept) => (
                    <div
                      key={dept.dept_id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{dept.master_departments.department_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Code: {dept.master_departments.department_code}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ID: {dept.master_departments.department_id}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No departments assigned</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={onAssignDepartments}>
                    Assign Departments
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BranchDetailsModal;