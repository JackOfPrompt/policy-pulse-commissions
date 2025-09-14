import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Employee } from "@/hooks/useEmployees";

interface ViewEmployeeModalProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewEmployeeModal({ employee, open, onOpenChange }: ViewEmployeeModalProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee Code</label>
                <p className="text-foreground">{employee.employee_code || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-foreground font-medium">{employee.name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">{employee.email || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-foreground">{employee.phone || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="text-foreground">{employee.dob ? new Date(employee.dob).toLocaleDateString() : 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="text-foreground capitalize">{employee.gender || 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Work Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Work Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Designation</label>
                <p className="text-foreground">{employee.designation || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="text-foreground">{employee.department || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Branch</label>
                <p className="text-foreground">{employee.branch_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Qualification</label>
                <p className="text-foreground">{employee.qualification || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                  {employee.status}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                <p className="text-foreground">{new Date(employee.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-foreground">{employee.address || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">City</label>
                <p className="text-foreground">{employee.city || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">State</label>
                <p className="text-foreground">{employee.state || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">District</label>
                <p className="text-foreground">{employee.district || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                <p className="text-foreground">{employee.pincode || 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bank Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Bank Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Holder Name</label>
                <p className="text-foreground">{employee.account_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                <p className="text-foreground">{employee.bank_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                <p className="text-foreground">{employee.account_number || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                <p className="text-foreground">{employee.ifsc_code || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                <p className="text-foreground capitalize">{employee.account_type || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}