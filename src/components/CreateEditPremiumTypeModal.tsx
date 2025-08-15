import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PremiumType {
  premium_type_id: number;
  premium_type_name: string;
  premium_type_code: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface CreateEditPremiumTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premiumType?: PremiumType | null;
  onSuccess: () => void;
}

export function CreateEditPremiumTypeModal({
  open,
  onOpenChange,
  premiumType,
  onSuccess,
}: CreateEditPremiumTypeModalProps) {
  const [formData, setFormData] = useState({
    premium_type_code: "",
    premium_type_name: "",
    description: "",
    status: "Active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (premiumType) {
      setFormData({
        premium_type_code: premiumType.premium_type_code,
        premium_type_name: premiumType.premium_type_name,
        description: premiumType.description || "",
        status: premiumType.status,
      });
    } else {
      setFormData({
        premium_type_code: "",
        premium_type_name: "",
        description: "",
        status: "Active",
      });
    }
  }, [premiumType, open]);

  const validateForm = () => {
    if (!formData.premium_type_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Premium Type Code is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.premium_type_code.length > 10) {
      toast({
        title: "Validation Error",
        description: "Premium Type Code must be 10 characters or less",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[A-Z0-9]+$/.test(formData.premium_type_code)) {
      toast({
        title: "Validation Error",
        description: "Premium Type Code must be uppercase alphanumeric only",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.premium_type_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Premium Type Name is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.premium_type_name.length > 100) {
      toast({
        title: "Validation Error",
        description: "Premium Type Name must be 100 characters or less",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[A-Za-z\s\-]+$/.test(formData.premium_type_name)) {
      toast({
        title: "Validation Error",
        description: "Premium Type Name can only contain letters, spaces, and hyphens",
        variant: "destructive",
      });
      return false;
    }

    if (formData.description && formData.description.length > 250) {
      toast({
        title: "Validation Error",
        description: "Description must be 250 characters or less",
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
      if (premiumType) {
        // Update existing premium type
        const { error } = await (supabase as any)
          .from('master_premium_types')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('premium_type_id', premiumType.premium_type_id);

        if (error) throw error;
      } else {
        // Create new premium type
        const { error } = await (supabase as any)
          .from('master_premium_types')
          .insert([formData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving premium type:', error);
      
      let errorMessage = "An error occurred while saving the premium type";
      if (error.code === '23505') {
        if (error.message.includes('premium_type_code')) {
          errorMessage = "Premium Type Code already exists";
        } else if (error.message.includes('premium_type_name')) {
          errorMessage = "Premium Type Name already exists";
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
            {premiumType ? "Edit Premium Type" : "Add Premium Type"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="premium_type_code">Premium Type Code *</Label>
            <Input
              id="premium_type_code"
              value={formData.premium_type_code}
              onChange={(e) =>
                setFormData({ ...formData, premium_type_code: e.target.value.toUpperCase() })
              }
              placeholder="Enter premium type code (max 10 chars)"
              maxLength={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="premium_type_name">Premium Type Name *</Label>
            <Input
              id="premium_type_name"
              value={formData.premium_type_name}
              onChange={(e) =>
                setFormData({ ...formData, premium_type_name: e.target.value })
              }
              placeholder="Enter premium type name (max 100 chars)"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter description (max 250 chars)"
              maxLength={250}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/250
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                : premiumType
                ? "Update Premium Type"
                : "Add Premium Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}