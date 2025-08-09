import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

const agentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  agent_code: z.string().min(3, "Agent code is required"),
  agent_type: z.enum(["POSP", "MISP"]),
  branch_id: z.string().min(1, "Branch is required"),
  tier_id: z.string().min(1, "Agent tier is required"),
  referred_by_employee_id: z.string().optional(),
  joining_date: z.date().optional(),
  pan_number: z.string().min(10, "Valid PAN number required"),
  aadhar_number: z.string().min(12, "Valid Aadhar number required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  irdai_certified: z.boolean(),
  irdai_cert_number: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Suspended", "Terminated"])
}).refine((data) => {
  if (data.irdai_certified && !data.irdai_cert_number) {
    return false;
  }
  return true;
}, {
  message: "IRDAI certificate number is required when certified",
  path: ["irdai_cert_number"]
});

type AgentFormData = z.infer<typeof agentSchema>;

interface Branch {
  id: string;
  name: string;
}

interface AgentFormProps {
  agent?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AgentForm = ({ agent, onSuccess, onCancel }: AgentFormProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [files, setFiles] = useState<{
    pan: File | null;
    aadhar: File | null;
    irdai: File | null;
  }>({ pan: null, aadhar: null, irdai: null });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { tenantId } = useCurrentTenant();

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || "",
      agent_code: agent?.agent_code || "",
      agent_type: agent?.agent_type || "POSP",
      branch_id: agent?.branch_id || "",
      tier_id: agent?.tier_id || "",
      referred_by_employee_id: agent?.referred_by_employee_id || "",
      joining_date: agent?.joining_date ? new Date(agent.joining_date) : new Date(),
      pan_number: agent?.pan_number || "",
      aadhar_number: agent?.aadhar_number || "",
      phone: agent?.phone || "",
      email: agent?.email || "",
      irdai_certified: agent?.irdai_certified || false,
      irdai_cert_number: agent?.irdai_cert_number || "",
      status: agent?.status || "Active"
    }
  });

  const irdaiCertified = form.watch("irdai_certified");

  useEffect(() => {
    fetchBranches();
    fetchTiers();
    fetchEmployees();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id:branch_id, name:branch_name')
        .eq('status', 'Active')
        .order('branch_name');
      
      if (error) throw error;
      setBranches((data as any) || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_slabs')
        .select('id:slab_id, name')
        .order('name');
      
      if (error) throw error;
      setTiers((data as any) || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('employees')
        .select('employee_id, full_name, role, branch_id')
        .eq('status', 'Active')
        .order('full_name');
      
      if (error) throw error;
      const mapped = ((data as any[]) || []).map((e) => ({
        id: e.employee_id,
        name: e.full_name,
        role: e.role,
        branches: { name: '' },
      }));
      setEmployees(mapped);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleFileChange = (type: 'pan' | 'aadhar' | 'irdai', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const onSubmit = async (data: AgentFormData) => {
    setUploading(true);
    try {
      let filePaths = {
        pan_file_path: agent?.pan_file_path,
        aadhar_file_path: agent?.aadhar_file_path,
        irdai_file_path: agent?.irdai_file_path
      };

      // Upload files if any
      const agentId = (agent?.agent_id || agent?.id) || crypto.randomUUID();
      
      for (const [type, file] of Object.entries(files)) {
        if (file) {
          const fileName = `${agentId}/${type}-${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('agent-documents')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
          filePaths[`${type}_file_path` as keyof typeof filePaths] = fileName;
        }
      }

      const agentData = {
        full_name: data.name,
        agent_code: data.agent_code,
        agent_type: data.agent_type,
        branch_id: data.branch_id,
        aadhaar_number: data.aadhar_number,
        pan_number: data.pan_number,
        phone_number: data.phone,
        email: data.email,
        status: data.status,
        tenant_id: tenantId,
        kyc_documents: {
          pan_file_path: (filePaths as any).pan_file_path || null,
          aadhar_file_path: (filePaths as any).aadhar_file_path || null,
          irdai_file_path: (filePaths as any).irdai_file_path || null,
          irdai_certified: data.irdai_certified,
          irdai_cert_number: data.irdai_certified ? data.irdai_cert_number : null,
          joining_date: data.joining_date?.toISOString().split('T')[0] || null,
          referred_by_employee_id: data.referred_by_employee_id === "none" ? null : (data.referred_by_employee_id || null),
          tier_id: data.tier_id || null,
        }
      };

      if (agent) {
        // Update existing agent
        const { error } = await supabase
          .from('agents')
          .update(agentData as any)
          .eq('agent_id', (agent as any).agent_id || (agent as any).id);
        
        if (error) throw error;
        toast({ title: "Agent updated successfully!" });
      } else {
        // Create new agent
        const { error } = await supabase
          .from('agents')
          .insert([agentData as any]);
        
        if (error) throw error;
        toast({ title: "Agent created successfully!" });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving agent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save agent",
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
          {agent ? "Edit Agent" : "Add New Agent"}
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
                    <FormLabel>Full Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agent_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Code*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter agent code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agent_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POSP">POSP</SelectItem>
                        <SelectItem value="MISP">MISP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch*</FormLabel>
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
                name="tier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Tier*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name}
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
                name="referred_by_employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referred/Managed By</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.role} 
                            {employee.branches?.name && ` (${employee.branches.name})`}
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
                name="joining_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Joining</FormLabel>
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
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pan_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number*</FormLabel>
                    <FormControl>
                      <Input placeholder="ABCDE1234F" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aadhar_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aadhar Number*</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789012" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number*</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
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
                    <FormLabel>Email Address*</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="agent@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* IRDAI Certification */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="irdai_certified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">IRDAI Certified</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Is this agent IRDAI certified?
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

              {irdaiCertified && (
                <FormField
                  control={form.control}
                  name="irdai_cert_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IRDAI Certificate Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter certificate number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Upload Documents</Label>
              
              {/* PAN Upload */}
              <div className="space-y-2">
                <Label>PAN Card*</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('pan', e.target.files?.[0] || null)}
                    className="hidden"
                    id="pan-upload"
                  />
                  <label htmlFor="pan-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Upload PAN Card</span>
                  </label>
                  {files.pan && (
                    <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                      <span className="text-sm">{files.pan.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileChange('pan', null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Aadhar Upload */}
              <div className="space-y-2">
                <Label>Aadhar Card*</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('aadhar', e.target.files?.[0] || null)}
                    className="hidden"
                    id="aadhar-upload"
                  />
                  <label htmlFor="aadhar-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Upload Aadhar Card</span>
                  </label>
                  {files.aadhar && (
                    <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                      <span className="text-sm">{files.aadhar.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileChange('aadhar', null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* IRDAI Certificate Upload */}
              {irdaiCertified && (
                <div className="space-y-2">
                  <Label>IRDAI Certificate</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('irdai', e.target.files?.[0] || null)}
                      className="hidden"
                      id="irdai-upload"
                    />
                    <label htmlFor="irdai-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Upload IRDAI Certificate</span>
                    </label>
                    {files.irdai && (
                      <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                        <span className="text-sm">{files.irdai.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileChange('irdai', null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Saving..." : agent ? "Update" : "Create"} Agent
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};