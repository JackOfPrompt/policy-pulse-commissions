import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Policy } from "@/hooks/usePolicies";
import { format } from "date-fns";
import { Calendar, DollarSign, FileText, Shield, User, Users, Car, Heart, TrendingUp } from "lucide-react";

interface EnhancedViewPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
}

export function EnhancedViewPolicyModal({ open, onOpenChange, policy }: EnhancedViewPolicyModalProps) {
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

  const renderBasicInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policy Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
            <p className="font-mono text-lg">{policy.policy_number}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Product Type</label>
            <p className="capitalize">
              {typeof policy.product_type === 'string' 
                ? policy.product_type 
                : policy.product_type?.name || policy.product_type?.category || 'N/A'}
            </p>
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
            <p>{(policy.customer as any)?.email || policy.customers?.email || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone</label>
            <p>{(policy.customer as any)?.phone || policy.customers?.phone || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Address</label>
            <p className="text-sm">{(policy.customer as any)?.address || policy.customers?.address || "N/A"}</p>
          </div>
        </CardContent>
      </Card>

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
          {policy.dynamic_details?.gross_premium && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gross Premium</label>
              <p className="font-semibold">{formatCurrency(policy.dynamic_details.gross_premium)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderExtractedDetails = () => {
    if (!policy.dynamic_details) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No extracted details available for this policy.
          </CardContent>
        </Card>
      );
    }

    const details = policy.dynamic_details;
    const productType = typeof policy.product_type === 'string' 
      ? policy.product_type 
      : policy.product_type?.category?.toLowerCase();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coverage Details */}
        {(details.sum_assured || details.sum_insured || details.idv) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Coverage Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {details.sum_assured && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sum Assured</label>
                  <p className="font-semibold">{formatCurrency(details.sum_assured)}</p>
                </div>
              )}
              {details.sum_insured && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sum Insured</label>
                  <p className="font-semibold">{formatCurrency(details.sum_insured)}</p>
                </div>
              )}
              {details.idv && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IDV (Insured Declared Value)</label>
                  <p className="font-semibold">{formatCurrency(details.idv)}</p>
                </div>
              )}
              {details.policy_term && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Policy Term</label>
                  <p>{details.policy_term} years</p>
                </div>
              )}
              {details.premium_payment_term && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Premium Payment Term</label>
                  <p>{details.premium_payment_term} years</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vehicle Details (for Motor) */}
        {productType === 'motor' && (details.vehicle_make || details.vehicle_model || details.registration_number) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {details.vehicle_make && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Make</label>
                  <p>{details.vehicle_make}</p>
                </div>
              )}
              {details.vehicle_model && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Model</label>
                  <p>{details.vehicle_model}</p>
                </div>
              )}
              {details.registration_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                  <p className="font-mono">{details.registration_number}</p>
                </div>
              )}
              {details.engine_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Engine Number</label>
                  <p className="font-mono">{details.engine_number}</p>
                </div>
              )}
              {details.chassis_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Chassis Number</label>
                  <p className="font-mono">{details.chassis_number}</p>
                </div>
              )}
              {details.manufacturing_year && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Manufacturing Year</label>
                  <p>{details.manufacturing_year}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Health Coverage Details */}
        {productType === 'health' && (details.family_size || details.co_pay || details.waiting_period) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Health Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {details.family_size && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Family Size</label>
                  <p>{details.family_size} members</p>
                </div>
              )}
              {details.co_pay && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Co-payment</label>
                  <p>{details.co_pay}%</p>
                </div>
              )}
              {details.waiting_period && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Waiting Period</label>
                  <p>{details.waiting_period} months</p>
                </div>
              )}
              {details.room_rent_limit && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Room Rent Limit</label>
                  <p>{formatCurrency(details.room_rent_limit)} per day</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {details.uin && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">UIN</label>
                  <p className="font-mono text-sm">{details.uin}</p>
                </div>
              )}
              {details.policy_type && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Policy Type</label>
                  <p className="capitalize">{details.policy_type}</p>
                </div>
              )}
              {details.premium_frequency && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Premium Frequency</label>
                  <p className="capitalize">{details.premium_frequency}</p>
                </div>
              )}
              {details.maturity_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Maturity Date</label>
                  <p>{formatDate(details.maturity_date)}</p>
                </div>
              )}
              {details.nominee_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nominee</label>
                  <p>{details.nominee_name}</p>
                </div>
              )}
              {details.nominee_relationship && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nominee Relationship</label>
                  <p className="capitalize">{details.nominee_relationship}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        {details.benefits && Array.isArray(details.benefits) && details.benefits.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Policy Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {details.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="text-sm">{benefit}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Exclusions */}
        {details.exclusions && Array.isArray(details.exclusions) && details.exclusions.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Policy Exclusions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {details.exclusions.map((exclusion: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">{exclusion}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderBusinessSource = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {policy.agent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agent Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Agent Name</label>
              <p>{policy.agent.agent_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Agent Code</label>
              <p className="font-mono">{(policy.agent as any)?.agent_code || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{policy.agent.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p>{(policy.agent as any)?.phone || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {policy.employee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee Name</label>
              <p>{policy.employee.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee Code</label>
              <p className="font-mono">{(policy.employee as any)?.employee_code || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{policy.employee.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Designation</label>
              <p>{(policy.employee as any)?.designation || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!policy.agent && !policy.employee && (
        <Card className="md:col-span-2">
          <CardContent className="py-8 text-center text-muted-foreground">
            No business source information available.
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policy Details - {policy.policy_number}
          </DialogTitle>
          <DialogDescription>
            Complete information and extracted details for this policy
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="extracted">Extracted Details</TabsTrigger>
            <TabsTrigger value="business">Business Source</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-6">
            {renderBasicInfo()}
          </TabsContent>
          
          <TabsContent value="extracted" className="mt-6">
            {renderExtractedDetails()}
          </TabsContent>
          
          <TabsContent value="business" className="mt-6">
            {renderBusinessSource()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}