// @ts-nocheck
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
import { ImageUpload } from "@/components/ui/image-upload";
import { Upload, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  provider_id: z.string().min(1, "Provider is required"),
  line_of_business_id: z.string().min(1, "Line of business is required"),
  code: z.string().optional(),
  uin: z.string().optional(),
  product_type: z.string().optional(),
  min_entry_age: z.number().optional(),
  max_entry_age: z.number().optional(),
  coverage_type: z.enum(["Individual", "Family Floater", "Comprehensive"]),
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
}).refine((data) => !data.max_entry_age || !data.min_entry_age || data.max_entry_age >= data.min_entry_age, {
  message: "Maximum entry age must be greater than or equal to minimum entry age",
  path: ["max_entry_age"]
});

type ProductFormData = z.infer<typeof productSchema>;

interface Provider {
  provider_id: string;
  insurer_name: string;
}

interface LineOfBusiness {
  lob_id: string;
  lob_name: string;
}

interface ProviderLOB {
  line_of_business_id: string;
  line_of_business: LineOfBusiness;
}

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnhancedProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableLOBs, setAvailableLOBs] = useState<LineOfBusiness[]>([]);
  const [policyVariants, setPolicyVariants] = useState<string[]>(product?.policy_variants || []);
  const [features, setFeatures] = useState<string[]>(product?.features || []);
  const [newFeature, setNewFeature] = useState("");
  const [newVariant, setNewVariant] = useState("");
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [logoPath, setLogoPath] = useState<string>(product?.logo_file_path || "");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      provider_id: product?.provider_id || "",
      line_of_business_id: product?.line_of_business_id || "",
      code: product?.code || "",
      uin: product?.uin || "",
      product_type: product?.product_type || "",
      min_entry_age: product?.min_entry_age || undefined,
      max_entry_age: product?.max_entry_age || undefined,
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

  const selectedProviderId = form.watch("provider_id");

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProviderId) {
      fetchProviderLOBs(selectedProviderId);
      // Reset LOB selection when provider changes
      if (!product || product.provider_id !== selectedProviderId) {
        form.setValue("line_of_business_id", "");
      }
    } else {
      setAvailableLOBs([]);
    }
  }, [selectedProviderId, form, product]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('provider_id, insurer_name')
        .eq('status', 'Active')
        .order('insurer_name');
      
      if (error) throw error;
      setProviders((data as any) || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchProviderLOBs = async (providerId: string) => {
  try {
    // Fallback: show all active LOBs
    const { data: allLOBs, error: lobError } = await supabase
      .from('lines_of_business')
      .select('lob_id, lob_name')
      .eq('is_active', true)
      .order('lob_name');
    
    if (lobError) {
      console.error('Error fetching all LOBs:', lobError);
      setAvailableLOBs([]);
    } else {
      setAvailableLOBs((allLOBs as any) || []);
    }
  } catch (error) {
    console.error('Error in fetchProviderLOBs:', error);
    setAvailableLOBs([]);
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

  const addVariant = () => {
    if (newVariant.trim() && !policyVariants.includes(newVariant.trim())) {
      setPolicyVariants([...policyVariants, newVariant.trim()]);
      setNewVariant("");
    }
  };

  const removeVariant = (index: number) => {
    setPolicyVariants(policyVariants.filter((_, i) => i !== index));
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
        line_of_business_id: data.line_of_business_id,
        code: data.code || null,
        uin: data.uin || null,
        product_type: data.product_type || null,
        min_entry_age: data.min_entry_age || null,
        max_entry_age: data.max_entry_age || null,
        category: selectedLOB?.lob_name || null,
        coverage_type: data.coverage_type,
        min_sum_insured: data.min_sum_insured,
        max_sum_insured: data.max_sum_insured,
        premium_type: data.premium_type,
        status: data.status,
        description: data.description || null,
        api_mapping_key: data.api_mapping_key || null,
        eligibility_criteria: data.eligibility_criteria || null,
        features: features.length > 0 ? features : null,
        policy_variants: policyVariants.length > 0 ? policyVariants : null,
        brochure_file_path: brochureFilePath,
        logo_file_path: logoPath || null
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

  const selectedLOB = availableLOBs.find(lob => lob.lob_id === form.watch("line_of_business_id"));

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {product ? "Edit Product" : "Add New Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.provider_id} value={provider.provider_id}>
                            {provider.insurer_name}
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
                    <FormLabel>Line of Business*</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Category is auto-filled based on LOB name
                      }}
                      value={field.value}
                      disabled={!selectedProviderId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedProviderId 
                              ? "Select provider first" 
                              : availableLOBs.length === 0 
                                ? "No LOBs linked to this provider"
                                : "Select line of business"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLOBs.length === 0 && selectedProviderId ? (
                          <SelectItem value="no-lobs" disabled>
                            No LOBs available.
                          </SelectItem>
                        ) : (
                          availableLOBs.map((lob) => (
                            <SelectItem key={lob.lob_id} value={lob.lob_id}>
                              {lob.lob_name}
                            </SelectItem>
                          ))
                        )}
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
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product code (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IRDAI UIN Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter UIN code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedLOB?.lob_name === 'Motor' && (
                          <>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Renewal">Renewal</SelectItem>
                            <SelectItem value="Top-up">Top-up</SelectItem>
                            <SelectItem value="Portability">Portability</SelectItem>
                          </>
                        )}
                        {selectedLOB?.lob_name === 'Life' && (
                          <>
                            <SelectItem value="Term">Term</SelectItem>
                            <SelectItem value="ULIP">ULIP</SelectItem>
                            <SelectItem value="Endowment">Endowment</SelectItem>
                          </>
                        )}
                        {selectedLOB?.lob_name === 'Health' && (
                          <>
                            <SelectItem value="Individual">Individual</SelectItem>
                            <SelectItem value="Floater">Floater</SelectItem>
                            <SelectItem value="Group">Group</SelectItem>
                          </>
                        )}
                        {!selectedLOB && (
                          <SelectItem value="no-lob-selected" disabled>Select LOB first</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_entry_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Entry Age</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="18" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_entry_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Entry Age</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="65" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select coverage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Family Floater">Family Floater</SelectItem>
                        <SelectItem value="Comprehensive">Comprehensive</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {selectedLOB && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Category (Auto-filled)</Label>
                <p className="text-sm text-muted-foreground mt-1">
Based on selected line of business: <span className="font-medium">{selectedLOB.lob_name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 To add a new LOB for a provider, go to LOB tab
                </p>
              </div>
            )}

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

            {/* Policy Variants */}
            <div className="space-y-3">
              <Label>Policy Variants</Label>
              <div className="flex gap-2">
                <Input
                  value={newVariant}
                  onChange={(e) => setNewVariant(e.target.value)}
                  placeholder="Add a policy variant (e.g., Base Plan, Add-On A)..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                />
                <Button type="button" variant="outline" onClick={addVariant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {policyVariants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {policyVariants.map((variant, index) => (
                    <div key={index} className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                      <span className="text-sm">{variant}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Features */}
            <div className="space-y-3">
              <Label>Product Features</Label>
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
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Logo Upload */}
            <div className="space-y-3">
              <ImageUpload
                value={logoPath}
                onChange={setLogoPath}
                label="Product Logo"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                maxSize={2 * 1024 * 1024}
                bucketName="product-brochures"
                folder="logos"
              />
            </div>

            {/* Brochure Upload */}
            <div className="space-y-3">
              <Label>Upload Product Brochure (PDF)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="brochure-upload"
                />
                <label htmlFor="brochure-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Click to upload brochure</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF files only, up to 10MB</span>
                  {brochureFile && (
                    <span className="text-xs text-primary mt-2">Selected: {brochureFile.name}</span>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={uploading || !selectedLOB} className="flex-1">
                {uploading ? "Saving..." : (product ? "Update Product" : "Create Product")}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};