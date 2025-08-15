import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg";

interface Addon {
  addon_id: string;
  addon_code: string;
  addon_name: string;
  addon_category: string;
  description?: string;
  premium_type: string;
  premium_basis: string;
  calc_value?: number;
  min_amount?: number;
  max_amount?: number;
  waiting_period_months?: number;
  is_mandatory: boolean;
  is_active: boolean;
  eligibility_json?: any;
}

interface CreateEditAddonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon?: Addon | null;
  onSuccess: () => void;
}

const addonSchema = z.object({
  addon_code: z.string().min(1, 'Addon code is required'),
  addon_name: z.string().min(1, 'Addon name is required'),
  addon_category: z.enum(['Rider', 'Add-on']),
  description: z.string().optional(),
  premium_type: z.enum(['Flat', 'PercentOfBase', 'AgeBand', 'Slab']),
  premium_basis: z.enum(['PerPolicy', 'PerMember']),
  calc_value: z.coerce.number().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
  waiting_period_months: z.coerce.number().int().min(0).optional(),
  is_mandatory: z.boolean(),
  is_active: z.boolean(),
  eligibility_json: z.string().optional(),
});

type AddonFormData = z.infer<typeof addonSchema>;

const CreateEditAddonModal: React.FC<CreateEditAddonModalProps> = ({
  open,
  onOpenChange,
  addon,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      addon_code: '',
      addon_name: '',
      addon_category: 'Add-on',
      description: '',
      premium_type: 'Flat',
      premium_basis: 'PerPolicy',
      calc_value: undefined,
      min_amount: undefined,
      max_amount: undefined,
      waiting_period_months: undefined,
      is_mandatory: false,
      is_active: true,
      eligibility_json: '',
    },
  });

  useEffect(() => {
    if (addon) {
      form.reset({
        addon_code: addon.addon_code,
        addon_name: addon.addon_name,
        addon_category: addon.addon_category as 'Rider' | 'Add-on',
        description: addon.description || '',
        premium_type: addon.premium_type as 'Flat' | 'PercentOfBase' | 'AgeBand' | 'Slab',
        premium_basis: addon.premium_basis as 'PerPolicy' | 'PerMember',
        calc_value: addon.calc_value,
        min_amount: addon.min_amount,
        max_amount: addon.max_amount,
        waiting_period_months: addon.waiting_period_months,
        is_mandatory: addon.is_mandatory,
        is_active: addon.is_active,
        eligibility_json: addon.eligibility_json ? JSON.stringify(addon.eligibility_json, null, 2) : '',
      });
    } else {
      form.reset({
        addon_code: '',
        addon_name: '',
        addon_category: 'Add-on',
        description: '',
        premium_type: 'Flat',
        premium_basis: 'PerPolicy',
        calc_value: undefined,
        min_amount: undefined,
        max_amount: undefined,
        waiting_period_months: undefined,
        is_mandatory: false,
        is_active: true,
        eligibility_json: '',
      });
    }
    setJsonError('');
  }, [addon, form]);

  const validateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) return true; // Empty JSON is valid
    
    try {
      JSON.parse(jsonString);
      setJsonError('');
      return true;
    } catch (error) {
      setJsonError('Invalid JSON format');
      return false;
    }
  };

  const onSubmit = async (data: AddonFormData) => {
    // Validate JSON if provided
    if (data.eligibility_json && !validateJson(data.eligibility_json)) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        eligibility_json: data.eligibility_json ? JSON.parse(data.eligibility_json) : null,
      };

      let result;
      if (addon) {
        // Update existing addon
        const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addons/${addon.addon_id}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to update addon');
        result = await response.json();
      } else {
        // Create new addon
        const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addons`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to create addon');
        result = await response.json();
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Addon ${addon ? 'updated' : 'created'} successfully.`
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(result.message || `Failed to ${addon ? 'update' : 'create'} addon`);
      }
    } catch (error) {
      console.error('Error saving addon:', error);
      toast({
        title: "Error",
        description: `Failed to ${addon ? 'update' : 'create'} addon. Please try again.`,
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
          <DialogTitle>{addon ? 'Edit Add-on' : 'Create New Add-on'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Addon Code */}
              <FormField
                control={form.control}
                name="addon_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Addon Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PERSONAL_ACCIDENT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Addon Name */}
              <FormField
                control={form.control}
                name="addon_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Addon Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Personal Accident Cover" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Addon Category */}
              <FormField
                control={form.control}
                name="addon_category"
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
                        <SelectItem value="Rider">Rider</SelectItem>
                        <SelectItem value="Add-on">Add-on</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Premium Type */}
              <FormField
                control={form.control}
                name="premium_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select premium type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Flat">Flat</SelectItem>
                        <SelectItem value="PercentOfBase">Percent of Base</SelectItem>
                        <SelectItem value="AgeBand">Age Band</SelectItem>
                        <SelectItem value="Slab">Slab</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Premium Basis */}
              <FormField
                control={form.control}
                name="premium_basis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Basis</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select premium basis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PerPolicy">Per Policy</SelectItem>
                        <SelectItem value="PerMember">Per Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calc Value */}
              <FormField
                control={form.control}
                name="calc_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Calc Value 
                      {form.watch('premium_type') === 'PercentOfBase' && ' (%)'}
                      {form.watch('premium_type') === 'Flat' && ' (₹)'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter value" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Min Amount */}
              <FormField
                control={form.control}
                name="min_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter minimum amount" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Max Amount */}
              <FormField
                control={form.control}
                name="max_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter maximum amount" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Waiting Period */}
              <FormField
                control={form.control}
                name="waiting_period_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waiting Period (Months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter months" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      placeholder="Enter addon description..." 
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Eligibility JSON */}
            <FormField
              control={form.control}
              name="eligibility_json"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Criteria (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='{"age_min": 18, "age_max": 65, "conditions": ["no_pre_existing"]}'
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        validateJson(e.target.value);
                      }}
                    />
                  </FormControl>
                  {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes and Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="is_mandatory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mandatory Add-on</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This add-on is required for all policies
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable this add-on
                      </p>
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !!jsonError}>
                {loading ? 'Saving...' : addon ? 'Update Add-on' : 'Create Add-on'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditAddonModal;