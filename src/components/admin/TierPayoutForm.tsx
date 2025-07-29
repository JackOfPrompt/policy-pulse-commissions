import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const tierPayoutSchema = z.object({
  agent_tier_id: z.string().min(1, "Agent tier is required"),
  product_id: z.string().min(1, "Product is required"),
  agent_type: z.string().min(1, "Agent type is required"),
  commission_type: z.string().min(1, "Commission type is required"),
  commission_value: z.string().min(1, "Commission value is required"),
  effective_from: z.string().min(1, "Effective from date is required"),
  status: z.string().min(1, "Status is required"),
});

type TierPayoutFormData = z.infer<typeof tierPayoutSchema>;

interface TierPayoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: any;
  onSuccess: () => void;
}

export const TierPayoutForm = ({ open, onOpenChange, rule, onSuccess }: TierPayoutFormProps) => {
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<TierPayoutFormData>({
    resolver: zodResolver(tierPayoutSchema),
    defaultValues: {
      agent_tier_id: "",
      product_id: "",
      agent_type: "",
      commission_type: "Percentage",
      commission_value: "",
      effective_from: new Date().toISOString().split('T')[0],
      status: "Active",
    },
  });

  useEffect(() => {
    fetchTiers();
    fetchProducts();
    if (rule) {
      form.reset({
        agent_tier_id: rule.agent_tier_id || "",
        product_id: rule.product_id || "",
        agent_type: rule.agent_type || "",
        commission_type: rule.commission_type || "Percentage",
        commission_value: rule.commission_value?.toString() || "",
        effective_from: rule.effective_from || new Date().toISOString().split('T')[0],
        status: rule.status || "Active",
      });
    }
  }, [rule, form]);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_tiers")
        .select("*")
        .order("level");

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error("Error fetching tiers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("insurance_products")
        .select("id, name, provider_id, insurance_providers(provider_name)")
        .eq("status", "Active")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const onSubmit = async (data: TierPayoutFormData) => {
    setLoading(true);
    try {
      const ruleData: any = {
        ...data,
        commission_value: parseFloat(data.commission_value),
      };

      if (rule) {
        const { error } = await supabase
          .from("tier_payout_rules")
          .update(ruleData)
          .eq("id", rule.id);
        if (error) throw error;
        toast({ title: "Payout rule updated successfully" });
      } else {
        const { error } = await supabase
          .from("tier_payout_rules")
          .insert(ruleData);
        if (error) throw error;
        toast({ title: "Payout rule created successfully" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Payout Rule" : "Add New Payout Rule"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agent_tier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name}
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
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.insurance_providers?.provider_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agent_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POSP">POSP</SelectItem>
                        <SelectItem value="MISP">MISP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select commission type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Percentage">Percentage</SelectItem>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commission_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Commission Value {form.watch("commission_type") === "Percentage" ? "(%)" : "(₹)"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};