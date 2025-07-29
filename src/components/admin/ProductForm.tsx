import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  provider_id: z.string().min(1, "Provider is required"),
  code: z.string().min(1, "Product code is required"),
  category: z.enum(["Health", "Life", "Motor", "Travel", "Property", "Personal Accident"]),
  coverage_type: z.enum(["Individual", "Family Floater"]),
  min_sum_insured: z.number().min(1, "Minimum sum insured must be greater than 0"),
  max_sum_insured: z.number().min(1, "Maximum sum insured must be greater than 0"),
  premium_type: z.enum(["Fixed", "Slab", "Age-based"]),
  status: z.enum(["Active", "Discontinued"]),
  description: z.string().optional(),
  api_mapping_key: z.string().optional(),
  eligibility_criteria: z.string().optional()
}).refine((data) => data.max_sum_insured >= data.min_sum_insured, {
  message: "Maximum sum insured must be greater than or equal to minimum sum insured",
  path: ["max_sum_insured"]
});

type ProductFormData = z.infer<typeof productSchema>;

interface Provider {
  id: string;
  provider_name: string;
}

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [features, setFeatures] = useState<string[]>(product?.features || []);
  const [newFeature, setNewFeature] = useState("");
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      provider_id: product?.provider_id || "",
      code: product?.code || "",
      category: product?.category || "Health",
      coverage_type: product?.coverage_type || "Individual",
      min_sum_insured: product?.min_sum_insured || 0,
      max_sum_insured: product?.max_sum_insured || 0,
      premium_type: product?.premium_type || "Fixed",
      status: product?.status || "Active",
      description: product?.description || "",
      api_mapping_key: product?.api_mapping_key || "",
      eligibility_criteria: product?.eligibility_criteria || ""
    }
  });

  useEffect(() => {
    fetchProviders();
  }, []);

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
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setBrochureFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setUploading(true);
    try {
      let brochureFilePath = product?.brochure_file_path;

      // Upload brochure if new file selected
      if (brochureFile) {
        const productId = product?.id || crypto.randomUUID();
        const fileName = `${productId}/${Date.now()}-${brochureFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-brochures')
          .upload(fileName, brochureFile);
        
        if (uploadError) throw uploadError;
        brochureFilePath = fileName;
      }

      const productData = {
        name: data.name,
        provider_id: data.provider_id,
        code: data.code,
        category: data.category,
        coverage_type: data.coverage_type,
        min_sum_insured: data.min_sum_insured,
        max_sum_insured: data.max_sum_insured,
        premium_type: data.premium_type,
        status: data.status,
        description: data.description || null,
        api_mapping_key: data.api_mapping_key || null,
        eligibility_criteria: data.eligibility_criteria || null,
        features: features.length > 0 ? features : null,
        brochure_file_path: brochureFilePath
      };

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('insurance_products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;
        toast({ title: "Product updated successfully!" });
      } else {
        // Create new product
        const { error } = await supabase
          .from('insurance_products')
          .insert([productData]);
        
        if (error) throw error;
        toast({ title: "Product created successfully!" });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>
          {product ? "Edit Product" : "Add New Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Life">Life</SelectItem>
                        <SelectItem value="Motor">Motor</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Property">Property</SelectItem>
                        <SelectItem value="Personal Accident">Personal Accident</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverage_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select coverage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Family Floater">Family Floater</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="premium_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select premium type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Slab">Slab</SelectItem>
                        <SelectItem value="Age-based">Age-based</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_sum_insured"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Sum Insured (₹)*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_sum_insured"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Sum Insured (₹)*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_mapping_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Mapping Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional API mapping key" {...field} />
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
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eligibility_criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Criteria</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter eligibility criteria..." 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Brochure (PDF)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="brochure-upload"
                />
                <label htmlFor="brochure-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload brochure</span>
                  <span className="text-xs text-gray-400">PDF files only, up to 10MB</span>
                </label>
                
                {brochureFile && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm">Selected: {brochureFile.name}</span>
                  </div>
                )}
                
                {product?.brochure_file_path && !brochureFile && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <span className="text-sm text-blue-600">Current brochure uploaded</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Saving..." : product ? "Update" : "Create"} Product
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};