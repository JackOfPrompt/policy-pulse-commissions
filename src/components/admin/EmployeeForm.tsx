// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

const employeeSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  branch_id: z.string().optional(),
  joining_date: z.string().min(1, "Joining date is required"),
  status: z.string().min(1, "Status is required"),
  has_login: z.boolean().default(false),
  username: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
  onSuccess: () => void;
}

export const EmployeeForm = ({ open, onOpenChange, employee, onSuccess }: EmployeeFormProps) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [files, setFiles] = useState<{
    id_proof?: File;
    offer_letter?: File;
    resume?: File;
  }>({});
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_id: "",
      name: "",
      email: "",
      phone: "",
      role: "",
      branch_id: "",
      joining_date: new Date().toISOString().split('T')[0],
      status: "Active",
      has_login: false,
      username: "",
    },
  });

  useEffect(() => {
    fetchBranches();
    if (employee) {
      form.reset({
        employee_id: employee.employee_id || "",
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        role: employee.role || "",
        branch_id: employee.branch_id || "",
        joining_date: employee.joining_date || new Date().toISOString().split('T')[0],
        status: employee.status || "Active",
        has_login: employee.has_login || false,
        username: employee.username || "",
      });
    } else {
      generateEmployeeId();
    }
  }, [employee, form]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("status", "Active")
        .order("name");

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const generateEmployeeId = async () => {
    try {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });
      
      const nextId = (count || 0) + 1;
      form.setValue("employee_id", `EMP${nextId.toString().padStart(4, "0")}`);
    } catch (error) {
      console.error("Error generating employee ID:", error);
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [field]: file || undefined
    }));
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .upload(path, file);

    if (error) throw error;
    return data.path;
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    try {
      let employeeData: any = { ...data };

      // Upload files if any
      if (files.id_proof) {
        const path = await uploadFile(files.id_proof, `${data.employee_id}/id_proof_${Date.now()}`);
        employeeData.id_proof_file_path = path;
      }
      if (files.offer_letter) {
        const path = await uploadFile(files.offer_letter, `${data.employee_id}/offer_letter_${Date.now()}`);
        employeeData.offer_letter_file_path = path;
      }
      if (files.resume) {
        const path = await uploadFile(files.resume, `${data.employee_id}/resume_${Date.now()}`);
        employeeData.resume_file_path = path;
      }

      if (employee) {
        const { error } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", employee.id);
        if (error) throw error;
        toast({ title: "Employee updated successfully" });
      } else {
        const { error } = await supabase
          .from("employees")
          .insert(employeeData);
        if (error) throw error;
        toast({ title: "Employee created successfully" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
      setFiles({});
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    "Admin",
    "Operations",
    "Finance",
    "Support",
    "Manager",
    "HR",
    "IT",
    "Sales",
    "Marketing"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!employee} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
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
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
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
                name="branch_id"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="joining_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Joining</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
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
                        <SelectItem value="Resigned">Resigned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Document Upload Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Upload Documents</h3>
              
              {[
                { key: "id_proof", label: "ID Proof" },
                { key: "offer_letter", label: "Offer Letter" },
                { key: "resume", label: "Resume" }
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label htmlFor={key} className="text-sm font-medium">
                    {label}
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id={key}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {files[key as keyof typeof files] && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileChange(key, null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Login Credentials Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="has_login"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Create Login Credentials</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable login access for this employee
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

              {form.watch("has_login") && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : employee ? "Update Employee" : "Create Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};