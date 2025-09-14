import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import departmentsData from "@/data/master/departments.json";
import statesData from "@/data/master/states.json";

const branchSchema = z.object({
  branch_name: z.string().min(1, "Branch name is required"),
  address: z.string().min(1, "Address is required"),
  landmark: z.string().optional(),
  city: z.string().min(1, "City is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  region: z.string().min(1, "Region is required"),
  department: z.string().min(1, "Department is required"),
  sub_department: z.string().optional(),
  status: z.string().default("active"),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface AddBranchModalProps {
  onBranchAdded: () => void;
}

export default function AddBranchModal({ onBranchAdded }: AddBranchModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      branch_name: "",
      address: "",
      landmark: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      region: "",
      department: "",
      sub_department: "",
      status: "active",
    },
  });

  const selectedDepartment = form.watch("department");

  const onSubmit = async (data: BranchFormData) => {
    try {
      setLoading(true);

      // For now, we'll just show success toast and log the data
      // In a real implementation, this would save to Supabase
      console.log('Branch data to save:', data);

      toast({
        title: "Success",
        description: "Branch added successfully",
      });

      form.reset();
      setOpen(false);
      onBranchAdded();
    } catch (error) {
      console.error('Error adding branch:', error);
      toast({
        title: "Error", 
        description: "Failed to add branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border z-50">
        <DialogHeader>
          <DialogTitle>Add New Branch</DialogTitle>
          <DialogDescription>
            Create a new branch location with department assignment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branch_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mumbai Central Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50 max-h-[200px] overflow-y-auto">
                        <SelectItem value="north">North</SelectItem>
                        <SelectItem value="south">South</SelectItem>
                        <SelectItem value="east">East</SelectItem>
                        <SelectItem value="west">West</SelectItem>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="northeast">Northeast</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Department *</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("sub_department", ""); // Reset sub-department when department changes
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50 max-h-[200px] overflow-y-auto">
                        {Object.entries(departmentsData).map(([key, dept]) => (
                          <SelectItem key={key} value={key}>
                            {dept.label}
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
                name="sub_department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Department</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!selectedDepartment}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select sub department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50 max-h-[200px] overflow-y-auto">
                        {selectedDepartment && departmentsData[selectedDepartment as keyof typeof departmentsData]?.sub_departments?.map((subDept) => (
                          <SelectItem key={subDept.id} value={subDept.id}>
                            {subDept.label}
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
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50 max-h-[200px] overflow-y-auto">
                        {statesData.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.label}
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
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 400001" maxLength={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter complete branch address..."
                      className="min-h-[80px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="landmark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landmark</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Near City Mall" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Branch"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}