import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Policy, PolicyFormData } from "@/hooks/usePolicies";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, DollarSign, Shield, Car, Heart, Users } from "lucide-react";

interface EnhancedPolicyFormData extends PolicyFormData {
  policy_status?: string;
  dynamic_details?: any;
}

interface EnhancedEditPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
  onSave: (id: string, data: Partial<EnhancedPolicyFormData>) => Promise<{ success: boolean; error?: string }>;
}

export function EnhancedEditPolicyModal({ open, onOpenChange, policy, onSave }: EnhancedEditPolicyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<EnhancedPolicyFormData>>({});

  useEffect(() => {
    if (policy) {
      setFormData({
        policy_number: policy.policy_number,
        provider: policy.provider || "",
        plan_name: policy.plan_name || "",
        start_date: policy.start_date || "",
        end_date: policy.end_date || "",
        issue_date: policy.issue_date || "",
        premium_without_gst: policy.premium_without_gst || 0,
        gst: policy.gst || 0,
        premium_with_gst: policy.premium_with_gst || 0,
        policy_status: policy.policy_status || "active",
        dynamic_details: policy.dynamic_details || {},
      });
    }
  }, [policy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;

    setLoading(true);
    try {
      const result = await onSave(policy.id, formData);
      if (result.success) {
        toast({
          title: "Success",
          description: "Policy updated successfully",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (value === "" && (field === 'premium_without_gst' || field === 'gst' || field === 'premium_with_gst')) {
      value = 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDynamicDetailChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      dynamic_details: {
        ...prev.dynamic_details,
        [field]: value
      }
    }));
  };

  if (!policy) return null;

  const productType = typeof policy.product_type === 'string' 
    ? policy.product_type 
    : policy.product_type?.category?.toLowerCase();

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policy Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="policy_number">Policy Number *</Label>
            <Input
              id="policy_number"
              value={formData.policy_number || ""}
              onChange={(e) => handleInputChange("policy_number", e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={formData.provider || ""}
              onChange={(e) => handleInputChange("provider", e.target.value)}
              placeholder="Insurance provider name"
            />
          </div>

          <div>
            <Label htmlFor="plan_name">Plan Name</Label>
            <Input
              id="plan_name"
              value={formData.plan_name || ""}
              onChange={(e) => handleInputChange("plan_name", e.target.value)}
              placeholder="Insurance plan name"
            />
          </div>

          <div>
            <Label htmlFor="policy_status">Policy Status</Label>
            <Select 
              value={formData.policy_status || "active"} 
              onValueChange={(value) => handleInputChange("policy_status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="issue_date">Issue Date</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date || ""}
              onChange={(e) => handleInputChange("issue_date", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date || ""}
              onChange={(e) => handleInputChange("start_date", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date || ""}
              onChange={(e) => handleInputChange("end_date", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Premium Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="premium_without_gst">Premium (Without GST)</Label>
            <Input
              id="premium_without_gst"
              type="number"
              step="0.01"
              value={formData.premium_without_gst || ""}
              onChange={(e) => handleInputChange("premium_without_gst", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="gst">GST Amount</Label>
            <Input
              id="gst"
              type="number"
              step="0.01"
              value={formData.gst || ""}
              onChange={(e) => handleInputChange("gst", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="premium_with_gst">Total Premium (With GST)</Label>
            <Input
              id="premium_with_gst"
              type="number"
              step="0.01"
              value={formData.premium_with_gst || ""}
              onChange={(e) => handleInputChange("premium_with_gst", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExtractedDetails = () => (
    <div className="space-y-6">
      {/* Coverage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Coverage Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sum_assured">Sum Assured</Label>
            <Input
              id="sum_assured"
              type="number"
              step="0.01"
              value={formData.dynamic_details?.sum_assured || ""}
              onChange={(e) => handleDynamicDetailChange("sum_assured", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="sum_insured">Sum Insured</Label>
            <Input
              id="sum_insured"
              type="number"
              step="0.01"
              value={formData.dynamic_details?.sum_insured || ""}
              onChange={(e) => handleDynamicDetailChange("sum_insured", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="policy_term">Policy Term (Years)</Label>
            <Input
              id="policy_term"
              type="number"
              value={formData.dynamic_details?.policy_term || ""}
              onChange={(e) => handleDynamicDetailChange("policy_term", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="premium_payment_term">Premium Payment Term (Years)</Label>
            <Input
              id="premium_payment_term"
              type="number"
              value={formData.dynamic_details?.premium_payment_term || ""}
              onChange={(e) => handleDynamicDetailChange("premium_payment_term", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="premium_frequency">Premium Frequency</Label>
            <Select 
              value={formData.dynamic_details?.premium_frequency || ""} 
              onValueChange={(value) => handleDynamicDetailChange("premium_frequency", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annually">Annually</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half-yearly">Half-yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maturity_date">Maturity Date</Label>
            <Input
              id="maturity_date"
              type="date"
              value={formData.dynamic_details?.maturity_date || ""}
              onChange={(e) => handleDynamicDetailChange("maturity_date", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Details for Motor Insurance */}
      {productType === 'motor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_make">Vehicle Make</Label>
              <Input
                id="vehicle_make"
                value={formData.dynamic_details?.vehicle_make || ""}
                onChange={(e) => handleDynamicDetailChange("vehicle_make", e.target.value)}
                placeholder="e.g., Maruti Suzuki"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_model">Vehicle Model</Label>
              <Input
                id="vehicle_model"
                value={formData.dynamic_details?.vehicle_model || ""}
                onChange={(e) => handleDynamicDetailChange("vehicle_model", e.target.value)}
                placeholder="e.g., Swift"
              />
            </div>

            <div>
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input
                id="registration_number"
                value={formData.dynamic_details?.registration_number || ""}
                onChange={(e) => handleDynamicDetailChange("registration_number", e.target.value)}
                placeholder="e.g., MH12AB1234"
              />
            </div>

            <div>
              <Label htmlFor="engine_number">Engine Number</Label>
              <Input
                id="engine_number"
                value={formData.dynamic_details?.engine_number || ""}
                onChange={(e) => handleDynamicDetailChange("engine_number", e.target.value)}
                placeholder="Engine number"
              />
            </div>

            <div>
              <Label htmlFor="chassis_number">Chassis Number</Label>
              <Input
                id="chassis_number"
                value={formData.dynamic_details?.chassis_number || ""}
                onChange={(e) => handleDynamicDetailChange("chassis_number", e.target.value)}
                placeholder="Chassis number"
              />
            </div>

            <div>
              <Label htmlFor="manufacturing_year">Manufacturing Year</Label>
              <Input
                id="manufacturing_year"
                type="number"
                value={formData.dynamic_details?.manufacturing_year || ""}
                onChange={(e) => handleDynamicDetailChange("manufacturing_year", parseInt(e.target.value) || 0)}
                placeholder="2023"
              />
            </div>

            <div>
              <Label htmlFor="idv">IDV (Insured Declared Value)</Label>
              <Input
                id="idv"
                type="number"
                step="0.01"
                value={formData.dynamic_details?.idv || ""}
                onChange={(e) => handleDynamicDetailChange("idv", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Coverage Details */}
      {productType === 'health' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Health Coverage Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="family_size">Family Size</Label>
              <Input
                id="family_size"
                type="number"
                value={formData.dynamic_details?.family_size || ""}
                onChange={(e) => handleDynamicDetailChange("family_size", parseInt(e.target.value) || 0)}
                placeholder="Number of members"
              />
            </div>

            <div>
              <Label htmlFor="co_pay">Co-payment (%)</Label>
              <Input
                id="co_pay"
                type="number"
                step="0.01"
                value={formData.dynamic_details?.co_pay || ""}
                onChange={(e) => handleDynamicDetailChange("co_pay", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="waiting_period">Waiting Period (Months)</Label>
              <Input
                id="waiting_period"
                type="number"
                value={formData.dynamic_details?.waiting_period || ""}
                onChange={(e) => handleDynamicDetailChange("waiting_period", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="room_rent_limit">Room Rent Limit (Per Day)</Label>
              <Input
                id="room_rent_limit"
                type="number"
                step="0.01"
                value={formData.dynamic_details?.room_rent_limit || ""}
                onChange={(e) => handleDynamicDetailChange("room_rent_limit", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="uin">UIN (Unique Identification Number)</Label>
            <Input
              id="uin"
              value={formData.dynamic_details?.uin || ""}
              onChange={(e) => handleDynamicDetailChange("uin", e.target.value)}
              placeholder="UIN number"
            />
          </div>

          <div>
            <Label htmlFor="policy_type">Policy Type</Label>
            <Input
              id="policy_type"
              value={formData.dynamic_details?.policy_type || ""}
              onChange={(e) => handleDynamicDetailChange("policy_type", e.target.value)}
              placeholder="e.g., Individual, Group"
            />
          </div>

          <div>
            <Label htmlFor="nominee_name">Nominee Name</Label>
            <Input
              id="nominee_name"
              value={formData.dynamic_details?.nominee_name || ""}
              onChange={(e) => handleDynamicDetailChange("nominee_name", e.target.value)}
              placeholder="Nominee full name"
            />
          </div>

          <div>
            <Label htmlFor="nominee_relationship">Nominee Relationship</Label>
            <Select 
              value={formData.dynamic_details?.nominee_relationship || ""} 
              onValueChange={(value) => handleDynamicDetailChange("nominee_relationship", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="son">Son</SelectItem>
                <SelectItem value="daughter">Daughter</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="brother">Brother</SelectItem>
                <SelectItem value="sister">Sister</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Policy - {policy.policy_number}</DialogTitle>
          <DialogDescription>
            Update policy information and extracted details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="extracted">Extracted Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-6">
              {renderBasicInfo()}
            </TabsContent>
            
            <TabsContent value="extracted" className="mt-6">
              {renderExtractedDetails()}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}