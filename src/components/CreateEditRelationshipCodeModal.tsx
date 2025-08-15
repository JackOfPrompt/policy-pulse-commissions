import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface RelationshipCode {
  relationship_id: number;
  relationship_code: string;
  relationship_name: string;
  description?: string;
  is_active: boolean;
}

interface CreateEditRelationshipCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationshipCode?: RelationshipCode | null;
}

const relationshipCodeSchema = z.object({
  relationship_code: z.string()
    .min(1, "Relationship code is required")
    .max(20, "Code must be 20 characters or less")
    .regex(/^[A-Z0-9_]+$/, "Code must contain only uppercase letters, numbers, and underscores"),
  relationship_name: z.string()
    .min(1, "Relationship name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  is_active: z.boolean().default(true),
});

type RelationshipCodeFormData = z.infer<typeof relationshipCodeSchema>;

const CreateEditRelationshipCodeModal = ({
  isOpen,
  onClose,
  relationshipCode,
}: CreateEditRelationshipCodeModalProps) => {
  const isEditing = !!relationshipCode;

  const form = useForm<RelationshipCodeFormData>({
    resolver: zodResolver(relationshipCodeSchema),
    defaultValues: {
      relationship_code: "",
      relationship_name: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && relationshipCode) {
        form.reset({
          relationship_code: relationshipCode.relationship_code,
          relationship_name: relationshipCode.relationship_name,
          description: relationshipCode.description || "",
          is_active: relationshipCode.is_active,
        });
      } else {
        form.reset({
          relationship_code: "",
          relationship_name: "",
          description: "",
          is_active: true,
        });
      }
    }
  }, [isOpen, isEditing, relationshipCode, form]);

  const onSubmit = async (data: RelationshipCodeFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isEditing && relationshipCode) {
        // Update existing relationship code
        const response = await fetch(`https://sezbixunulacdednlrtl.supabase.co/functions/v1/relationship-codes/${relationshipCode.relationship_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            relationship_name: data.relationship_name,
            description: data.description,
            is_active: data.is_active,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update relationship code');
        }

        toast({
          title: "Success",
          description: "Relationship code updated successfully.",
        });
      } else {
        // Create new relationship code
        const response = await fetch(`https://sezbixunulacdednlrtl.supabase.co/functions/v1/relationship-codes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            relationship_code: data.relationship_code,
            relationship_name: data.relationship_name,
            description: data.description,
            is_active: data.is_active,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create relationship code');
        }

        toast({
          title: "Success",
          description: "Relationship code created successfully.",
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving relationship code:', error);
      
      let errorMessage = "An unexpected error occurred.";
      
      if (error.message.includes('already exists')) {
        errorMessage = "A relationship code with this code already exists.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Relationship Code" : "Add Relationship Code"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="relationship_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., SPOUSE, FATHER, CHILD"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Spouse, Father, Child"
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description for this relationship code"
                      rows={3}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this relationship code for use
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update" : "Create")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditRelationshipCodeModal;