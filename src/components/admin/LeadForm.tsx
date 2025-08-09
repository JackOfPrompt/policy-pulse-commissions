// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CityPincodeSelector } from "@/components/ui/city-pincode-selector";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const leadFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  lineOfBusiness: z.string().min(1, "Line of business is required"),
  productId: z.string().optional(),
  leadSource: z.enum(["Walk-in", "Website", "Referral", "Tele-calling", "Campaign", "API"]),
  assignedToType: z.enum(["Employee", "Agent"]).optional(),
  assignedToId: z.string().optional(),
  branchId: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  nextFollowUpDate: z.date().optional(),
  notes: z.string().optional()
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeadForm({ onSuccess, onCancel }: LeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [lineOfBusinessOptions, setLineOfBusinessOptions] = useState<any[]>([]);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      leadSource: "Walk-in",
      priority: "Medium"
    }
  });

  const selectedLOB = form.watch("lineOfBusiness");
  const selectedAssignedToType = form.watch("assignedToType");

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
    fetchAgents();
    fetchLineOfBusinessOptions();
  }, []);

  useEffect(() => {
    if (selectedLOB) {
      fetchProducts(selectedLOB);
    }
  }, [selectedLOB]);

  const fetchBranches = async () => {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .eq('status', 'Active')
      .order('name');
    if (data) setBranches(data);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name, role')
      .eq('status', 'Active')
      .order('name');
    if (data) setEmployees(data);
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('agents')
      .select('id, name, agent_code')
      .eq('status', 'Active')
      .order('name');
    if (data) setAgents(data);
  };

  const fetchLineOfBusinessOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('line_of_business')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      console.log('Lead form line of business options loaded:', data);
      setLineOfBusinessOptions(data || []);
    } catch (error) {
      console.error('Error fetching line of business options in lead form:', error);
    }
  };

  const fetchProducts = async (lob: string) => {
    const { data } = await supabase
      .from('insurance_products')
      .select('id, name, provider_id, insurance_providers(provider_name)')
      .eq('status', 'Active')
      .eq('category', lob)
      .order('name');
    if (data) setProducts(data);
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsLoading(true);
    try {
      // Get product provider if product selected
      let insuranceProviderId = null;
      if (data.productId) {
        const product = products.find(p => p.id === data.productId);
        insuranceProviderId = product?.provider_id;
      }

      const leadData = {
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        email: data.email || null,
        location: data.location || null,
        line_of_business: data.lineOfBusiness,
        product_id: data.productId || null,
        insurance_provider_id: insuranceProviderId,
        lead_source: data.leadSource,
        assigned_to_type: data.assignedToType || null,
        assigned_to_id: data.assignedToId || null,
        branch_id: data.branchId || null,
        priority: data.priority,
        next_follow_up_date: data.nextFollowUpDate ? format(data.nextFollowUpDate, 'yyyy-MM-dd') : null
      };

      const { error } = await supabase
        .from('leads')
        .insert(leadData);

      if (error) throw error;

      // Add follow-up if date is set
      if (data.nextFollowUpDate && data.notes) {
        const { data: leadResult } = await supabase
          .from('leads')
          .select('id')
          .eq('phone_number', data.phoneNumber)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (leadResult) {
          await supabase
            .from('lead_follow_ups')
            .insert({
              lead_id: leadResult.id,
              follow_up_date: format(data.nextFollowUpDate, 'yyyy-MM-dd'),
              notes: data.notes
            });
        }
      }

      toast.success("Lead created successfully");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create lead");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Lead</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="md:col-span-2">
                  <CityPincodeSelector
                    onCityChange={(city) => {
                      if (city) {
                        form.setValue('location', `${city.city_name}, ${city.state_name}`);
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="lineOfBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Line of Business *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear product selection when line of business changes
                        form.setValue("productId", "");
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select LOB" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lineOfBusinessOptions.map((lob) => (
                          <SelectItem key={lob.id} value={lob.name}>
                            {lob.name}
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
                name="productId"
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

              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Tele-calling">Tele-calling</SelectItem>
                        <SelectItem value="Campaign">Campaign</SelectItem>
                        <SelectItem value="API">API</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedToType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Person</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedAssignedToType === "Employee" && employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.role})
                          </SelectItem>
                        ))}
                        {selectedAssignedToType === "Agent" && agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} ({agent.agent_code})
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
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
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
                name="nextFollowUpDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next Follow-up Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any initial notes about the lead" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Lead
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}