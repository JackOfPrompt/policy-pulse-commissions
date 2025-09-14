import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePolicies, useCustomers, useProductTypes, type Policy, type PolicyFormData } from "@/hooks/usePolicies";
import { useAgents } from "@/hooks/useAgents";
import { useEmployees } from "@/hooks/useEmployees";

type PolicyFormSchema = z.infer<typeof policySchema>;

const policySchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  agent_id: z.string().optional(),
  employee_id: z.string().optional(),
  product_type_id: z.string().min(1, "Product type is required"),
  policy_number: z.string().min(1, "Policy number is required"),
  provider: z.string().optional(),
  plan_name: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  issue_date: z.string().optional(),
  premium_without_gst: z.number().min(0).optional(),
  gst: z.number().min(0).optional(),
  premium_with_gst: z.number().min(0).optional(),
});

interface PolicyFormProps {
  policy?: Policy;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PolicyForm({ policy, onSuccess, onCancel }: PolicyFormProps) {
  const { createPolicy, updatePolicy } = usePolicies();
  const { customers } = useCustomers();
  const { productTypes } = useProductTypes();
  const { agents } = useAgents();
  const { employees } = useEmployees();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PolicyFormSchema>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      customer_id: policy?.customer_id || "",
      agent_id: policy?.agent_id || "",
      employee_id: policy?.employee_id || "",
      product_type_id: policy?.product_type_id || "",
      policy_number: policy?.policy_number || "",
      provider: policy?.provider || "",
      plan_name: policy?.plan_name || "",
      start_date: policy?.start_date || "",
      end_date: policy?.end_date || "",
      issue_date: policy?.issue_date || "",
      premium_without_gst: policy?.premium_without_gst || 0,
      gst: policy?.gst || 0,
      premium_with_gst: policy?.premium_with_gst || 0,
    },
  });

  // Calculate premium with GST when base premium or GST changes
  const watchPremiumWithoutGst = form.watch("premium_without_gst");
  const watchGst = form.watch("gst");

  useEffect(() => {
    if (watchPremiumWithoutGst && watchGst) {
      const totalPremium = Number(watchPremiumWithoutGst) + Number(watchGst);
      form.setValue("premium_with_gst", totalPremium);
    }
  }, [watchPremiumWithoutGst, watchGst, form]);

  const onSubmit = async (data: PolicyFormSchema) => {
    setIsSubmitting(true);
    try {
      if (policy) {
        await updatePolicy(policy.id, data as PolicyFormData);
      } else {
        await createPolicy(data as PolicyFormData);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save policy:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Selection */}
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Type Selection */}
          <FormField
            control={form.control}
            name="product_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Policy Number */}
          <FormField
            control={form.control}
            name="policy_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter policy number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Provider */}
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <Input placeholder="Enter insurance provider" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Plan Name */}
          <FormField
            control={form.control}
            name="plan_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter plan name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Agent Selection */}
          <FormField
            control={form.control}
            name="agent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.agent_name} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Fields */}
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
                          format(new Date(field.value), "PPP")
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
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
                          format(new Date(field.value), "PPP")
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Premium Fields */}
          <FormField
            control={form.control}
            name="premium_without_gst"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premium (without GST)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter premium amount" 
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
            name="gst"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter GST amount" 
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
            name="premium_with_gst"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Premium (with GST)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Total premium" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
          </Button>
        </div>
      </form>
    </Form>
  );
}