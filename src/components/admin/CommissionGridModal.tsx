import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommissionGrid } from "@/hooks/useCommissionGrids";
import { useCommissionGridProvidersAndProducts } from "@/hooks/useCommissionGridProvidersAndProducts";

const commissionGridSchema = z.object({
  product_type: z.string(),
  product_subtype: z.string().optional(),
  provider: z.string().optional(),
  min_premium: z.number().min(0).optional(),
  max_premium: z.number().min(0).optional(),
  base_commission_rate: z.number().min(0).max(100),
  reward_commission_rate: z.number().min(0).max(100).optional(),
  bonus_commission_rate: z.number().min(0).max(100).optional(),
  effective_from: z.string(),
  effective_to: z.string().optional(),
  reward_effective_from: z.string().optional(),
  reward_effective_to: z.string().optional(),
  bonus_effective_from: z.string().optional(),
  bonus_effective_to: z.string().optional(),
  data_filters: z.object({
    age_range: z.object({
      min: z.number().min(0).optional(),
      max: z.number().max(100).optional(),
    }).optional(),
    sum_insured_range: z.object({
      min: z.number().min(0).optional(),
      max: z.number().optional(),
    }).optional(),
    policy_term_range: z.object({
      min: z.number().min(0).optional(),
      max: z.number().optional(),
    }).optional(),
    premium_payment_term_range: z.object({
      min: z.number().min(0).optional(),
      max: z.number().optional(),
    }).optional(),
    vehicle_type: z.array(z.string()).optional(),
    coverage_type: z.array(z.string()).optional(),
    business_type: z.array(z.string()).optional(),
    region: z.array(z.string()).optional(),
  }).optional(),
}).refine((data) => {
  if (data.min_premium && data.max_premium) {
    return data.min_premium <= data.max_premium;
  }
  return true;
}, {
  message: "Maximum premium must be greater than minimum premium",
  path: ["max_premium"],
});

type FormData = z.infer<typeof commissionGridSchema>;

interface CommissionGridModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<boolean>;
  grid?: CommissionGrid;
  title: string;
}

export function CommissionGridModal({
  open,
  onClose,
  onSubmit,
  grid,
  title,
}: CommissionGridModalProps) {
  const [loading, setLoading] = useState(false);
  const { productTypes, providers, loading: dataLoading } = useCommissionGridProvidersAndProducts();

  const form = useForm<FormData>({
    resolver: zodResolver(commissionGridSchema),
    defaultValues: {
      product_type: grid?.product_type || 'life',
      product_subtype: grid?.product_subtype || '',
      provider: grid?.provider || '',
      min_premium: grid?.min_premium || undefined,
      max_premium: grid?.max_premium || undefined,
      base_commission_rate: grid?.commission_rate || 0,
      reward_commission_rate: grid?.reward_rate || 0,
      bonus_commission_rate: grid?.bonus_commission_rate || 0,
      effective_from: grid?.effective_from || new Date().toISOString().split('T')[0],
      effective_to: grid?.effective_to || '',
      reward_effective_from: grid?.reward_effective_from || '',
      reward_effective_to: grid?.reward_effective_to || '',
      bonus_effective_from: grid?.bonus_effective_from || '',
      bonus_effective_to: grid?.bonus_effective_to || '',
      data_filters: grid?.data_filters || {},
    },
  });

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    const success = await onSubmit(data);
    setLoading(false);
    
    if (success) {
      form.reset();
      onClose();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productTypes.map((productType) => (
                          <SelectItem key={productType.id} value={productType.category}>
                            {productType.category}
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
                name="product_subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Subtype (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Term, Comprehensive"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No Provider</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.name}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_premium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Premium (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
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
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Commission Rates */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="base_commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reward_commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Commission Rate (%) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonus_commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Commission Rate (%) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Commission Rate Display */}
              {(form.watch('base_commission_rate') || form.watch('reward_commission_rate') || form.watch('bonus_commission_rate')) && (
                <div className="p-2 bg-muted rounded text-sm">
                  <strong>Total Commission Rate: {
                    ((form.watch('base_commission_rate') || 0) + 
                     (form.watch('reward_commission_rate') || 0) + 
                     (form.watch('bonus_commission_rate') || 0)).toFixed(2)
                  }%</strong>
                </div>
              )}
            </div>

            {/* Data Filters Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Data Filters (Optional)</h4>
              
              {/* Age Range */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="data_filters.age_range.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="18"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_filters.age_range.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="65"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sum Insured Range */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="data_filters.sum_insured_range.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Sum Insured</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="100000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_filters.sum_insured_range.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Sum Insured</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="5000000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Policy Term Range */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="data_filters.policy_term_range.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Policy Term (Years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_filters.policy_term_range.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Policy Term (Years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Base Commission Effective Period</div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effective_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective From</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effective_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective To (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Reward Commission Date Filters */}
              {form.watch('reward_commission_rate') && (
                <>
                  <div className="text-sm font-medium">Reward Commission Effective Period</div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reward_effective_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward From</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reward_effective_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward To</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Bonus Commission Date Filters */}
              {form.watch('bonus_commission_rate') && (
                <>
                  <div className="text-sm font-medium">Bonus Commission Effective Period</div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bonus_effective_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonus From</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bonus_effective_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonus To</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : grid ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}