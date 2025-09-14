import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Branch {
  id: string;
  branch_name: string;
}

interface DeleteBranchModalProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function DeleteBranchModal({ branch, open, onOpenChange, onDelete }: DeleteBranchModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!branch) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branch.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Branch deleted successfully",
      });

      onDelete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!branch) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Branch</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the branch "{branch.branch_name}"? 
            This action cannot be undone and will remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Branch'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}