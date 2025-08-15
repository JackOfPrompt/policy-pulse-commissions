import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PremiumTerm {
  premium_term_id: number;
  premium_term_name: string;
  premium_term_code: string;
  term_duration_years: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface CreateEditPremiumTermModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premiumTerm?: PremiumTerm | null;
  onSuccess: () => void;
}

export function CreateEditPremiumTermModal({
  open,
  onOpenChange,
  premiumTerm,
  onSuccess,
}: CreateEditPremiumTermModalProps) {
  const [formData, setFormData] = useState({
    premium_term_code: "",
    premium_term_name: "",
    term_duration_years: 1,
    description: "",
    status: "Active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (premiumTerm) {
      setFormData({
        premium_term_code: premiumTerm.premium_term_code,
        premium_term_name: premiumTerm.premium_term_name,
        term_duration_years: premiumTerm.term_duration_years,
        description: premiumTerm.description || "",
        status: premiumTerm.status,
      });
    } else {
      setFormData({
        premium_term_code: "",
        premium_term_name: "",
        term_duration_years: 1,
        description: "",
        status: "Active",
      });
    }
  }, [premiumTerm, open]);

  const validateForm = () => {
    if (!formData.premium_term_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Premium Term Code is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.premium_term_code.length > 10) {
      toast({
        title: "Validation Error",
        description: "Premium Term Code must be 10 characters or less",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[A-Z0-9]+$/.test(formData.premium_term_code)) {
      toast({
        title: "Validation Error",
        description: "Premium Term Code must be uppercase alphanumeric only",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.premium_term_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Premium Term Name is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.premium_term_name.length > 50) {
      toast({
        title: "Validation Error",
        description: "Premium Term Name must be 50 characters or less",
        variant: "destructive",
      });
      return false;
    }

    if (formData.term_duration_years < 1) {
      toast({
        title: "Validation Error",
        description: "Term Duration must be a positive number",
        variant: "destructive",
      });
      return false;
    }

    if (formData.description && formData.description.length > 255) {
      toast({
        title: "Validation Error",
        description: "Description must be 255 characters or less",
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
      if (premiumTerm) {
        // Update existing premium term
        const { error } = await (supabase as any)
          .from('master_premium_terms')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('premium_term_id', premiumTerm.premium_term_id);

        if (error) throw error;
      } else {
        // Create new premium term
        const { error } = await (supabase as any)
          .from('master_premium_terms')
          .insert([formData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving premium term:', error);
      
      let errorMessage = "An error occurred while saving the premium term";
      if (error.code === '23505') {
        if (error.message.includes('premium_term_code')) {
          errorMessage = "Premium Term Code already exists";
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
            {premiumTerm ? "Edit Premium Term" : "Add Premium Term"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="premium_term_code">Premium Term Code *</Label>
            <Input
              id="premium_term_code"
              value={formData.premium_term_code}
              onChange={(e) =>
                setFormData({ ...formData, premium_term_code: e.target.value.toUpperCase() })
              }
              placeholder="Enter premium term code (max 10 chars)"
              maxLength={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="premium_term_name">Premium Term Name *</Label>
            <Input
              id="premium_term_name"
              value={formData.premium_term_name}
              onChange={(e) =>
                setFormData({ ...formData, premium_term_name: e.target.value })
              }
              placeholder="Enter premium term name (max 50 chars)"
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="term_duration_years">Term Duration (Years) *</Label>
            <Input
              id="term_duration_years"
              type="number"
              min="1"
              value={formData.term_duration_years}
              onChange={(e) =>
                setFormData({ ...formData, term_duration_years: parseInt(e.target.value) || 1 })
              }
              placeholder="Enter duration in years"
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
              placeholder="Enter description (max 255 chars)"
              maxLength={255}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/255
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
                : premiumTerm
                ? "Update Premium Term"
                : "Add Premium Term"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}