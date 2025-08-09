import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const providerLOBSchema = z.object({
  insurance_provider_id: z.string().min(1, "Provider is required"),
  line_of_business_id: z.string().min(1, "Line of Business is required"),
  effective_from: z.date(),
  effective_till: z.date().optional(),
  remarks: z.string().optional(),
  is_active: z.boolean().default(true)
});

type ProviderLOBFormData = z.infer<typeof providerLOBSchema>;

interface Provider {
  provider_id: string;
  insurer_name: string;
}

interface LineOfBusiness {
  lob_id: string;
  lob_name: string;
  description?: string;
}

interface ProviderLOBMapping {
  id: string;
  insurance_provider_id: string;
  line_of_business_id: string;
  effective_from: string;
  effective_till?: string;
  remarks?: string;
  is_active: boolean;
  provider_name: string;
  lob_name: string;
}

const ProviderLOB = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [lineOfBusiness, setLineOfBusiness] = useState<LineOfBusiness[]>([]);
  const [mappings, setMappings] = useState<ProviderLOBMapping[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProviderLOBMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<ProviderLOBFormData>({
    resolver: zodResolver(providerLOBSchema),
    defaultValues: {
      is_active: true,
      effective_from: new Date()
    }
  });

  useEffect(() => {
    fetchProviders();
    fetchLineOfBusiness();
  }, []);

  useEffect(() => {
    if (selectedProviderId) {
      fetchMappings();
    }
  }, [selectedProviderId]);

  const fetchProviders = async () => {
    try {
      const [providersRes, productsRes, uinRes] = await Promise.all([
        supabase
          .from('insurance_providers')
          .select('provider_id, insurer_name, status'),
        supabase
          .from('insurance_products')
          .select('provider_id, status'),
        supabase
          .from('master_uin_codes')
          .select('insurer_name, status, is_active')
      ]);

      if (providersRes.error) throw providersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (uinRes.error) throw uinRes.error;

      const activeProductProviderIds = new Set(
        (productsRes.data || [])
          .filter((p: any) => p.status === 'Active')
          .map((p: any) => p.provider_id)
      );

      const uinNames = new Set(
        (uinRes.data || [])
          .filter((u: any) => (u.status || '').toLowerCase() === 'active' && u.is_active === true)
          .map((u: any) => (u.insurer_name || '').trim().toLowerCase())
      );

      const filtered = (providersRes.data || [])
        .filter((p: any) =>
          p.status === 'Active' &&
          activeProductProviderIds.has(p.provider_id) &&
          uinNames.has((p.insurer_name || '').trim().toLowerCase())
        )
        .sort((a: any, b: any) => (a.insurer_name || '').localeCompare(b.insurer_name || ''));

      setProviders(filtered as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch providers",
        variant: "destructive"
      });
    }
  };

  const fetchLineOfBusiness = async () => {
    try {
      const [lobsRes, productsRes, uinRes] = await Promise.all([
        supabase
          .from('lines_of_business')
          .select('lob_id, lob_name, description, is_active'),
        supabase
          .from('insurance_products')
          .select('lob_id, status'),
        supabase
          .from('master_uin_codes')
          .select('line_of_business, status, is_active')
      ]);

      if (lobsRes.error) throw lobsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (uinRes.error) throw uinRes.error;

      const activeLobIds = new Set(
        (productsRes.data || [])
          .filter((p: any) => p.status === 'Active' && p.lob_id)
          .map((p: any) => p.lob_id)
      );

      const uinLobNames = new Set(
        (uinRes.data || [])
          .filter((u: any) => (u.status || '').toLowerCase() === 'active' && u.is_active === true)
          .map((u: any) => (u.line_of_business || '').trim().toLowerCase())
      );

      const filtered = (lobsRes.data || [])
        .filter((lob: any) =>
          lob.is_active === true &&
          activeLobIds.has(lob.lob_id) &&
          uinLobNames.has((lob.lob_name || '').trim().toLowerCase())
        )
        .sort((a: any, b: any) => (a.lob_name || '').localeCompare(b.lob_name || ''));

      setLineOfBusiness((filtered as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch line of business",
        variant: "destructive"
      });
    }
  };

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_line_of_business')
        .select(`
          *,
          insurance_providers(insurer_name),
          lines_of_business(lob_name)
        `)
        .eq('insurance_provider_id', selectedProviderId)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      
      const formattedMappings = (data || []).map(mapping => ({
        id: mapping.id,
        insurance_provider_id: mapping.insurance_provider_id,
        line_of_business_id: mapping.line_of_business_id,
        effective_from: mapping.effective_from,
        effective_till: mapping.effective_till,
        remarks: mapping.remarks,
        is_active: mapping.is_active,
        provider_name: mapping.insurance_providers?.insurer_name || '',
        lob_name: mapping.lines_of_business?.lob_name || ''
      }));
      
      setMappings(formattedMappings);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch provider LOB mappings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProviderLOBFormData) => {
    try {
      const mappingData = {
        insurance_provider_id: data.insurance_provider_id,
        line_of_business_id: data.line_of_business_id,
        effective_from: data.effective_from.toISOString().split('T')[0],
        effective_till: data.effective_till?.toISOString().split('T')[0] || null,
        remarks: data.remarks || null,
        is_active: data.is_active
      };

      if (editingMapping) {
        const { error } = await supabase
          .from('provider_line_of_business')
          .update(mappingData)
          .eq('id', editingMapping.id);
        
        if (error) throw error;
        toast({ title: "Mapping updated successfully!" });
      } else {
        const { error } = await supabase
          .from('provider_line_of_business')
          .insert([mappingData]);
        
        if (error) throw error;
        toast({ title: "Mapping created successfully!" });
      }

      setShowForm(false);
      setEditingMapping(null);
      form.reset();
      fetchMappings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save mapping",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (mapping: ProviderLOBMapping) => {
    setEditingMapping(mapping);
    form.reset({
      insurance_provider_id: mapping.insurance_provider_id,
      line_of_business_id: mapping.line_of_business_id,
      effective_from: new Date(mapping.effective_from),
      effective_till: mapping.effective_till ? new Date(mapping.effective_till) : undefined,
      remarks: mapping.remarks || "",
      is_active: mapping.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('provider_line_of_business')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      toast({ title: "Mapping deleted successfully!" });
      fetchMappings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete mapping",
        variant: "destructive"
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMapping(null);
    form.reset({
      is_active: true,
      effective_from: new Date()
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Provider Line of Business</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div></div>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="provider-select">Insurance Provider</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider to manage LOBs" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.provider_id} value={provider.provider_id}>
                      {provider.insurer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProviderId && (
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingMapping(null);
      form.reset({
        insurance_provider_id: selectedProviderId,
        is_active: true,
        effective_from: new Date()
      });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add LOB
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMapping ? "Edit" : "Add"} Line of Business Mapping
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="line_of_business_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Line of Business*</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select line of business" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                {lineOfBusiness.map((lob) => (
                  <SelectItem key={lob.lob_id} value={lob.lob_id}>
                    {lob.lob_name}
                  </SelectItem>
                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="effective_from"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Effective From*</FormLabel>
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
                          name="effective_till"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Effective Till</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any remarks or notes"
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
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Active Status
                              </FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Enable this LOB for the provider
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

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={handleFormClose}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingMapping ? "Update" : "Create"} Mapping
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mappings Table */}
      {selectedProviderId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Supported Lines of Business ({mappings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading mappings...
              </div>
            ) : mappings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No line of business mappings found for this provider
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line of Business</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective Till</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">
                        {mapping.lob_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(mapping.effective_from), 'PPP')}
                      </TableCell>
                      <TableCell>
                        {mapping.effective_till ? 
                          format(new Date(mapping.effective_till), 'PPP') : 
                          'Ongoing'
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mapping.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mapping.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {mapping.remarks || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(mapping)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(mapping.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderLOB;