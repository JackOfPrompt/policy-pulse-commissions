import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EntityFormModal } from '@/components/superadmin/shared/EntityFormModal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const commissionTierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  base_percentage: z.coerce.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  min_premium: z.coerce.number().min(0).optional().or(z.literal('')),
  max_premium: z.coerce.number().min(0).optional().or(z.literal('')),
  product_type_id: z.string().optional().or(z.literal('all')),
  is_active: z.boolean().default(true)
});

type CommissionTierFormData = z.infer<typeof commissionTierSchema>;

interface CommissionTier {
  id: string;
  name: string;
  description?: string;
  base_percentage: number;
  min_premium?: number;
  max_premium?: number;
  product_type_id?: string;
  is_active: boolean;
}

interface CommissionTierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: CommissionTier | null;
}

export function CommissionTierModal({ open, onOpenChange, tier }: CommissionTierModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!tier;

  const form = useForm<CommissionTierFormData>({
    resolver: zodResolver(commissionTierSchema),
    defaultValues: {
      name: tier?.name || '',
      description: tier?.description || '',
      base_percentage: tier?.base_percentage || 0,
      min_premium: tier?.min_premium || '',
      max_premium: tier?.max_premium || '',
      product_type_id: tier?.product_type_id || 'all',
      is_active: tier?.is_active ?? true
    }
  });

  // Temporarily disabled due to type sync issues - will be restored when types are regenerated
  const productTypes = [
    { id: 'motor', name: 'Motor Insurance' },
    { id: 'health', name: 'Health Insurance' },
    { id: 'life', name: 'Life Insurance' }
  ];

  // const { data: productTypes } = useQuery({
  //   queryKey: ['product-types'],
  //   queryFn: async () => {
  //     const { data, error } = await supabase
  //       .from('product_types')
  //       .select('id, name')
  //       .eq('is_active', true)
  //       .order('name');

  //     if (error) throw error;
  //     return data || [];
  //   },
  // });

  const mutation = useMutation({
    mutationFn: async (data: CommissionTierFormData) => {
      // Get current user's org
      const { data: userOrgs, error: userError } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (userError || !userOrgs) throw new Error('Unable to determine organization');

      const tierData = {
        ...data,
        org_id: userOrgs.org_id,
        min_premium: data.min_premium === '' ? null : Number(data.min_premium),
        max_premium: data.max_premium === '' ? null : Number(data.max_premium),
        product_type_id: data.product_type_id === 'all' ? null : data.product_type_id
      };

      if (isEditing) {
        const { error } = await supabase
          .from('commission_tiers' as any)
          .update(tierData)
          .eq('id', tier.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('commission_tiers' as any)
          .insert(tierData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
      toast.success(`Commission tier ${isEditing ? 'updated' : 'created'} successfully`);
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} commission tier`);
      console.error('Mutation error:', error);
    }
  });

  const onSubmit = (data: CommissionTierFormData) => {
    // Only validate premium range if both values are provided
    if (data.min_premium !== '' && data.max_premium !== '' && 
        Number(data.min_premium) >= Number(data.max_premium)) {
      form.setError('max_premium', { 
        message: 'Maximum premium must be greater than minimum premium' 
      });
      return;
    }

    mutation.mutate(data);
  };

  return (
    <EntityFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Commission Tier' : 'Create Commission Tier'}
      description="Commission tiers define percentage rates that can be applied to agents and MISPs."
      loading={mutation.isPending}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel={isEditing ? 'Update' : 'Create'}
      size="lg"
    >
      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Bronze, Silver, Gold" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="base_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Percentage *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" max="100" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional description for this tier" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_premium"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Premium (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="Leave empty for no minimum" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_premium"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Premium (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="Leave empty for no maximum" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="product_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type (leave empty for all products)" />
                  </SelectTrigger>
                </FormControl>
                 <SelectContent>
                   <SelectItem value="all">All Products</SelectItem>
                   {productTypes.map((type) => (
                     <SelectItem key={type.id} value={type.id}>
                       {type.name}
                     </SelectItem>
                   ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Active tiers can be assigned to agents and MISPs
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
      </Form>
    </EntityFormModal>
  );
}