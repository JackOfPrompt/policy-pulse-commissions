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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X, Search } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMasterData } from "@/contexts/MasterDataContext";

const providerSchema = z.object({
  provider_name: z.string().min(2, "Provider name must be at least 2 characters"),
  irdai_code: z.string().min(3, "IRDAI code is required"),
  status: z.enum(["Active", "Inactive"]),
  contact_person: z.string().optional(),
  contact_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  support_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone_number: z.string().optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  head_office_address: z.string().optional(),
  logo_file_path: z.string().optional(),
  contract_start_date: z.date().optional(),
  contract_end_date: z.date().optional(),
  api_key: z.string().optional(),
  api_endpoint: z.string().url("Invalid URL format").optional().or(z.literal(""))
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface ProviderFormProps {
  provider?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProviderForm = ({ provider, onSuccess, onCancel }: ProviderFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uinProviders, setUinProviders] = useState<{insurer_name: string, line_of_business: string}[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<{insurer_name: string, line_of_business: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { uinCodes } = useMasterData();

  useEffect(() => {
    if (uinCodes.length > 0) {
      // Extract unique provider names and their line of business from UIN codes
      const uniqueProviders = uinCodes.reduce((acc: {insurer_name: string, line_of_business: string}[], curr: any) => {
        const existing = acc.find(p => p.insurer_name === curr.insurer_name);
        if (!existing) {
          acc.push({
            insurer_name: curr.insurer_name,
            line_of_business: curr.line_of_business
          });
        }
        return acc;
      }, []);
      
      setUinProviders(uniqueProviders);
      setFilteredProviders(uniqueProviders);
    }
  }, [uinCodes]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = uinProviders.filter(p => 
        p.insurer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.line_of_business.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(uinProviders);
    }
  }, [searchTerm, uinProviders]);

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      provider_name: provider?.provider_name || "",
      irdai_code: provider?.irdai_code || "",
      status: provider?.status || "Active",
      contact_person: provider?.contact_person || "",
      contact_email: provider?.contact_email || "",
      support_email: provider?.support_email || "",
      phone_number: provider?.phone_number || "",
      website: provider?.website || "",
      head_office_address: provider?.head_office_address || "",
      logo_file_path: provider?.logo_file_path || "",
      contract_start_date: provider?.contract_start_date ? new Date(provider.contract_start_date) : undefined,
      contract_end_date: provider?.contract_end_date ? new Date(provider.contract_end_date) : undefined,
      api_key: provider?.api_key || "",
      api_endpoint: provider?.api_endpoint || ""
    }
  });

  const handleProviderSelect = (selectedProvider: {insurer_name: string, line_of_business: string}) => {
    form.setValue('provider_name', selectedProvider.insurer_name);
    setSearchTerm(selectedProvider.insurer_name);
  };

  const onSubmit = async (data: ProviderFormData) => {
    setUploading(true);
    try {
      let documentsFolder = provider?.documents_folder;

      // Upload files if any
      if (files.length > 0) {
        const providerId = provider?.id || crypto.randomUUID();
        documentsFolder = `${providerId}`;
        
        for (const file of files) {
          const fileName = `${documentsFolder}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('provider-documents')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
        }
      }

      const providerData = {
        provider_name: data.provider_name,
        irdai_code: data.irdai_code,
        status: data.status,
        contact_person: data.contact_person || null,
        contact_email: data.contact_email || null,
        support_email: data.support_email || null,
        phone_number: data.phone_number || null,
        website: data.website || null,
        head_office_address: data.head_office_address || null,
        logo_file_path: data.logo_file_path || null,
        contract_start_date: data.contract_start_date?.toISOString().split('T')[0] || null,
        contract_end_date: data.contract_end_date?.toISOString().split('T')[0] || null,
        api_key: data.api_key || null,
        api_endpoint: data.api_endpoint || null,
        documents_folder: documentsFolder
      };

      if (provider) {
        // Update existing provider
        const { error } = await supabase
          .from('insurance_providers')
          .update(providerData)
          .eq('id', provider.id);
        
        if (error) throw error;
        toast({ title: "Provider updated successfully!" });
      } else {
        // Create new provider
        const { error } = await supabase
          .from('insurance_providers')
          .insert([providerData]);
        
        if (error) throw error;
        toast({ title: "Provider created successfully!" });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save provider",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {provider ? "Edit Provider" : "Add New Provider"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Provider details and identification</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="provider_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name*</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input 
                              placeholder="Search from UIN/IRDAI database or enter manually..." 
                              value={searchTerm || field.value}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              className="pl-10"
                            />
                          </div>
                          {searchTerm && filteredProviders.length > 0 && (
                            <div className="border border-border rounded-md bg-background shadow-lg max-h-48 overflow-y-auto z-50 absolute w-full">
                              {filteredProviders.slice(0, 10).map((provider, index) => (
                                <div
                                  key={index}
                                  className="p-3 hover:bg-muted cursor-pointer border-b border-border/50 last:border-b-0"
                                  onClick={() => handleProviderSelect(provider)}
                                >
                                  <div className="font-medium text-sm">{provider.insurer_name}</div>
                                  <div className="text-xs text-muted-foreground">LOB: {provider.line_of_business}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="irdai_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IRDAI Registration Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter IRDAI registration number" {...field} />
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
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="head_office_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Office Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter head office address"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://provider.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo_file_path"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          label="Upload Provider Logo"
                          accept=".png,.jpg,.jpeg,.svg"
                          maxSize={2 * 1024 * 1024}
                          bucketName="provider-documents"
                          folder="logos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                <p className="text-sm text-muted-foreground">Contact details and communication</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter contact phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter contact email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="support_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter support email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Regulatory & Contract Information Section */}
            <div className="space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="text-lg font-semibold text-foreground">Regulatory & Contract Information</h3>
                <p className="text-sm text-muted-foreground">Regulatory compliance and contract details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contract_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* API Integration Section */}
            <div className="space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="text-lg font-semibold text-foreground">API Integration</h3>
                <p className="text-sm text-muted-foreground">API configuration for integration</p>
              </div>

              <FormField
                control={form.control}
                name="api_endpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Endpoint</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.provider.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="text-lg font-semibold text-foreground">Documents</h3>
                <p className="text-sm text-muted-foreground">Upload supporting documents</p>
              </div>

              <div className="space-y-2">
                <Label>Upload Documents</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-400">PDF, DOC, JPG, PNG up to 10MB</span>
                  </label>
                </div>
                
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Saving..." : provider ? "Update" : "Create"} Provider
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};