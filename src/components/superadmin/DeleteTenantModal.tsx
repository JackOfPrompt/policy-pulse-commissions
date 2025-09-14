import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Organization {
  id: string;
  name: string;
  code: string;
}

interface DeleteTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSuccess: () => void;
}

export function DeleteTenantModal({ open, onOpenChange, organization, onSuccess }: DeleteTenantModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!organization) return;

    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id);

      if (error) {
        setError(error.message);
        return;
      }

      toast({
        title: 'Tenant deleted',
        description: `${organization.name} has been permanently deleted.`,
      });

      setConfirmText('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to delete tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const canDelete = confirmText === organization?.name;

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setConfirmText('');
        setError(null);
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Tenant Organization
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the organization and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting this organization will also remove all associated users, policies, and data. This action is irreversible.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type <strong>{organization.name}</strong> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={organization.name}
            />
          </div>

          <div className="rounded-lg bg-muted p-3">
            <h4 className="font-medium text-sm mb-2">Organization Details:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div><strong>Name:</strong> {organization.name}</div>
              <div><strong>Code:</strong> {organization.code}</div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Deleting...' : 'Delete Tenant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}