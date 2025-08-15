import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLOBs } from '@/hooks/useLOBs';

interface PlanType {
  plan_type_id: string;
  plan_type_name: string;
  description?: string;
  is_active: boolean;
  lob_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateEditPlanTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType?: PlanType | null;
  onSuccess: () => void;
}

const planTypeSchema = z.object({
  lob_id: z.string().min(1, 'Line of Business is required'),
  plan_type_name: z.string().min(1, 'Plan type name is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type PlanTypeFormData = z.infer<typeof planTypeSchema>;

const CreateEditPlanTypeModal: React.FC<CreateEditPlanTypeModalProps> = ({
  open,
  onOpenChange,
  planType,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { lobs, loading: lobsLoading } = useLOBs();

  const form = useForm<PlanTypeFormData>({
    resolver: zodResolver(planTypeSchema),
    defaultValues: {
      lob_id: '',
      plan_type_name: '',
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (planType) {
      form.reset({
        lob_id: planType.lob_id,
        plan_type_name: planType.plan_type_name,
        description: planType.description || '',
        is_active: planType.is_active,
      });
    } else {
      form.reset({
        lob_id: '',
        plan_type_name: '',
        description: '',
        is_active: true,
      });
    }
  }, [planType, form]);

  const onSubmit = async (data: PlanTypeFormData) => {
    setLoading(true);
    try {
      const payload = {
        lob_id: data.lob_id,
        plan_type_name: data.plan_type_name,
        description: data.description || null,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (planType) {
        // Update existing plan type
        result = await supabase
          .from('master_plan_types')
          .update(payload)
          .eq('plan_type_id', planType.plan_type_id);
      } else {
        // Create new plan type
        result = await supabase
          .from('master_plan_types')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Plan type ${planType ? 'updated' : 'created'} successfully.`
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving plan type:', error);
      toast({
        title: "Error",
        description: `Failed to ${planType ? 'update' : 'create'} plan type. Please try again.`,
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
            {planType ? 'Edit Plan Type' : 'Create New Plan Type'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Line of Business */}
            <FormField
              control={form.control}
              name="lob_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Line of Business *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={lobsLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a line of business" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lobs.map((lob) => (
                        <SelectItem key={lob.lob_id} value={lob.lob_id}>
                          {lob.lob_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan Type Name */}
            <FormField
              control={form.control}
              name="plan_type_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Type Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Individual Health Plan, Term Life Plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the plan type..." 
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
                      Enable or disable this plan type
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
              <Button type="submit" disabled={loading || lobsLoading}>
                {loading ? 'Saving...' : planType ? 'Update Plan Type' : 'Create Plan Type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditPlanTypeModal;