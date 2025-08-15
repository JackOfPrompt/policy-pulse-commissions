import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PolicyTenure {
  tenure_id: number;
  tenure_name: string;
  duration_value: number;
  duration_unit: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface CreateEditPolicyTenureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyTenure?: PolicyTenure | null;
  onSuccess: () => void;
}

export function CreateEditPolicyTenureModal({
  open,
  onOpenChange,
  policyTenure,
  onSuccess,
}: CreateEditPolicyTenureModalProps) {
  const [formData, setFormData] = useState({
    tenure_name: "",
    duration_value: 1,
    duration_unit: "Years",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (policyTenure) {
      setFormData({
        tenure_name: policyTenure.tenure_name,
        duration_value: policyTenure.duration_value,
        duration_unit: policyTenure.duration_unit,
        is_active: policyTenure.is_active,
      });
    } else {
      setFormData({
        tenure_name: "",
        duration_value: 1,
        duration_unit: "Years",
        is_active: true,
      });
    }
  }, [policyTenure, open]);

  const validateForm = () => {
    if (!formData.tenure_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Policy Tenure Name is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.tenure_name.length > 100) {
      toast({
        title: "Validation Error",
        description: "Policy Tenure Name must be 100 characters or less",
        variant: "destructive",
      });
      return false;
    }

    if (formData.duration_value < 1) {
      toast({
        title: "Validation Error",
        description: "Duration Value must be a positive number",
        variant: "destructive",
      });
      return false;
    }

    if (formData.duration_value > 1000) {
      toast({
        title: "Validation Error",
        description: "Duration Value must be 1000 or less",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (policyTenure) {
        // Update existing policy tenure
        const { error } = await (supabase as any)
          .from('master_policy_tenure')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('tenure_id', policyTenure.tenure_id);

        if (error) throw error;
      } else {
        // Create new policy tenure
        const { error } = await (supabase as any)
          .from('master_policy_tenure')
          .insert([formData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving policy tenure:', error);
      
      let errorMessage = "An error occurred while saving the policy tenure";
      if (error.code === '23505') {
        if (error.message.includes('tenure_name')) {
          errorMessage = "Policy Tenure Name already exists";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {policyTenure ? "Edit Policy Tenure" : "Add Policy Tenure"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenure_name">Policy Tenure Name *</Label>
            <Input
              id="tenure_name"
              value={formData.tenure_name}
              onChange={(e) =>
                setFormData({ ...formData, tenure_name: e.target.value })
              }
              placeholder="Enter policy tenure name (e.g., '1 Year', '5 Years')"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_value">Duration Value *</Label>
            <Input
              id="duration_value"
              type="number"
              min="1"
              max="1000"
              value={formData.duration_value}
              onChange={(e) =>
                setFormData({ ...formData, duration_value: parseInt(e.target.value) || 1 })
              }
              placeholder="Enter numeric value"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_unit">Duration Unit *</Label>
            <Select
              value={formData.duration_unit}
              onValueChange={(value) =>
                setFormData({ ...formData, duration_unit: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Years">Years</SelectItem>
                <SelectItem value="Months">Months</SelectItem>
                <SelectItem value="Days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active Status</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : policyTenure
                ? "Update Policy Tenure"
                : "Add Policy Tenure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}