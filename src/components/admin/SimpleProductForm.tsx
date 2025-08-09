import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Simplified schema matching bulk upload template
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  provider_id: z.string().min(1, "Insurance provider is required"),
  line_of_business_id: z.string().min(1, "Line of business is required"),
  code: z.string().min(1, "Product code is required"),
  uin: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["Active", "Inactive"]),
  description: z.string().optional(),
  is_standard_product: z.boolean().default(false),
  supported_policy_types: z.array(z.string()).default(["New"]),
  vehicle_category: z.enum(["2W", "Car", "Commercial", "Miscellaneous"]).optional(),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Provider {
  id: string;
  provider_name: string;
}

interface LineOfBusiness {
  id: string;
  name: string;
}

interface SimpleProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SimpleProductForm = ({ product, onSuccess, onCancel }: SimpleProductFormProps) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [lobs, setLobs] = useState<LineOfBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderCode, setNewProviderCode] = useState("");
  const [creatingProvider, setCreatingProvider] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      provider_id: product?.provider_id || "",
      line_of_business_id: product?.line_of_business_id || "",
      code: product?.code || "",
      uin: product?.uin || "",
      category: product?.category || "",
      status: product?.status || "Active",
      description: product?.description || "",
      is_standard_product: product?.is_standard_product || false,
      supported_policy_types: product?.supported_policy_types || ["New"],
      vehicle_category: product?.vehicle_category || undefined,
      effective_from: product?.effective_from || "",
      effective_to: product?.effective_to || "",
    }
  });

  const selectedLOB = form.watch("line_of_business_id");

  useEffect(() => {
    fetchProviders();
    fetchLOBs();
  }, []);

  // Auto-set category based on LOB selection
  useEffect(() => {
    if (selectedLOB && lobs.length > 0) {
      const selectedLOBData = lobs.find(lob => lob.id === selectedLOB);
      if (selectedLOBData) {
        form.setValue("category", selectedLOBData.name);
      }
    }
  }, [selectedLOB, lobs, form]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('id, provider_name')
        .eq('status', 'Active')
        .order('provider_name');
      
      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error",
        description: "Failed to load insurance providers",
        variant: "destructive",
      });
    }
  };

  const checkProviderExists = async (providerName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('id')
        .ilike('provider_name', providerName.trim());
      
      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      console.error('Error checking provider:', error);
      return false;
    }
  };

  const createNewProvider = async () => {
    if (!newProviderName.trim()) {
      toast({
        title: "Error",
        description: "Provider name is required",
        variant: "destructive",
      });
      return;
    }

    setCreatingProvider(true);
    try {
      // Check for duplicates
      const exists = await checkProviderExists(newProviderName);
      if (exists) {
        toast({
          title: "Error",
          description: "Provider with this name already exists",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('insurance_providers')
        .insert([{
          provider_name: newProviderName.trim(),
          irdai_code: newProviderCode.trim() || null,
          status: 'Active'
        }])
        .select('id, provider_name')
        .single();

      if (error) throw error;

      // Add to providers list and select it
      setProviders(prev => [...prev, data]);
      form.setValue("provider_id", data.id);
      
      // Reset form and close dialog
      setNewProviderName("");
      setNewProviderCode("");
      setShowProviderDialog(false);
      
      toast({
        title: "Success",
        description: "New provider created and selected",
      });
    } catch (error: any) {
      console.error('Error creating provider:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create provider",
        variant: "destructive",
      });
    } finally {
      setCreatingProvider(false);
    }
  };

  const fetchLOBs = async () => {
    try {
      const { data, error } = await supabase
        .from('line_of_business')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setLobs(data || []);
    } catch (error) {
      console.error('Error fetching LOBs:', error);
      toast({
        title: "Error",
        description: "Failed to load lines of business",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const productData = {
        name: data.name,
        provider_id: data.provider_id,
        line_of_business_id: data.line_of_business_id,
        code: data.code,
        uin: data.uin || null,
        category: data.category,
        status: data.status,
        description: data.description || null,
        is_standard_product: data.is_standard_product,
        supported_policy_types: data.supported_policy_types as ("New" | "Renewal" | "Top-Up" | "Portability" | "Rollover" | "Converted")[],
        vehicle_category: data.vehicle_category || null,
        effective_from: data.effective_from ? new Date(data.effective_from).toISOString().split('T')[0] : null,
        effective_to: data.effective_to ? new Date(data.effective_to).toISOString().split('T')[0] : null,
        // Required fields with default values
        coverage_type: "Individual" as const,
        premium_type: "Fixed" as const,
        min_sum_insured: 0,
        max_sum_insured: 1000000,
      };

      if (product) {
        const { error } = await supabase
          .from('insurance_products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('insurance_products')
          .insert([productData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const policyTypeOptions = ["New", "Renewal", "Top-Up", "Portability", "Rollover", "Converted"];
  const selectedPolicyTypes = form.watch("supported_policy_types");

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Create New Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Provider and LOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Insurance Provider *</FormLabel>
                      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="h-8">
                            <Plus className="h-4 w-4 mr-1" />
                            Add New
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Insurance Provider</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Provider Name *</label>
                              <Input
                                value={newProviderName}
                                onChange={(e) => setNewProviderName(e.target.value)}
                                placeholder="Enter provider name"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">IRDAI Code (Optional)</label>
                              <Input
                                value={newProviderCode}
                                onChange={(e) => setNewProviderCode(e.target.value)}
                                placeholder="Enter IRDAI code"
                                className="mt-1"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowProviderDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="button" 
                                onClick={createNewProvider}
                                disabled={creatingProvider}
                              >
                                {creatingProvider ? "Creating..." : "Create Provider"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select insurance provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.provider_name}
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
                name="line_of_business_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Line of Business *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select line of business" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lobs.map((lob) => (
                          <SelectItem key={lob.id} value={lob.id}>
                            {lob.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* UIN and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="uin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UIN (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter UIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            {/* Policy Types */}
            <FormField
              control={form.control}
              name="supported_policy_types"
              render={() => (
                <FormItem>
                  <FormLabel>Supported Policy Types</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {policyTypeOptions.map((type) => (
                      <FormField
                        key={type}
                        control={form.control}
                        name="supported_policy_types"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={type}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== type
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {type}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vehicle Category (only for Motor LOB) */}
            {selectedLOB && lobs.find(lob => lob.id === selectedLOB)?.name === "Motor" && (
              <FormField
                control={form.control}
                name="vehicle_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2W">Two-Wheeler</SelectItem>
                        <SelectItem value="Car">Private Car</SelectItem>
                        <SelectItem value="Commercial">Commercial Vehicle</SelectItem>
                        <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Standard Product Checkbox */}
            <FormField
              control={form.control}
              name="is_standard_product"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Standard Product</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Effective Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Effective To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      placeholder="Enter product description" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};