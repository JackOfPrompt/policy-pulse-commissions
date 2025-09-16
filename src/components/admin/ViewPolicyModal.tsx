import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Policy } from "@/hooks/usePolicies";
import { format } from "date-fns";
import { Calendar, DollarSign, FileText, Shield, User } from "lucide-react";

interface ViewPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
}

export function ViewPolicyModal({ open, onOpenChange, policy }: ViewPolicyModalProps) {
  if (!policy) return null;

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policy Details
          </DialogTitle>
          <DialogDescription>
            Complete information for policy {policy.policy_number}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
                <p className="font-mono">{policy.policy_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                <p className="capitalize">{policy.product_type?.name || policy.product_type?.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Provider</label>
                <p>{policy.provider || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plan Name</label>
                <p>{policy.plan_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge className={getStatusColor(policy.policy_status)}>
                  {policy.policy_status || "Active"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p>{policy.customer ? `${policy.customer.first_name || ''} ${policy.customer.last_name || ''}`.trim() : "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{policy.customer?.email || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p>{policy.customer?.phone || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm">{policy.customer?.address || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                <p>{formatDate(policy.issue_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <p>{formatDate(policy.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                <p>{formatDate(policy.end_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p>{formatDate(policy.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Premium Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Premium Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Premium (Without GST)</label>
                <p className="font-semibold">{formatCurrency(policy.premium_without_gst)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">GST</label>
                <p>{formatCurrency(policy.gst)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Premium</label>
                <p className="font-semibold text-lg">{formatCurrency(policy.premium_with_gst)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Agent/Employee Information */}
          {(policy.agent || policy.employee) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Business Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {policy.agent && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Agent</label>
                    <p>{policy.agent.agent_name} ({policy.agent.email})</p>
                  </div>
                )}
                {policy.employee && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employee</label>
                    <p>{policy.employee.name} ({policy.employee.email})</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          {policy.dynamic_details && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>
                  Extracted information from policy document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                  {JSON.stringify(policy.dynamic_details, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}