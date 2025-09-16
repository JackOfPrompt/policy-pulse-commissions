import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Policy } from "@/hooks/usePolicies";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeletePolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeletePolicyModal({ open, onOpenChange, policy, onDelete }: DeletePolicyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!policy) return;

    setLoading(true);
    try {
      const result = await onDelete(policy.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Policy deleted successfully",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete policy",
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

  if (!policy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Policy
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this policy? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Policy Number:</strong> {policy.policy_number}</p>
              <p><strong>Customer:</strong> {policy.customer ? `${policy.customer.first_name || ''} ${policy.customer.last_name || ''}`.trim() : "N/A"}</p>
              <p><strong>Provider:</strong> {policy.provider || "N/A"}</p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Policy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}