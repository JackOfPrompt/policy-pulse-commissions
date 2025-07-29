import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Provider {
  id: string;
  provider_name: string;
}

interface Product {
  id: string;
  name: string;
  provider_id: string;
}

interface CommissionTier {
  id: string;
  name: string;
  code: string;
}

interface CalculationResult {
  commissionAmount: number;
  rateUsed: number;
  ruleId?: string;
  breakdown?: {
    baseCommission: number;
    tierAdjustment?: number;
    odCommission?: number;
    tpCommission?: number;
  };
  error?: string;
}

export const CommissionCalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    insurer_id: "",
    product_id: "",
    line_of_business: "",
    premium_amount: "",
    od_premium: "",
    tp_premium: "",
    policy_term: "",
    premium_payment_term: "",
    vehicle_type: "",
    plan_type: "",
    payment_frequency: "Annual",
    sum_assured: "",
    agent_tier_id: "",
    is_renewal: false
  });

  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  React.useEffect(() => {
    fetchProviders();
    fetchProducts();
    fetchCommissionTiers();
  }, []);

  React.useEffect(() => {
    if (formData.insurer_id) {
      const filteredProducts = allProducts.filter(p => p.provider_id === formData.insurer_id);
      setProducts(filteredProducts);
    } else {
      setProducts([]);
    }
  }, [formData.insurer_id, allProducts]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('id, provider_name')
        .eq('status', 'Active')
        .order('provider_name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_products')
        .select('id, name, provider_id')
        .eq('status', 'Active')
        .order('name');

      if (error) throw error;
      setAllProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCommissionTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setCommissionTiers(data || []);
    } catch (error) {
      console.error('Error fetching commission tiers:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateCommission = async () => {
    if (!formData.insurer_id || !formData.line_of_business || !formData.premium_amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: Insurer, Line of Business, and Premium Amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare policy details based on line of business
      const policyDetails: any = {
        lineOfBusiness: formData.line_of_business,
        premiumAmount: parseFloat(formData.premium_amount),
        paymentFrequency: formData.payment_frequency
      };

      // Add line-specific details
      if (formData.line_of_business === 'Motor') {
        if (formData.od_premium) policyDetails.odPremium = parseFloat(formData.od_premium);
        if (formData.tp_premium) policyDetails.tpPremium = parseFloat(formData.tp_premium);
        if (formData.vehicle_type) policyDetails.vehicleType = formData.vehicle_type;
      }

      if (formData.line_of_business === 'Life') {
        if (formData.policy_term) policyDetails.policyTerm = parseInt(formData.policy_term);
        if (formData.premium_payment_term) policyDetails.premiumPaymentTerm = parseInt(formData.premium_payment_term);
      }

      if (formData.line_of_business === 'Health') {
        if (formData.plan_type) policyDetails.planType = formData.plan_type;
      }

      if (formData.sum_assured) policyDetails.sumAssured = parseFloat(formData.sum_assured);

      // Call the commission calculation function
      const { data, error } = await supabase.functions.invoke('calculate-commission', {
        body: {
          insurerId: formData.insurer_id,
          productId: formData.product_id || undefined,
          policyDetails,
          agentTierId: formData.agent_tier_id || undefined,
          isRenewal: formData.is_renewal
        }
      });

      if (error) throw error;

      setResult(data);

      toast({
        title: "Success",
        description: "Commission calculated successfully",
      });

    } catch (error) {
      console.error('Error calculating commission:', error);
      setResult({
        commissionAmount: 0,
        rateUsed: 0,
        error: error.message || 'Failed to calculate commission'
      });
      
      toast({
        title: "Error",
        description: "Failed to calculate commission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLineSpecificFields = () => {
    switch (formData.line_of_business) {
      case 'Motor':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="od_premium">OD Premium (₹)</Label>
                <Input
                  id="od_premium"
                  type="number"
                  step="0.01"
                  value={formData.od_premium}
                  onChange={(e) => handleInputChange('od_premium', e.target.value)}
                  placeholder="Own Damage Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tp_premium">TP Premium (₹)</Label>
                <Input
                  id="tp_premium"
                  type="number"
                  step="0.01"
                  value={formData.tp_premium}
                  onChange={(e) => handleInputChange('tp_premium', e.target.value)}
                  placeholder="Third Party Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Select value={formData.vehicle_type} onValueChange={(value) => handleInputChange('vehicle_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Commercial Vehicle">Commercial Vehicle</SelectItem>
                    <SelectItem value="Three Wheeler">Three Wheeler</SelectItem>
                    <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Motor Insurance:</strong> Commission is calculated only on OD (Own Damage) premium. TP (Third Party) gets 0% commission as per IRDAI regulations.
              </p>
            </div>
          </>
        );

      case 'Life':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policy_term">Policy Term (Years)</Label>
                <Input
                  id="policy_term"
                  type="number"
                  value={formData.policy_term}
                  onChange={(e) => handleInputChange('policy_term', e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="premium_payment_term">Premium Payment Term (Years)</Label>
                <Input
                  id="premium_payment_term"
                  type="number"
                  value={formData.premium_payment_term}
                  onChange={(e) => handleInputChange('premium_payment_term', e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Life Insurance:</strong> Commission rates vary by Policy Term (PT) and Premium Payment Term (PPT). Higher PT typically allows higher first-year commission (up to 35-40%) with lower renewals (2-5%).
              </p>
            </div>
          </>
        );

      case 'Health':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="plan_type">Plan Type</Label>
              <Select value={formData.plan_type} onValueChange={(value) => handleInputChange('plan_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Family Floater">Family Floater</SelectItem>
                  <SelectItem value="Group">Group</SelectItem>
                  <SelectItem value="Senior Citizen">Senior Citizen</SelectItem>
                  <SelectItem value="Critical Illness">Critical Illness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Health Insurance:</strong> IRDAI allows max 15% for individual plans and ~7.5% for group plans. Annual payment frequency typically gets higher commission than monthly.
              </p>
            </div>
          </>
        );

      case 'Commercial':
        return (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Commercial Insurance:</strong> Commission varies by coverage type (Fire, Property, Marine) and risk category. Typically uses tiered slabs based on sum insured amounts.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Commission Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insurer">Insurance Provider *</Label>
              <Select value={formData.insurer_id} onValueChange={(value) => handleInputChange('insurer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Insurance Product</Label>
              <Select value={formData.product_id} onValueChange={(value) => handleInputChange('product_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All products (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lob">Line of Business *</Label>
              <Select value={formData.line_of_business} onValueChange={(value) => handleInputChange('line_of_business', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select line of business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motor">Motor</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Life">Life</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Premium Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="premium_amount">Premium Amount (₹) *</Label>
              <Input
                id="premium_amount"
                type="number"
                step="0.01"
                value={formData.premium_amount}
                onChange={(e) => handleInputChange('premium_amount', e.target.value)}
                placeholder="Total Premium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sum_assured">Sum Assured (₹)</Label>
              <Input
                id="sum_assured"
                type="number"
                step="0.01"
                value={formData.sum_assured}
                onChange={(e) => handleInputChange('sum_assured', e.target.value)}
                placeholder="Sum Assured"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_frequency">Payment Frequency</Label>
              <Select value={formData.payment_frequency} onValueChange={(value) => handleInputChange('payment_frequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agent Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent_tier">Agent Tier</Label>
              <Select value={formData.agent_tier_id} onValueChange={(value) => handleInputChange('agent_tier_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent tier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Tier</SelectItem>
                  {commissionTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} ({tier.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="is_renewal"
                checked={formData.is_renewal}
                onChange={(e) => handleInputChange('is_renewal', e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="is_renewal">Renewal Policy</Label>
            </div>
          </div>

          {/* Line-specific fields */}
          {formData.line_of_business && renderLineSpecificFields()}

          {/* Calculate Button */}
          <Button onClick={calculateCommission} disabled={loading} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            {loading ? 'Calculating...' : 'Calculate Commission'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Calculation Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="text-center py-4">
                <Badge variant="destructive" className="mb-2">Error</Badge>
                <p className="text-muted-foreground">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Commission Amount</p>
                    <p className="text-2xl font-bold text-success">₹{result.commissionAmount.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Rate Used</p>
                    <p className="text-2xl font-bold text-primary">{result.rateUsed.toFixed(2)}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Rule Applied</p>
                    <p className="text-sm font-medium">{result.ruleId ? `Rule: ${result.ruleId.slice(0, 8)}...` : 'Default'}</p>
                  </div>
                </div>

                {result.breakdown && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Commission Breakdown:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Commission:</span>
                        <span>₹{result.breakdown.baseCommission.toFixed(2)}</span>
                      </div>
                      {result.breakdown.odCommission !== undefined && (
                        <div className="flex justify-between">
                          <span>OD Commission:</span>
                          <span>₹{result.breakdown.odCommission.toFixed(2)}</span>
                        </div>
                      )}
                      {result.breakdown.tpCommission !== undefined && (
                        <div className="flex justify-between">
                          <span>TP Commission:</span>
                          <span>₹{result.breakdown.tpCommission.toFixed(2)}</span>
                        </div>
                      )}
                      {result.breakdown.tierAdjustment && (
                        <div className="flex justify-between">
                          <span>Tier Adjustment:</span>
                          <span>₹{result.breakdown.tierAdjustment.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};