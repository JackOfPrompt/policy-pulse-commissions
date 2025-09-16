import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Policy, PolicyFormData } from "@/hooks/usePolicies";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
  onSave: (id: string, data: Partial<PolicyFormData>) => Promise<{ success: boolean; error?: string }>;
}

export function EditPolicyModal({ open, onOpenChange, policy, onSave }: EditPolicyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PolicyFormData>>({});

  useEffect(() => {
    if (policy) {
      setFormData({
        policy_number: policy.policy_number,
        provider: policy.provider || "",
        plan_name: policy.plan_name || "",
        start_date: policy.start_date || "",
        end_date: policy.end_date || "",
        issue_date: policy.issue_date || "",
        premium_without_gst: policy.premium_without_gst || 0,
        gst: policy.gst || 0,
        premium_with_gst: policy.premium_with_gst || 0,
      });
    }
  }, [policy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;

    setLoading(true);
    try {
      const result = await onSave(policy.id, formData);
      if (result.success) {
        toast({
          title: "Success",
          description: "Policy updated successfully",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PolicyFormData, value: string | number) => {
    // Prevent undefined values
    if (value === "" && (field === 'premium_without_gst' || field === 'gst' || field === 'premium_with_gst')) {
      value = 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!policy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Policy</DialogTitle>
          <DialogDescription>
            Update policy information for {policy.policy_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policy_number">Policy Number *</Label>
              <Input
                id="policy_number"
                value={formData.policy_number || ""}
                onChange={(e) => handleInputChange("policy_number", e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={formData.provider || ""}
                onChange={(e) => handleInputChange("provider", e.target.value)}
                placeholder="Insurance provider name"
              />
            </div>

            <div>
              <Label htmlFor="plan_name">Plan Name</Label>
              <Input
                id="plan_name"
                value={formData.plan_name || ""}
                onChange={(e) => handleInputChange("plan_name", e.target.value)}
                placeholder="Insurance plan name"
              />
            </div>

            <div>
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date || ""}
                onChange={(e) => handleInputChange("issue_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ""}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="premium_without_gst">Premium (Without GST)</Label>
              <Input
                id="premium_without_gst"
                type="number"
                step="0.01"
                value={formData.premium_without_gst || ""}
                onChange={(e) => handleInputChange("premium_without_gst", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="gst">GST Amount</Label>
              <Input
                id="gst"
                type="number"
                step="0.01"
                value={formData.gst || ""}
                onChange={(e) => handleInputChange("gst", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="premium_with_gst">Total Premium (With GST)</Label>
              <Input
                id="premium_with_gst"
                type="number"
                step="0.01"
                value={formData.premium_with_gst || ""}
                onChange={(e) => handleInputChange("premium_with_gst", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}