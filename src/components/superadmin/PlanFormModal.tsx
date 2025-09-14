import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EntityFormModal } from "./shared/EntityFormModal";
import { Plan, PlanFormData } from "@/types/superadmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type PlanFormSchema = z.infer<typeof planSchema>;

const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  billing_cycle: z.enum(['monthly', 'yearly']),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  max_users: z.number().min(-1, "Must be -1 for unlimited or positive number"),
  max_policies: z.number().min(-1, "Must be -1 for unlimited or positive number"),
  status: z.enum(['active', 'inactive'])
});

interface PlanFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null;
  onSubmit: (data: PlanFormData) => Promise<boolean>;
}

export function PlanFormModal({ open, onOpenChange, plan, onSubmit }: PlanFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PlanFormSchema>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      billing_cycle: "monthly",
      features: [],
      max_users: 5,
      max_policies: 100,
      status: "active"
    }
  });

  const watchedFeatures = watch("features");

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        features: plan.features || [],
        max_users: plan.max_users,
        max_policies: plan.max_policies,
        status: plan.status
      });
    } else {
      reset({
        name: "",
        description: "",
        price: 0,
        billing_cycle: "monthly",
        features: [],
        max_users: 5,
        max_policies: 100,
        status: "active"
      });
    }
  }, [plan, reset]);

  const handleFormSubmit = async (data: PlanFormSchema) => {
    setLoading(true);
    const success = await onSubmit(data as PlanFormData);
    setLoading(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !watchedFeatures.includes(newFeature.trim())) {
      setValue("features", [...watchedFeatures, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setValue("features", watchedFeatures.filter((_, i) => i !== index));
  };

  return (
    <EntityFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={plan ? "Edit Plan" : "Create New Plan"}
      description={plan ? "Update the plan details" : "Create a new subscription plan"}
      loading={loading}
      onSubmit={handleSubmit(handleFormSubmit)}
      submitLabel={plan ? "Update Plan" : "Create Plan"}
      size="lg"
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Professional"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value: 'active' | 'inactive') => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Brief description of the plan"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (INR)</Label>
            <Input
              id="price"
              type="number"
              {...register("price", { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_cycle">Billing Cycle</Label>
            <Select
              value={watch("billing_cycle")}
              onValueChange={(value: 'monthly' | 'yearly') => setValue("billing_cycle", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_users">Max Users</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="max_users"
                type="number"
                {...register("max_users", { valueAsNumber: true })}
                placeholder="-1 for unlimited"
              />
              <div className="flex items-center space-x-1">
                <Switch
                  checked={watch("max_users") === -1}
                  onCheckedChange={(checked) => setValue("max_users", checked ? -1 : 5)}
                />
                <Label className="text-xs">Unlimited</Label>
              </div>
            </div>
            {errors.max_users && (
              <p className="text-sm text-destructive">{errors.max_users.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_policies">Max Policies</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="max_policies"
                type="number"
                {...register("max_policies", { valueAsNumber: true })}
                placeholder="-1 for unlimited"
              />
              <div className="flex items-center space-x-1">
                <Switch
                  checked={watch("max_policies") === -1}
                  onCheckedChange={(checked) => setValue("max_policies", checked ? -1 : 100)}
                />
                <Label className="text-xs">Unlimited</Label>
              </div>
            </div>
            {errors.max_policies && (
              <p className="text-sm text-destructive">{errors.max_policies.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Features</Label>
          <div className="flex space-x-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <Button type="button" onClick={addFeature} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {watchedFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
              {watchedFeatures.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {errors.features && (
            <p className="text-sm text-destructive">{errors.features.message}</p>
          )}
        </div>
      </form>
    </EntityFormModal>
  );
}