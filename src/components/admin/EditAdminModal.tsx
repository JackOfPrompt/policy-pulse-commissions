import { useState, useEffect } from 'react';
import { Shield, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Admin {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface EditAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin | null;
  onSuccess: () => void;
}

export function EditAdminModal({ open, onOpenChange, admin, onSuccess }: EditAdminModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });

  useEffect(() => {
    if (admin) {
      setFormData({
        fullName: admin.full_name || '',
        email: admin.email || ''
      });
    }
  }, [admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    setError(null);
    setIsLoading(true);

    try {
      // Use the edge function to update tenant admin
      const { data, error } = await supabase.functions.invoke('update-tenant-admin', {
        body: {
          userId: admin.id,
          fullName: formData.fullName
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Also update the profiles table to keep data in sync
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', admin.id);

      if (profileError) {
        console.warn('Profile update warning:', profileError.message);
      }

      toast({
        title: 'Administrator updated',
        description: `${formData.fullName} has been successfully updated.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to update administrator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Edit Administrator
          </DialogTitle>
          <DialogDescription>
            Update the details for {admin.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Full Name *</Label>
            <Input
              id="edit-fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="admin@example.com"
              required
            />
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
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Admin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}