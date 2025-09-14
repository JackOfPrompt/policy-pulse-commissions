import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const gridSchema = z.object({
  product_type: z.string().min(1, "Product type is required"),
  provider: z.string().min(1, "Provider is required"),
  commission_rate: z.number().min(0).max(100),
  reward_rate: z.number().min(0).max(100).optional(),
  valid_from: z.string().min(1, "Valid from date is required"),
  valid_to: z.string().optional(),
  is_active: z.boolean().default(true),
  // Motor specific fields
  product_subtype: z.string().optional(),
  vehicle_make: z.string().optional(),
  fuel_type_id: z.string().optional(),
  cc_range: z.string().optional(),
  ncb_percentage: z.number().optional(),
  coverage_type_id: z.string().optional(),
  // Health specific fields
  product_sub_type: z.string().optional(),
  plan_name: z.string().optional(),
  sum_insured_min: z.number().optional(),
  sum_insured_max: z.number().optional(),
  age_group: z.string().optional(),
  family_size: z.number().optional(),
  // Life specific fields
  plan_type: z.string().optional(),
  ppt: z.number().optional(),
  pt: z.number().optional(),
  premium_start_price: z.number().optional(),
  premium_end_price: z.number().optional(),
  commission_start_date: z.string().optional(),
  commission_end_date: z.string().optional(),
});

type GridFormData = z.infer<typeof gridSchema>;

interface AddGridModalProps {
  onGridAdded: () => void;
  orgId: string;
}

export default function AddGridModal({ onGridAdded, orgId }: AddGridModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GridFormData>({
    resolver: zodResolver(gridSchema),
    defaultValues: {
      product_type: "",
      provider: "",
      commission_rate: 0,
      reward_rate: 0,
      valid_from: new Date().toISOString().split('T')[0],
      is_active: true,
    },
  });

  const productType = form.watch("product_type");

  const onSubmit = async (data: GridFormData) => {
    try {
      setLoading(true);

      let tableName: string;
      let insertData: any = {
        org_id: orgId,
        product_type: data.product_type,
        provider: data.provider,
        commission_rate: data.commission_rate,
        reward_rate: data.reward_rate || 0,
        valid_from: data.valid_from,
        valid_to: data.valid_to || null,
        is_active: data.is_active,
      };

      switch (data.product_type) {
        case 'motor':
          tableName = 'motor_payout_grid';
          insertData = {
            ...insertData,
            product_subtype: data.product_subtype || '',
            vehicle_make: data.vehicle_make || null,
            fuel_type_id: data.fuel_type_id ? parseInt(data.fuel_type_id) : null,
            cc_range: data.cc_range || null,
            ncb_percentage: data.ncb_percentage || null,
            coverage_type_id: data.coverage_type_id ? parseInt(data.coverage_type_id) : null,
          };
          break;
        case 'health':
          tableName = 'health_payout_grid';
          insertData = {
            ...insertData,
            product_sub_type: data.product_sub_type || '',
            plan_name: data.plan_name || '',
            sum_insured_min: data.sum_insured_min || null,
            sum_insured_max: data.sum_insured_max || null,
            age_group: data.age_group || null,
            family_size: data.family_size || null,
          };
          break;
        case 'life':
          tableName = 'life_payout_grid';
          insertData = {
            ...insertData,
            plan_type: data.plan_type || null,
            plan_name: data.plan_name || null,
            ppt: data.ppt || null,
            pt: data.pt || null,
            premium_start_price: data.premium_start_price || null,
            premium_end_price: data.premium_end_price || null,
            commission_start_date: data.commission_start_date || data.valid_from,
            commission_end_date: data.commission_end_date || null,
          };
          break;
        default:
          throw new Error('Invalid product type');
      }

      const { error } = await supabase
        .from(tableName as any)
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission grid entry added successfully",
      });

      form.reset();
      setOpen(false);
      onGridAdded();
    } catch (error) {
      console.error('Error adding grid entry:', error);
      toast({
        title: "Error",
        description: "Failed to add commission grid entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Grid
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Commission Grid</DialogTitle>
          <DialogDescription>
            Create a new commission grid entry for calculating policy commissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="motor">Motor</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="life">Life</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., HDFC ERGO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Rate (%) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
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
                name="reward_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
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
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Leave empty for no expiry</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Type Specific Fields */}
            {productType === 'motor' && (
              <div className="space-y-4">
                <h4 className="font-medium">Motor Specific Fields</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="product_subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Sub Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Two Wheeler" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Make</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Honda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cc_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CC Range</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 100-150" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ncb_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NCB Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {productType === 'health' && (
              <div className="space-y-4">
                <h4 className="font-medium">Health Specific Fields</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="product_sub_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Sub Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Individual" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plan_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Health Protect Gold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sum_insured_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Sum Insured</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sum_insured_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Sum Insured</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Group</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 18-35" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="family_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Size</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {productType === 'life' && (
              <div className="space-y-4">
                <h4 className="font-medium">Life Specific Fields</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plan_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Term" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plan_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Life Protect Plus" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ppt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premium Payment Term (PPT)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Term (PT)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="premium_start_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Premium Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="premium_end_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Premium Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commission_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commission_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable this grid entry for commission calculations
                    </FormDescription>
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

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Grid"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}