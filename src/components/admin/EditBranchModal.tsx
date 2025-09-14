import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

interface EditBranchModalProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EditBranchModal({ branch, open, onOpenChange, onUpdate }: EditBranchModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branch_name: '',
    region: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    landmark: '',
    address: '',
    department: '',
    sub_department: '',
    status: 'active'
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        branch_name: branch.branch_name || '',
        region: branch.region || '',
        state: branch.state || '',
        district: branch.district || '',
        city: branch.city || '',
        pincode: branch.pincode || '',
        landmark: branch.landmark && branch.landmark !== 'NULL' ? branch.landmark : '',
        address: branch.address || '',
        department: branch.department || '',
        sub_department: branch.sub_department || '',
        status: branch.status || 'active'
      });
    }
  }, [branch]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('branches')
        .update({
          branch_name: formData.branch_name,
          region: formData.region || null,
          state: formData.state || null,
          district: formData.district || null,
          city: formData.city || null,
          pincode: formData.pincode || null,
          landmark: formData.landmark || null,
          address: formData.address || null,
          department: formData.department || null,
          sub_department: formData.sub_department || null,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', branch.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Branch updated successfully",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating branch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="branch_name">Branch Name *</Label>
              <Input
                id="branch_name"
                value={formData.branch_name}
                onChange={(e) => handleInputChange('branch_name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="sub_department">Sub Department</Label>
              <Input
                id="sub_department"
                value={formData.sub_department}
                onChange={(e) => handleInputChange('sub_department', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Full address"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}