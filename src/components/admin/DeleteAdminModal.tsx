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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Admin {
  id: string;
  full_name: string;
  email: string;
}

interface DeleteAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin | null;
  onSuccess: () => void;
}

export function DeleteAdminModal({ open, onOpenChange, admin, onSuccess }: DeleteAdminModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!admin || !profile?.org_id) return;

    setError(null);
    setIsLoading(true);

    try {
      // Remove from user_organizations (this will effectively remove their admin access)
      const { error: orgError } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', admin.id)
        .eq('org_id', profile.org_id)
        .eq('role', 'admin');

      if (orgError) {
        setError(orgError.message);
        return;
      }

      toast({
        title: 'Administrator removed',
        description: `${admin.full_name} has been removed as an administrator.`,
      });

      setConfirmText('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to remove administrator');
    } finally {
      setIsLoading(false);
    }
  };

  const canDelete = confirmText === admin?.email;

  if (!admin) return null;

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
            Remove Administrator
          </DialogTitle>
          <DialogDescription>
            This action will remove administrator privileges from this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will remove admin access for this user. They will no longer be able to manage the organization.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Type <strong>{admin.email}</strong> to confirm
            </Label>
            <Input
              id="confirm-email"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={admin.email}
            />
          </div>

          <div className="rounded-lg bg-muted p-3">
            <h4 className="font-medium text-sm mb-2">Administrator Details:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div><strong>Name:</strong> {admin.full_name}</div>
              <div><strong>Email:</strong> {admin.email}</div>
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
              {isLoading ? 'Removing...' : 'Remove Admin'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}