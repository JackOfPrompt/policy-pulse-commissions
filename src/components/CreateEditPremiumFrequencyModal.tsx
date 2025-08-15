import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PremiumFrequency {
  frequency_id: number;
  frequency_name: string;
  frequency_code: string;
  frequency_days: number;
  description?: string;
  is_active: boolean;
}

interface CreateEditPremiumFrequencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frequency?: PremiumFrequency | null;
  onSuccess: () => void;
}

const frequencySchema = z.object({
  frequency_name: z.string().min(1, "Frequency name is required"),
  frequency_code: z.string().min(1, "Frequency code is required").max(10, "Code must be 10 characters or less"),
  frequency_days: z.coerce.number().min(1, "Frequency days must be at least 1"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type FrequencyFormData = z.infer<typeof frequencySchema>;

export function CreateEditPremiumFrequencyModal({
  open,
  onOpenChange,
  frequency,
  onSuccess,
}: CreateEditPremiumFrequencyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FrequencyFormData>({
    resolver: zodResolver(frequencySchema),
    defaultValues: {
      frequency_name: "",
      frequency_code: "",
      frequency_days: 1,
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (frequency) {
      form.reset({
        frequency_name: frequency.frequency_name,
        frequency_code: frequency.frequency_code,
        frequency_days: frequency.frequency_days,
        description: frequency.description || "",
        is_active: frequency.is_active,
      });
    } else {
      form.reset({
        frequency_name: "",
        frequency_code: "",
        frequency_days: 1,
        description: "",
        is_active: true,
      });
    }
  }, [frequency, form, open]);

  const onSubmit = async (data: FrequencyFormData) => {
    setIsSubmitting(true);
    try {
      if (frequency) {
        // Update existing frequency
        const { error } = await supabase
          .from('master_premium_frequency')
          .update({
            frequency_name: data.frequency_name,
            frequency_code: data.frequency_code,
            frequency_days: data.frequency_days,
            description: data.description || null,
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('frequency_id', frequency.frequency_id);

        if (error) throw error;
      } else {
        // Create new frequency
        const { error } = await supabase
          .from('master_premium_frequency')
          .insert({
            frequency_name: data.frequency_name,
            frequency_code: data.frequency_code,
            frequency_days: data.frequency_days,
            description: data.description || null,
            is_active: data.is_active,
          });

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving premium frequency:', error);
      toast({
        title: "Error",
        description: `Failed to ${frequency ? 'update' : 'create'} premium frequency`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {frequency ? 'Edit Premium Frequency' : 'Add New Premium Frequency'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="frequency_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Monthly, Quarterly, Annually" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="frequency_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., M, Q, A" 
                      {...field}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency Days</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="e.g., 30, 90, 365"
                      min="1"
                      {...field}
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
                      placeholder="Enter description for this premium frequency..."
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this premium frequency for use
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

            <div className="flex justify-end space-x-2 pt-4">
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
                  ? (frequency ? 'Updating...' : 'Creating...') 
                  : (frequency ? 'Update Frequency' : 'Create Frequency')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}