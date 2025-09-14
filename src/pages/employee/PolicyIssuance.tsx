import { useState } from "react";
import { Save, Calculator, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import users from "@/data/users.json";
import productTypes from "@/data/master/product_types.json";

interface CommissionBreakdown {
  policy_id: string;
  product_type: string;
  commission_rate: number;
  reward_rate: number;
  total_rate: number;
}

export default function PolicyIssuance() {
  const user = users.employee;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [commission, setCommission] = useState<CommissionBreakdown | null>(null);
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState({
    policy_number: '',
    customer_id: '',
    product_type: '',
    provider: '',
    plan_name: '',
    premium_without_gst: '',
    premium_with_gst: '',
    start_date: '',
    end_date: '',
    sum_assured: ''
  });

  const calculateCommission = async (policyId: string) => {
    try {
      setCommissionError(null);
      const { data, error } = await supabase
        .rpc('get_commission', { p_policy_id: policyId });

      if (error) throw error;

      if (data && data.length > 0) {
        setCommission(data[0]);
      } else {
        setCommissionError('No payout grid found for this policy configuration');
        setCommission(null);
      }
    } catch (error) {
      console.error('Error calculating commission:', error);
      setCommissionError('Failed to calculate commission');
      setCommission(null);
    }
  };

  const handleSavePolicy = async () => {
    try {
      setLoading(true);

      // Basic validation
      if (!policyData.policy_number || !policyData.customer_id || !policyData.product_type) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Save policy to database
      const { data: policyResult, error: policyError } = await supabase
        .from('policies')
        .insert({
          policy_number: policyData.policy_number,
          customer_id: policyData.customer_id,
          product_type_id: policyData.product_type, // This should be a UUID in real implementation
          provider: policyData.provider,
          plan_name: policyData.plan_name,
          premium_without_gst: parseFloat(policyData.premium_without_gst) || 0,
          premium_with_gst: parseFloat(policyData.premium_with_gst) || 0,
          start_date: policyData.start_date,
          end_date: policyData.end_date,
          dynamic_details: {
            sum_assured: policyData.sum_assured
          },
          policy_status: 'active',
          org_id: user.id // This should be the actual org_id
        })
        .select()
        .single();

      if (policyError) throw policyError;

      toast({
        title: "Success",
        description: "Policy saved successfully",
      });

      // Immediately calculate commission
      if (policyResult) {
        await calculateCommission(policyResult.id);
      }

      // Reset form
      setPolicyData({
        policy_number: '',
        customer_id: '',
        product_type: '',
        provider: '',
        plan_name: '',
        premium_without_gst: '',
        premium_with_gst: '',
        start_date: '',
        end_date: '',
        sum_assured: ''
      });

    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: "Error",
        description: "Failed to save policy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCommissionAmount = (premium: number, rate: number) => {
    return (premium * rate / 100).toFixed(2);
  };

  return (
    <DashboardLayout role="employee" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Policy Issuance</h1>
            <p className="text-muted-foreground">
              Create new policy with automatic commission calculation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Policy Information</CardTitle>
                <CardDescription>
                  Enter policy details to create a new insurance policy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="policy_number">Policy Number *</Label>
                    <Input
                      id="policy_number"
                      value={policyData.policy_number}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, policy_number: e.target.value }))}
                      placeholder="POL-2024-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_id">Customer ID *</Label>
                    <Input
                      id="customer_id"
                      value={policyData.customer_id}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, customer_id: e.target.value }))}
                      placeholder="CUST-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_type">Product Type *</Label>
                    <Select 
                      value={policyData.product_type} 
                      onValueChange={(value) => setPolicyData(prev => ({ ...prev, product_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(productTypes).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="provider">Insurance Provider</Label>
                    <Input
                      id="provider"
                      value={policyData.provider}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, provider: e.target.value }))}
                      placeholder="HDFC ERGO"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="plan_name">Plan Name</Label>
                  <Input
                    id="plan_name"
                    value={policyData.plan_name}
                    onChange={(e) => setPolicyData(prev => ({ ...prev, plan_name: e.target.value }))}
                    placeholder="Health Protect Gold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="premium_without_gst">Premium (without GST)</Label>
                    <Input
                      id="premium_without_gst"
                      type="number"
                      value={policyData.premium_without_gst}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, premium_without_gst: e.target.value }))}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="premium_with_gst">Premium (with GST)</Label>
                    <Input
                      id="premium_with_gst"
                      type="number"
                      value={policyData.premium_with_gst}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, premium_with_gst: e.target.value }))}
                      placeholder="11800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sum_assured">Sum Assured</Label>
                    <Input
                      id="sum_assured"
                      type="number"
                      value={policyData.sum_assured}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, sum_assured: e.target.value }))}
                      placeholder="500000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Policy Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={policyData.start_date}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Policy End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={policyData.end_date}
                      onChange={(e) => setPolicyData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSavePolicy} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Policy'}
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Breakdown */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Commission Breakdown
                </CardTitle>
                <CardDescription>
                  Auto-calculated commission rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {commissionError && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{commissionError}</AlertDescription>
                  </Alert>
                )}

                {commission ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Product Type</p>
                        <Badge variant="outline">{commission.product_type}</Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Commission Rate</span>
                        <span className="font-medium">{commission.commission_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Reward Rate</span>
                        <span className="font-medium">{commission.reward_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center font-medium">
                        <span>Total Rate</span>
                        <span className="text-primary">{commission.total_rate}%</span>
                      </div>
                    </div>

                    {policyData.premium_without_gst && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Commission Amounts</p>
                          <div className="flex justify-between items-center text-sm">
                            <span>Commission</span>
                            <span>₹{calculateCommissionAmount(parseFloat(policyData.premium_without_gst), commission.commission_rate)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Reward</span>
                            <span>₹{calculateCommissionAmount(parseFloat(policyData.premium_without_gst), commission.reward_rate)}</span>
                          </div>
                          <div className="flex justify-between items-center font-medium">
                            <span>Total Commission</span>
                            <span className="text-primary">₹{calculateCommissionAmount(parseFloat(policyData.premium_without_gst), commission.total_rate)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Save policy to calculate commission</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}