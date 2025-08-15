import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HealthCondition {
  condition_id: string;
  category: 'Covered' | 'Exclusions';
  condition_name: string;
  description?: string;
  waiting_period?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateEditHealthConditionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condition?: HealthCondition | null;
  onSuccess: () => void;
}

const healthConditionSchema = z.object({
  condition_name: z.string().min(1, 'Condition name is required'),
  category: z.enum(['Covered', 'Exclusions']),
  description: z.string().optional(),
  waiting_period: z.string().optional(),
  is_active: z.boolean(),
});

type HealthConditionFormData = z.infer<typeof healthConditionSchema>;

const CreateEditHealthConditionModal: React.FC<CreateEditHealthConditionModalProps> = ({
  open,
  onOpenChange,
  condition,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<HealthConditionFormData>({
    resolver: zodResolver(healthConditionSchema),
    defaultValues: {
      condition_name: '',
      category: 'Covered',
      description: '',
      waiting_period: '',
      is_active: true,
    },
  });

  const watchCategory = form.watch('category');

  useEffect(() => {
    if (condition) {
      form.reset({
        condition_name: condition.condition_name,
        category: condition.category,
        description: condition.description || '',
        waiting_period: condition.waiting_period || '',
        is_active: condition.is_active,
      });
    } else {
      form.reset({
        condition_name: '',
        category: 'Covered',
        description: '',
        waiting_period: '',
        is_active: true,
      });
    }
  }, [condition, form]);

  // Clear waiting period when category changes to 'Exclusions'
  useEffect(() => {
    if (watchCategory === 'Exclusions') {
      form.setValue('waiting_period', '');
    }
  }, [watchCategory, form]);

  const onSubmit = async (data: HealthConditionFormData) => {
    setLoading(true);
    try {
      const payload = {
        condition_name: data.condition_name,
        category: data.category,
        description: data.description || null,
        waiting_period: data.category === 'Covered' ? data.waiting_period || null : null,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (condition) {
        // Update existing condition
        result = await supabase
          .from('master_health_conditions')
          .update(payload)
          .eq('condition_id', condition.condition_id);
      } else {
        // Create new condition
        result = await supabase
          .from('master_health_conditions')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Health condition ${condition ? 'updated' : 'created'} successfully.`
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving health condition:', error);
      toast({
        title: "Error",
        description: `Failed to ${condition ? 'update' : 'create'} health condition. Please try again.`,
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
            {condition ? 'Edit Health Condition' : 'Create New Health Condition'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Condition Name */}
              <FormField
                control={form.control}
                name="condition_name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Condition Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Diabetes Care" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Covered">Covered</SelectItem>
                        <SelectItem value="Exclusions">Exclusions</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Waiting Period - Only show for Covered conditions */}
              {watchCategory === 'Covered' && (
                <FormField
                  control={form.control}
                  name="waiting_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waiting Period</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 2 years, After 3 years" 
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the health condition..." 
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
                      Enable or disable this health condition
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
                {loading ? 'Saving...' : condition ? 'Update Condition' : 'Create Condition'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditHealthConditionModal;