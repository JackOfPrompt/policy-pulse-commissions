import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generatePolicyNumber, validatePolicyNumber } from '@/utils/policyNumberGenerator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Save, X } from "lucide-react";
import { PolicyDocumentUpload } from "@/components/ui/policy-document-upload";

const policySchema = z.object({
  policy_number: z.string().min(1, "Policy number is required").refine(validatePolicyNumber, "Invalid policy number format"),
  insurer_id: z.string().min(1, "Insurer is required"),
  product_id: z.string().min(1, "Product is required"),
  line_of_business: z.string().min(1, "Line of business is required"),
  policy_start_date: z.string().min(1, "Start date is required"),
  policy_end_date: z.string().min(1, "End date is required"),
  policy_mode: z.enum(["Annual", "Half-Yearly", "Quarterly", "Monthly", "Single", "Multi-year"]).optional(),
  premium_amount: z.string().min(1, "Premium amount is required"),
  sum_assured: z.string().optional(),
  policy_type: z.enum(["New", "Renewal", "Roll-over", "Ported"]).optional(),
  policy_source: z.enum(["Online", "Offline"]).optional(),
  created_by_type: z.enum(["Agent", "Employee"]),
  agent_id: z.string().optional(),
  employee_id: z.string().optional(),
  branch_id: z.string().optional(),
  status: z.enum(["Active", "Cancelled", "Expired", "Lapsed", "Renewed", "Pending"]).optional(),
  remarks: z.string().optional(),
}).refine((data) => {
  // Validation logic: if created_by_type is Agent, agent_id is required
  if (data.created_by_type === "Agent") {
    return data.agent_id && data.agent_id.length > 0;
  }
  // Validation logic: if created_by_type is Employee, employee_id is required
  if (data.created_by_type === "Employee") {
    return data.employee_id && data.employee_id.length > 0;
  }
  return true;
}, {
  message: "Agent ID is required when Created By Type is Agent, Employee ID is required when Created By Type is Employee",
  path: ["created_by_type"]
});

interface PolicyFormProps {
  onClose: () => void;
  onSuccess: () => void;
  policy?: any;
}

const PolicyForm = ({ onClose, onSuccess, policy }: PolicyFormProps) => {
  const [currentTab, setCurrentTab] = useState("core");
  const [insurers, setInsurers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [lineOfBusinessOptions, setLineOfBusinessOptions] = useState<any[]>([]);
  const [createdPolicyId, setCreatedPolicyId] = useState<string | null>(policy?.id || null);
  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    fetchInsurers();
    fetchProducts();
    fetchAgents();
    fetchEmployees();
    fetchBranches();
    fetchLineOfBusinessOptions();
  }, []);

  const fetchInsurers = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('id, provider_name')
        .eq('status', 'Active')
        .order('provider_name');
      
      if (error) throw error;
      setInsurers(data || []);
    } catch (error) {
      console.error('Error fetching insurers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_products')
        .select('id, name, provider_id, category')
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, agent_code')
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_id')
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchLineOfBusinessOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('line_of_business')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setLineOfBusinessOptions(data || []);
    } catch (error) {
      console.error('Error fetching line of business options:', error);
      toast({
        title: "Error",
        description: "Failed to fetch line of business options",
        variant: "destructive",
      });
    }
  };

  const form = useForm<z.infer<typeof policySchema>>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      policy_number: policy?.policy_number || "",
      insurer_id: policy?.insurer_id || "",
      product_id: policy?.product_id || "",
      line_of_business: policy?.line_of_business || "",
      policy_start_date: policy?.policy_start_date || "",
      policy_end_date: policy?.policy_end_date || "",
      premium_amount: policy?.premium_amount?.toString() || "",
      sum_assured: policy?.sum_assured?.toString() || "",
      created_by_type: policy?.created_by_type || "Employee",
      agent_id: policy?.agent_id || "",
      employee_id: policy?.employee_id || "",
      status: policy?.status || "Active",
      remarks: policy?.remarks || "",
    },
  });

  // Update line of business default when options are loaded
  useEffect(() => {
    if (lineOfBusinessOptions.length > 0 && !policy?.line_of_business && !form.watch("line_of_business")) {
      form.setValue("line_of_business", lineOfBusinessOptions[0].name);
    }
  }, [lineOfBusinessOptions, policy, form]);

  const lineOfBusiness = form.watch("line_of_business");
  const selectedInsurer = form.watch("insurer_id");
  const selectedLineOfBusiness = form.watch("line_of_business");

  // Filter products based on selected insurer and line of business
  const filteredProducts = products.filter(product => {
    const matchesInsurer = !selectedInsurer || product.provider_id === selectedInsurer;
    const matchesLOB = !selectedLineOfBusiness || product.category === selectedLineOfBusiness;
    return matchesInsurer && matchesLOB;
  });

  const onSubmit = async (values: z.infer<typeof policySchema>) => {
    try {
      const policyData = {
        policy_number: values.policy_number,
        insurer_id: values.insurer_id,
        product_id: values.product_id,
        line_of_business: values.line_of_business,
        policy_start_date: values.policy_start_date,
        policy_end_date: values.policy_end_date,
        policy_mode: values.policy_mode || null,
        premium_amount: parseFloat(values.premium_amount),
        sum_assured: values.sum_assured ? parseFloat(values.sum_assured) : null,
        policy_type: values.policy_type || null,
        policy_source: values.policy_source || null,
        created_by_type: values.created_by_type,
        agent_id: values.created_by_type === "Agent" ? values.agent_id : null,
        employee_id: values.created_by_type === "Employee" ? values.employee_id : null,
        branch_id: values.branch_id || null,
        status: values.status || 'Active',
        policy_status: policy ? policy.policy_status : 'Underwriting', // Default to Underwriting for new policies
        remarks: values.remarks || null,
      };

      if (policy) {
        const { error } = await supabase
          .from("policies_new")
          .update(policyData)
          .eq("id", policy.id);
        
        if (error) throw error;
      } else {
        const { data: newPolicy, error } = await supabase
          .from("policies_new")
          .insert(policyData)
          .select('id')
          .single();
        
        if (error) throw error;
        setCreatedPolicyId(newPolicy.id);
      }

      toast({
        title: "Success",
        description: policy ? "Policy updated successfully" : "Policy created successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {policy ? "Edit Policy" : "Create New Policy"}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="core">Core Details</TabsTrigger>
              <TabsTrigger value="specific" disabled={!lineOfBusiness}>
                {lineOfBusiness} Details
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="core" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="policy_number">Policy Number *</Label>
                      <Input {...form.register("policy_number")} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-6"
                      onClick={async () => {
                        const generatedNumber = await generatePolicyNumber();
                        form.setValue("policy_number", generatedNumber);
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                  {form.formState.errors.policy_number && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.policy_number.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="insurer_id">Insurance Provider *</Label>
                  <Select 
                    value={form.watch("insurer_id") || undefined} 
                    onValueChange={(value) => {
                      form.setValue("insurer_id", value);
                      // Reset product selection when insurer changes
                      form.setValue("product_id", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {insurers.map((insurer) => (
                        <SelectItem key={insurer.id} value={insurer.id}>
                          {insurer.provider_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="product_id">Insurance Product *</Label>
                  <Select 
                    value={form.watch("product_id") || undefined} 
                    onValueChange={(value) => form.setValue("product_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance product" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="line_of_business">Line of Business *</Label>
                  <Select 
                    value={form.watch("line_of_business")} 
                    onValueChange={(value) => {
                      form.setValue("line_of_business", value);
                      // Reset product selection when line of business changes
                      form.setValue("product_id", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select line of business" />
                    </SelectTrigger>
                    <SelectContent>
                      {lineOfBusinessOptions.map((lob) => (
                        <SelectItem key={lob.id} value={lob.name}>
                          {lob.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.line_of_business && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.line_of_business.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="policy_start_date">Policy Start Date *</Label>
                  <Input type="date" {...form.register("policy_start_date")} />
                </div>

                <div>
                  <Label htmlFor="policy_end_date">Policy End Date *</Label>
                  <Input type="date" {...form.register("policy_end_date")} />
                </div>

                <div>
                  <Label htmlFor="premium_amount">Premium Amount *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...form.register("premium_amount")} 
                  />
                </div>

                <div>
                  <Label htmlFor="sum_assured">Sum Assured</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...form.register("sum_assured")} 
                  />
                </div>

                <div>
                  <Label htmlFor="policy_type">Policy Type</Label>
                  <Select 
                    value={form.watch("policy_type") || undefined} 
                    onValueChange={(value) => form.setValue("policy_type", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                      <SelectItem value="Roll-over">Roll-over</SelectItem>
                      <SelectItem value="Ported">Ported</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="created_by_type">Created By Type *</Label>
                  <Select 
                    value={form.watch("created_by_type")} 
                    onValueChange={(value) => {
                      form.setValue("created_by_type", value as any);
                      // Clear the other field when switching types
                      if (value === "Agent") {
                        form.setValue("employee_id", "");
                      } else {
                        form.setValue("agent_id", "");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select creator type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agent">Agent</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.created_by_type && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.created_by_type.message}
                    </p>
                  )}
                </div>

                {form.watch("created_by_type") === "Agent" && (
                  <div>
                    <Label htmlFor="agent_id">Agent *</Label>
                    <Select 
                      value={form.watch("agent_id") || undefined} 
                      onValueChange={(value) => form.setValue("agent_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} ({agent.agent_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.watch("created_by_type") === "Employee" && (
                  <div>
                    <Label htmlFor="employee_id">Employee *</Label>
                    <Select 
                      value={form.watch("employee_id") || undefined} 
                      onValueChange={(value) => form.setValue("employee_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.employee_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="branch_id">Branch</Label>
                  <Select 
                    value={form.watch("branch_id") || undefined} 
                    onValueChange={(value) => form.setValue("branch_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={form.watch("status") || undefined} 
                    onValueChange={(value) => form.setValue("status", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                      <SelectItem value="Lapsed">Lapsed</SelectItem>
                      <SelectItem value="Renewed">Renewed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea {...form.register("remarks")} rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="specific" className="space-y-4">
              {lineOfBusiness === "Motor" && <MotorPolicyForm />}
              {lineOfBusiness === "Life" && <LifePolicyForm />}
              {lineOfBusiness === "Health" && <HealthPolicyForm />}
              {lineOfBusiness === "Commercial" && <CommercialPolicyForm />}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <PolicyDocumentUpload 
                policyId={createdPolicyId || undefined}
                policyNumber={form.watch("policy_number")}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              {policy ? "Update Policy" : "Create Policy"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Motor Policy specific form component
const MotorPolicyForm = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Motor Insurance Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Vehicle Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="car">Car</SelectItem>
            <SelectItem value="bike">Bike</SelectItem>
            <SelectItem value="commercial-vehicle">Commercial Vehicle</SelectItem>
            <SelectItem value="tractor">Tractor</SelectItem>
            <SelectItem value="ev">Electric Vehicle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Registration Number</Label>
        <Input placeholder="Enter registration number" />
      </div>
      
      <div>
        <Label>Manufacturer</Label>
        <Input placeholder="Enter manufacturer" />
      </div>
      
      <div>
        <Label>Model</Label>
        <Input placeholder="Enter model" />
      </div>
    </div>
  </div>
);

// Life Policy specific form component
const LifePolicyForm = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Life Insurance Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Proposer Name</Label>
        <Input placeholder="Enter proposer name" />
      </div>
      
      <div>
        <Label>Life Assured Name</Label>
        <Input placeholder="Enter life assured name" />
      </div>
      
      <div>
        <Label>Plan Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select plan type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="term">Term</SelectItem>
            <SelectItem value="endowment">Endowment</SelectItem>
            <SelectItem value="money-back">Money Back</SelectItem>
            <SelectItem value="ulip">ULIP</SelectItem>
            <SelectItem value="whole-life">Whole Life</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Policy Term (Years)</Label>
        <Input type="number" placeholder="Enter policy term" />
      </div>
    </div>
  </div>
);

// Health Policy specific form component
const HealthPolicyForm = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Health Insurance Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Proposer Name</Label>
        <Input placeholder="Enter proposer name" />
      </div>
      
      <div>
        <Label>Coverage Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select coverage type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="floater">Family Floater</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Sum Insured</Label>
        <Input type="number" placeholder="Enter sum insured" />
      </div>
      
      <div>
        <Label>Policy Term (Years)</Label>
        <Input type="number" placeholder="Enter policy term" />
      </div>
    </div>
  </div>
);

// Commercial Policy specific form component
const CommercialPolicyForm = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Commercial Insurance Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Policy Category</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fire">Fire</SelectItem>
            <SelectItem value="marine">Marine</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="property">Property</SelectItem>
            <SelectItem value="liability">Liability</SelectItem>
            <SelectItem value="cyber">Cyber</SelectItem>
            <SelectItem value="others">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Business Type</Label>
        <Input placeholder="Enter business type" />
      </div>
      
      <div>
        <Label>Risk Address</Label>
        <Textarea placeholder="Enter risk address" />
      </div>
      
      <div>
        <Label>Number of Employees</Label>
        <Input type="number" placeholder="Enter employee count" />
      </div>
    </div>
  </div>
);

export default PolicyForm;