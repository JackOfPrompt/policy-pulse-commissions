import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Branch {
  id: string;
  branch_name: string;
  region?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  address?: string;
  department?: string;
  sub_department?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ViewBranchModalProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewBranchModal({ branch, open, onOpenChange }: ViewBranchModalProps) {
  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Branch Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Branch Name</label>
              <p className="text-foreground font-medium">{branch.branch_name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Region</label>
              <p className="text-foreground">{branch.region || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">State</label>
              <p className="text-foreground">{branch.state || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">District</label>
              <p className="text-foreground">{branch.district || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">City</label>
              <p className="text-foreground">{branch.city || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pincode</label>
              <p className="text-foreground">{branch.pincode || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Landmark</label>
              <p className="text-foreground">{branch.landmark && branch.landmark !== 'NULL' ? branch.landmark : 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="text-foreground">{branch.address || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="text-foreground">{branch.department || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sub Department</label>
              <p className="text-foreground">{branch.sub_department || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                {branch.status}
              </Badge>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p className="text-foreground">{new Date(branch.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}