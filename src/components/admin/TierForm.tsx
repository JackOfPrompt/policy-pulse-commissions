import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const tierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  level: z.number().min(1, "Level must be at least 1").optional(),
});

type TierFormData = z.infer<typeof tierSchema>;

interface TierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: any;
  onSuccess: () => void;
}

export const TierForm = ({ open, onOpenChange, tier, onSuccess }: TierFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<TierFormData>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: "",
      description: "",
      level: undefined,
    },
  });

  useEffect(() => {
    if (tier) {
      form.reset({
        name: tier.name || "",
        description: tier.description || "",
        level: tier.level || undefined,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        level: undefined,
      });
    }
  }, [tier, form]);

  const onSubmit = async (data: TierFormData) => {
    try {
      const tierData = {
        name: data.name,
        description: data.description || null,
        level: data.level || null,
      };

      if (tier) {
        // Update existing tier
        const { error } = await supabase
          .from('agent_tiers')
          .update(tierData)
          .eq('id', tier.id);
        
        if (error) throw error;
        toast({ title: "Tier updated successfully!" });
      } else {
        // Create new tier
        const { error } = await supabase
          .from('agent_tiers')
          .insert([tierData]);
        
        if (error) throw error;
        toast({ title: "Tier created successfully!" });
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error saving tier:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tier",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tier ? "Edit Agent Tier" : "Add New Agent Tier"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bronze, Silver, Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1, 2, 3..."
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this tier..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {tier ? "Update Tier" : "Create Tier"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};