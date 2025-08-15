import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PolicyType {
  id: string;
  policy_type_name: string;
  policy_type_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateEditPolicyTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyType?: PolicyType | null;
  onSuccess: () => void;
}

const policyTypeSchema = z.object({
  policy_type_name: z.string().min(1, 'Policy type name is required'),
  policy_type_description: z.string().optional(),
  is_active: z.boolean(),
});

type PolicyTypeFormData = z.infer<typeof policyTypeSchema>;

const CreateEditPolicyTypeModal: React.FC<CreateEditPolicyTypeModalProps> = ({
  open,
  onOpenChange,
  policyType,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PolicyTypeFormData>({
    resolver: zodResolver(policyTypeSchema),
    defaultValues: {
      policy_type_name: '',
      policy_type_description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (policyType) {
      form.reset({
        policy_type_name: policyType.policy_type_name,
        policy_type_description: policyType.policy_type_description || '',
        is_active: policyType.is_active,
      });
    } else {
      form.reset({
        policy_type_name: '',
        policy_type_description: '',
        is_active: true,
      });
    }
  }, [policyType, form]);

  const onSubmit = async (data: PolicyTypeFormData) => {
    setLoading(true);
    try {
      const payload = {
        policy_type_name: data.policy_type_name,
        policy_type_description: data.policy_type_description || null,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (policyType) {
        // Update existing policy type
        result = await supabase
          .from('master_policy_types')
          .update(payload)
          .eq('id', policyType.id);
      } else {
        // Create new policy type
        result = await supabase
          .from('master_policy_types')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Policy type ${policyType ? 'updated' : 'created'} successfully.`
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving policy type:', error);
      toast({
        title: "Error",
        description: `Failed to ${policyType ? 'update' : 'create'} policy type. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {policyType ? 'Edit Policy Type' : 'Create New Policy Type'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Policy Type Name */}
            <FormField
              control={form.control}
              name="policy_type_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Type Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Individual, Family Floater" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Policy Type Description */}
            <FormField
              control={form.control}
              name="policy_type_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Type Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the policy type..." 
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this policy type
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : policyType ? 'Update Policy Type' : 'Create Policy Type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditPolicyTypeModal;