import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface PolicyStatusChangeModalProps {
  policyId: string;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PolicyStatusChangeModal = ({ 
  policyId, 
  currentStatus, 
  isOpen, 
  onClose, 
  onSuccess 
}: PolicyStatusChangeModalProps) => {
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowedStatuses, setAllowedStatuses] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAllowedStatuses();
    }
  }, [isOpen, currentStatus]);

  const fetchAllowedStatuses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all possible statuses
      const allStatuses: Array<'Underwriting' | 'Issued' | 'Rejected' | 'Cancelled' | 'Free Look Cancellation'> = 
        ['Underwriting', 'Issued', 'Rejected', 'Cancelled', 'Free Look Cancellation'];
      
      // Filter based on current status and user permissions
      const allowed: string[] = [];
      
      for (const status of allStatuses) {
        if (status === currentStatus) continue; // Can't transition to same status
        
        const { data, error } = await supabase.rpc('can_transition_policy_status', {
          current_status: currentStatus as any,
          new_status: status as any,
          user_id: user.id
        });
        
        if (!error && data) {
          allowed.push(status);
        }
      }
      
      setAllowedStatuses(allowed);
    } catch (error: any) {
      console.error('Error fetching allowed statuses:', error);
    }
  };

  const handleSubmit = async () => {
    if (!newStatus) {
      toast({
        title: "Error",
        description: "Please select a new status",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Verify employee exists and is active
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, role, status')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

      if (employeeError || !employee) {
        throw new Error("Employee verification failed. Only active employees can change policy status.");
      }

      // Verify user role permissions for this status change
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !userRole) {
        throw new Error("Unable to verify user permissions. Contact administrator.");
      }

      // Double-check transition permission
      const { data: canTransition, error: transitionError } = await supabase.rpc('can_transition_policy_status', {
        current_status: currentStatus as any,
        new_status: newStatus as any,
        user_id: user.id
      });

      if (transitionError || !canTransition) {
        throw new Error(`You don't have permission to change status from ${currentStatus} to ${newStatus}`);
      }

      const { error } = await supabase
        .from('policies_new')
        .update({
          policy_status: newStatus as any,
          status_updated_by: user.id,
          status_updated_at: new Date().toISOString(),
          remarks: remarks || null
        })
        .eq('id', policyId);

      if (error) throw error;

      // Add remarks to status history if provided
      if (remarks.trim()) {
        const { error: historyError } = await supabase
          .from('policy_status_history')
          .insert({
            policy_id: policyId,
            previous_status: currentStatus as any,
            new_status: newStatus as any,
            updated_by: user.id,
            remarks: remarks.trim()
          });

        if (historyError) {
          console.error('Error adding status history remarks:', historyError);
        }
      }

      // Trigger email alert for critical status changes
      const alertStatuses = ['Free Look Cancellation', 'Rejected', 'Cancelled'];
      if (alertStatuses.includes(newStatus)) {
        try {
          // Get policy details for the alert
          const { data: policyData, error: policyError } = await supabase
            .from("policies_with_details")
            .select("policy_number, line_of_business, product_name, insurer_name")
            .eq("id", policyId)
            .single();

          if (policyError) {
            console.error('Error fetching policy details for alert:', policyError);
          } else if (policyData) {
            // Get employee details for user role
            const { data: employeeData } = await supabase
              .from('employees')
              .select('name, role')
              .eq('user_id', user.id)
              .single();

            console.log('Sending policy status alert...', {
              policyId,
              policyNumber: policyData.policy_number,
              newStatus,
              previousStatus: currentStatus
            });

            const { data: alertResponse, error: alertError } = await supabase.functions.invoke('send-policy-status-alert', {
              body: {
                policyId: policyId,
                policyNumber: policyData.policy_number,
                newStatus: newStatus,
                previousStatus: currentStatus,
                updatedBy: user.email || employeeData?.name || 'Unknown User',
                updatedByRole: employeeData?.role || 'Unknown',
                comment: remarks || null,
                productName: policyData.product_name || 'Unknown Product',
                lineOfBusiness: policyData.line_of_business,
                customerName: "N/A" // Customer name not available in this view
              }
            });

            if (alertError) {
              console.error("Error sending status alert:", alertError);
            } else {
              console.log("Status alert sent successfully:", alertResponse);
            }
          }
        } catch (alertError) {
          console.error("Error in alert process:", alertError);
          // Don't fail the main operation if alert fails
        }
      }

      toast({
        title: "Success",
        description: "Policy status updated successfully"
      });

      onSuccess();
      onClose();
      setNewStatus("");
      setRemarks("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update policy status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isSensitiveTransition = (status: string) => {
    return ['Cancelled', 'Free Look Cancellation', 'Rejected'].includes(status);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Policy Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Current Status</Label>
            <div className="mt-1 p-2 bg-muted rounded-md text-sm">
              {currentStatus}
            </div>
          </div>

          <div>
            <Label htmlFor="newStatus">New Status *</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allowedStatuses.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No status transitions available for your role
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional comments about this status change..."
              className="mt-1"
              rows={3}
            />
          </div>

          {newStatus && isSensitiveTransition(newStatus) && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground">
                  This is a sensitive status change that may affect commissions and payouts.
                  Please ensure this action is authorized.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !newStatus || allowedStatuses.length === 0}
          >
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};