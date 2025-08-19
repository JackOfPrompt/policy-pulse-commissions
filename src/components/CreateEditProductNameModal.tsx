import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ProductName {
  product_id: string;
  product_code: string;
  product_name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  lob_id: string;
  policy_type_id: string;
  plan_type_id?: string;
  provider_id?: string;
}

interface LOB {
  lob_id: string;
  lob_name: string;
}

interface PolicyType {
  id: string;
  policy_type_name: string;
}

interface PlanType {
  plan_type_id: string;
  plan_type_name: string;
}

interface Provider {
  provider_id: string;
  provider_name: string;
}

interface CreateEditProductNameModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: ProductName | null;
  onSuccess: () => void;
  lobs: LOB[];
  policyTypes: PolicyType[];
  planTypes: PlanType[];
  providers: Provider[];
}

const productNameSchema = z.object({
  product_code: z.string().min(1, 'Product code is required'),
  product_name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  lob_id: z.string().min(1, 'LOB is required'),
  policy_type_id: z.string().min(1, 'Policy type is required'),
  plan_type_id: z.string().optional(),
  provider_id: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

type ProductNameFormData = z.infer<typeof productNameSchema>;

export const CreateEditProductNameModal: React.FC<CreateEditProductNameModalProps> = ({
  isOpen,
  onOpenChange,
  productName,
  onSuccess,
  lobs,
  policyTypes,
  planTypes,
  providers,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductNameFormData>({
    resolver: zodResolver(productNameSchema),
    defaultValues: {
      product_code: '',
      product_name: '',
      description: '',
      lob_id: '',
      policy_type_id: '',
      plan_type_id: '',
      provider_id: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (productName) {
      form.reset({
        product_code: productName.product_code,
        product_name: productName.product_name,
        description: productName.description || '',
        lob_id: productName.lob_id,
        policy_type_id: productName.policy_type_id,
        plan_type_id: productName.plan_type_id || '',
        provider_id: productName.provider_id || '',
        status: productName.status,
      });
    } else {
      form.reset({
        product_code: '',
        product_name: '',
        description: '',
        lob_id: '',
        policy_type_id: '',
        plan_type_id: '',
        provider_id: '',
        status: 'Active',
      });
    }
  }, [productName, form, isOpen]);

  const onSubmit = async (data: ProductNameFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        product_code: data.product_code,
        product_name: data.product_name,
        description: data.description || null,
        lob_id: data.lob_id,
        policy_type_id: data.policy_type_id,
        plan_type_id: data.plan_type_id || null,
        provider_id: data.provider_id || null,
        status: data.status,
      };

      if (productName) {
        const { error } = await supabase
          .from('master_product_name')
          .update(submitData)
          .eq('product_id', productName.product_id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product name updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('master_product_name')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product name created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product name:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product name",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {productName ? 'Edit Product Name' : 'Create New Product Name'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="provider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Provider</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Provider (Optional)" />
                      </SelectTrigger>
                    </FormControl>
                     <SelectContent>
                       <SelectItem value="none">None</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.provider_id} value={provider.provider_id}>
                          {provider.provider_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lob_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Line of Business *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select LOB" />
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

              <FormField
                control={form.control}
                name="policy_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Policy Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {policyTypes.map((policyType) => (
                          <SelectItem key={policyType.id} value={policyType.id}>
                            {policyType.policy_type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="plan_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Type (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Plan Type (Optional)" />
                      </SelectTrigger>
                    </FormControl>
                     <SelectContent>
                       <SelectItem value="none">None</SelectItem>
                      {planTypes.map((planType) => (
                        <SelectItem key={planType.plan_type_id} value={planType.plan_type_id}>
                          {planType.plan_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., HSP-PLUS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Health Shield Plus" {...field} />
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
                    <Textarea 
                      placeholder="Enter product description..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Toggle to set the product name as active or inactive
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'Active'}
                      onCheckedChange={(checked) => field.onChange(checked ? 'Active' : 'Inactive')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
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
                  ? (productName ? 'Updating...' : 'Creating...') 
                  : (productName ? 'Update Product Name' : 'Create Product Name')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};