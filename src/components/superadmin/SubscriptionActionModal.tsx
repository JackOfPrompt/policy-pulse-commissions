import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EntityFormModal } from "./shared/EntityFormModal";
import { Subscription } from "@/types/superadmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

const extendSchema = z.object({
  months: z.number().min(1, "Must extend by at least 1 month").max(24, "Cannot extend by more than 24 months")
});

const cancelSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters")
});

interface SubscriptionActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  action: 'extend' | 'cancel' | null;
  onExtend?: (id: string, months: number) => Promise<boolean>;
  onCancel?: (id: string, reason: string) => Promise<boolean>;
}

export function SubscriptionActionModal({ 
  open, 
  onOpenChange, 
  subscription, 
  action,
  onExtend,
  onCancel
}: SubscriptionActionModalProps) {
  const [loading, setLoading] = useState(false);

  const extendForm = useForm({
    resolver: zodResolver(extendSchema),
    defaultValues: { months: 12 }
  });

  const cancelForm = useForm({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" }
  });

  const handleExtendSubmit = async (data: { months: number }) => {
    if (!subscription || !onExtend) return;
    
    setLoading(true);
    const success = await onExtend(subscription.id, data.months);
    setLoading(false);
    
    if (success) {
      onOpenChange(false);
      extendForm.reset();
    }
  };

  const handleCancelSubmit = async (data: { reason: string }) => {
    if (!subscription || !onCancel) return;
    
    setLoading(true);
    const success = await onCancel(subscription.id, data.reason);
    setLoading(false);
    
    if (success) {
      onOpenChange(false);
      cancelForm.reset();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNewEndDate = (months: number) => {
    if (!subscription?.nextBilling) return '';
    const current = new Date(subscription.nextBilling);
    const newDate = new Date(current.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
    return formatDate(newDate.toISOString());
  };

  if (!subscription || !action) return null;

  if (action === 'extend') {
    return (
      <EntityFormModal
        open={open}
        onOpenChange={onOpenChange}
        title="Extend Subscription"
        description={`Extend the subscription for ${subscription.organizationName}`}
        loading={loading}
        onSubmit={extendForm.handleSubmit(handleExtendSubmit)}
        submitLabel="Extend Subscription"
        size="md"
      >
        <div className="space-y-4">
          {/* Subscription Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Current Subscription</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Organization:</span>
                <p className="font-medium">{subscription.organizationName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Plan:</span>
                <p className="font-medium">{subscription.planName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Current End Date:</span>
                <p className="font-medium">{formatDate(subscription.nextBilling)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Monthly Amount:</span>
                <p className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: subscription.currency }).format(subscription.monthlyAmount)}</p>
              </div>
            </div>
          </div>

          {/* Extension Form */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="months">Extension Period</Label>
              <Select
                value={extendForm.watch("months").toString()}
                onValueChange={(value) => extendForm.setValue("months", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                </SelectContent>
              </Select>
              {extendForm.formState.errors.months && (
                <p className="text-sm text-destructive">{extendForm.formState.errors.months.message}</p>
              )}
            </div>

            {/* New End Date Preview */}
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 text-success">
                <Clock className="h-4 w-4" />
                <span className="font-medium">New End Date</span>
              </div>
              <p className="text-sm mt-1">
                {calculateNewEndDate(extendForm.watch("months"))}
              </p>
            </div>
          </div>
        </div>
      </EntityFormModal>
    );
  }

  if (action === 'cancel') {
    return (
      <EntityFormModal
        open={open}
        onOpenChange={onOpenChange}
        title="Cancel Subscription"
        description={`Cancel the subscription for ${subscription.organizationName}`}
        loading={loading}
        onSubmit={cancelForm.handleSubmit(handleCancelSubmit)}
        submitLabel="Cancel Subscription"
        size="md"
      >
        <div className="space-y-4">
          {/* Warning */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-sm mt-1">
              This action will immediately cancel the subscription. The organization will lose access to paid features at the end of their current billing period.
            </p>
          </div>

          {/* Subscription Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Organization:</span>
                <p className="font-medium">{subscription.organizationName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Plan:</span>
                <p className="font-medium">{subscription.planName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">End Date:</span>
                <p className="font-medium">{formatDate(subscription.nextBilling)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Monthly Amount:</span>
                <p className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: subscription.currency }).format(subscription.monthlyAmount)}</p>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Textarea
              id="reason"
              {...cancelForm.register("reason")}
              placeholder="Please provide a detailed reason for cancelling this subscription..."
              rows={4}
            />
            {cancelForm.formState.errors.reason && (
              <p className="text-sm text-destructive">{cancelForm.formState.errors.reason.message}</p>
            )}
          </div>
        </div>
      </EntityFormModal>
    );
  }

  return null;
}