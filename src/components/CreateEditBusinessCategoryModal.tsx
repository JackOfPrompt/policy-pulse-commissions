import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BusinessCategory {
  category_id: number;
  category_code: string;
  category_name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateEditBusinessCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: BusinessCategory | null;
  onSuccess: () => void;
}

const categorySchema = z.object({
  category_code: z.string()
    .min(1, 'Category code is required')
    .max(10, 'Category code must be 10 characters or less')
    .regex(/^[A-Z0-9_]+$/, 'Category code must be uppercase letters, numbers, and underscores only'),
  category_name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be 100 characters or less'),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const CreateEditBusinessCategoryModal: React.FC<CreateEditBusinessCategoryModalProps> = ({
  open,
  onOpenChange,
  category,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      category_code: '',
      category_name: '',
      description: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        category_code: category.category_code,
        category_name: category.category_name,
        description: category.description || '',
        status: category.status as 'Active' | 'Inactive',
      });
    } else {
      form.reset({
        category_code: '',
        category_name: '',
        description: '',
        status: 'Active',
      });
    }
  }, [category, form]);

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        category_code: data.category_code.toUpperCase(),
      };

      let result;
      if (category) {
        // Update existing category
        const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/business-categories/${category.category_id}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to update category');
        result = await response.json();
      } else {
        // Create new category
        const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/business-categories`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to create category');
        result = await response.json();
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Category ${category ? 'updated' : 'created'} successfully.`
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(result.error || `Failed to ${category ? 'update' : 'create'} category`);
      }
    } catch (error: any) {
      console.error('Error saving category:', error);
      
      // Handle unique constraint violations
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        form.setError('category_code', { 
          message: 'Category code already exists. Please use a different code.' 
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to ${category ? 'update' : 'create'} category. Please try again.`,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Business Category' : 'Create New Business Category'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Category Code */}
            <FormField
              control={form.control}
              name="category_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Code *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., MFG, RET, IT" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      maxLength={10}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Max 10 characters, uppercase letters, numbers, and underscores only
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Name */}
            <FormField
              control={form.control}
              name="category_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Manufacturing, Retail, IT Services" 
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional detailed description of the business category..." 
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
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
                {loading ? 'Saving...' : category ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditBusinessCategoryModal;