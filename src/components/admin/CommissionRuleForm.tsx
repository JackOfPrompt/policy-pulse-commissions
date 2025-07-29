import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommissionRule {
  id: string;
  insurer_id: string;
  product_id?: string;
  line_of_business: string;
  rule_type: string;
  first_year_rate?: number;
  first_year_amount?: number;
  renewal_rate?: number;
  renewal_amount?: number;
  effective_from: string;
  effective_to?: string;
  frequency: string;
  version: number;
  is_active: boolean;
  description?: string;
  insurance_providers: { provider_name: string };
  insurance_products?: { name: string };
  commission_rule_tiers: Array<{
    commission_tiers: { name: string; code: string };
  }>;
}

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

interface RuleCondition {
  id?: string;
  attribute: string;
  operator: string;
  value: string;
}

interface RuleRange {
  id?: string;
  min_value: number;
  max_value?: number;
  commission_rate?: number;
  commission_amount?: number;
  description?: string;
}

interface CommissionRuleFormProps {
  rule?: CommissionRule | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CommissionRuleForm: React.FC<CommissionRuleFormProps> = ({
  rule,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    insurer_id: "",
    product_id: "all",
    line_of_business: "",
    rule_type: "",
    first_year_rate: "",
    first_year_amount: "",
    renewal_rate: "",
    renewal_amount: "",
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: "",
    frequency: "Yearly",
    is_active: true,
    description: ""
  });

  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [ranges, setRanges] = useState<RuleRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const { toast } = useToast();

  const lineOfBusinessOptions = ['Motor', 'Health', 'Life', 'Commercial'];
  const ruleTypeOptions = ['Flat %', 'Fixed', 'Tiered', 'Premium-Based', 'Volume-Based'];
  
  // Line-specific attribute options
  const getAttributeOptions = (lineOfBusiness: string) => {
    const baseAttributes = ['paymentFrequency', 'premiumBand'];
    
    switch (lineOfBusiness) {
      case 'Motor':
        return [...baseAttributes, 'vehicleType', 'cubicCapacity', 'fuelType', 'policyTenure', 'ODComponent', 'TPComponent'];
      case 'Life':
        return [...baseAttributes, 'policyTerm', 'premiumPaymentTerm', 'policyType', 'planCode', 'sumAssured'];
      case 'Health':
        return [...baseAttributes, 'planType', 'ageBand', 'riderIncluded', 'familySize'];
      case 'Commercial':
        return [...baseAttributes, 'coverageType', 'riskCategory', 'sumInsuredBand', 'tenure'];
      default:
        return baseAttributes;
    }
  };

  const operatorOptions = ['=', 'in', '>=', '<=', '>', '<', 'contains'];

  useEffect(() => {
    fetchProviders();
    fetchProducts();
    fetchCommissionTiers();
    
    if (rule) {
      populateForm(rule);
    }
  }, [rule]);

  useEffect(() => {
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

  const populateForm = (rule: CommissionRule) => {
    setFormData({
      insurer_id: rule.insurer_id,
      product_id: rule.product_id || "all",
      line_of_business: rule.line_of_business,
      rule_type: rule.rule_type,
      first_year_rate: rule.first_year_rate?.toString() || "",
      first_year_amount: rule.first_year_amount?.toString() || "",
      renewal_rate: rule.renewal_rate?.toString() || "",
      renewal_amount: rule.renewal_amount?.toString() || "",
      effective_from: rule.effective_from,
      effective_to: rule.effective_to || "",
      frequency: rule.frequency,
      is_active: rule.is_active,
      description: rule.description || ""
    });

    // Populate selected tiers
    const tierIds = rule.commission_rule_tiers.map(t => t.commission_tiers.name);
    setSelectedTiers(tierIds);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCondition = () => {
    setConditions(prev => [...prev, {
      attribute: '',
      operator: '=',
      value: ''
    }]);
  };

  const updateCondition = (index: number, field: string, value: string) => {
    setConditions(prev => prev.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    ));
  };

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const addRange = () => {
    setRanges(prev => [...prev, {
      min_value: 0,
      max_value: undefined,
      commission_rate: undefined,
      commission_amount: undefined,
      description: ''
    }]);
  };

  const updateRange = (index: number, field: string, value: any) => {
    setRanges(prev => prev.map((range, i) => 
      i === index ? { ...range, [field]: value } : range
    ));
  };

  const removeRange = (index: number) => {
    setRanges(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.insurer_id || !formData.line_of_business || !formData.rule_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.first_year_rate && !formData.first_year_amount && 
        !formData.renewal_rate && !formData.renewal_amount) {
      toast({
        title: "Validation Error",
        description: "At least one commission rate or amount must be specified",
        variant: "destructive",
      });
      return false;
    }

    if ((formData.rule_type === 'Tiered' || formData.rule_type === 'Premium-Based') && ranges.length === 0) {
      toast({
        title: "Validation Error",
        description: "Tiered and Premium-Based rules must have at least one range defined",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Check for overlapping rules if creating new rule
      if (!rule) {
        const { data: overlapData, error: overlapError } = await supabase
          .rpc('check_commission_rule_overlap', {
            p_insurer_id: formData.insurer_id,
            p_product_id: formData.product_id === "all" ? null : formData.product_id,
            p_line_of_business: formData.line_of_business,
            p_effective_from: formData.effective_from,
            p_effective_to: formData.effective_to || null
          });

        if (overlapError) {
          console.warn('Error checking overlap:', overlapError);
        } else if (overlapData && overlapData.length > 0) {
          const overlappingRule = overlapData[0];
          const proceed = confirm(
            `Warning: This rule overlaps with an existing rule (Version ${overlappingRule.overlapping_version}) ` +
            `from ${overlappingRule.overlapping_from} to ${overlappingRule.overlapping_to || 'indefinite'}. ` +
            `Do you want to continue? The previous rule will be automatically archived.`
          );
          
          if (!proceed) {
            setLoading(false);
            return;
          }
        }
      }

      // Get next version number if creating new rule
      let version = 1;
      if (!rule) {
        const { data: versionData, error: versionError } = await supabase
          .rpc('get_next_commission_rule_version', {
            p_insurer_id: formData.insurer_id,
            p_product_id: formData.product_id === "all" ? null : formData.product_id,
            p_line_of_business: formData.line_of_business
          });

        if (versionError) {
          console.warn('Error getting version:', versionError);
        } else {
          version = versionData || 1;
        }
      }

      const ruleData = {
        insurer_id: formData.insurer_id,
        product_id: formData.product_id === "all" ? null : formData.product_id,
        line_of_business: formData.line_of_business,
        rule_type: formData.rule_type,
        first_year_rate: formData.first_year_rate ? parseFloat(formData.first_year_rate) : null,
        first_year_amount: formData.first_year_amount ? parseFloat(formData.first_year_amount) : null,
        renewal_rate: formData.renewal_rate ? parseFloat(formData.renewal_rate) : null,
        renewal_amount: formData.renewal_amount ? parseFloat(formData.renewal_amount) : null,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        frequency: formData.frequency,
        version: rule ? rule.version : version,
        is_active: formData.is_active,
        description: formData.description || null
      };

      let ruleId: string;

      if (rule) {
        // Update existing rule
        const { error } = await supabase
          .from('commission_rules')
          .update(ruleData)
          .eq('id', rule.id);

        if (error) throw error;
        ruleId = rule.id;
      } else {
        // Create new rule
        const { data, error } = await supabase
          .from('commission_rules')
          .insert(ruleData)
          .select()
          .single();

        if (error) throw error;
        ruleId = data.id;
      }

      // Save conditions
      if (conditions.length > 0) {
        await supabase.from('rule_conditions').delete().eq('commission_rule_id', ruleId);
        
        const conditionData = conditions
          .filter(c => c.attribute && c.value)
          .map(c => ({
            commission_rule_id: ruleId,
            attribute: c.attribute,
            operator: c.operator,
            value: c.value
          }));

        if (conditionData.length > 0) {
          const { error } = await supabase.from('rule_conditions').insert(conditionData);
          if (error) throw error;
        }
      }

      // Save ranges
      if (ranges.length > 0) {
        await supabase.from('rule_ranges').delete().eq('commission_rule_id', ruleId);
        
        const rangeData = ranges
          .filter(r => r.min_value !== undefined)
          .map(r => ({
            commission_rule_id: ruleId,
            min_value: r.min_value,
            max_value: r.max_value || null,
            commission_rate: r.commission_rate || null,
            commission_amount: r.commission_amount || null,
            description: r.description || null
          }));

        if (rangeData.length > 0) {
          const { error } = await supabase.from('rule_ranges').insert(rangeData);
          if (error) throw error;
        }
      }

      // Save tier associations
      await supabase.from('commission_rule_tiers').delete().eq('commission_rule_id', ruleId);
      
      if (selectedTiers.length > 0) {
        const tierData = selectedTiers.map(tierId => ({
          commission_rule_id: ruleId,
          commission_tier_id: tierId
        }));

        const { error } = await supabase.from('commission_rule_tiers').insert(tierData);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Commission rule ${rule ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving commission rule:', error);
      toast({
        title: "Error",
        description: "Failed to save commission rule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="ranges">Ranges/Tiers</TabsTrigger>
          <TabsTrigger value="agents">Agent Tiers</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insurer">Insurance Provider *</Label>
              <Select 
                value={formData.insurer_id} 
                onValueChange={(value) => handleInputChange('insurer_id', value)}
              >
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
              <Select 
                value={formData.product_id} 
                onValueChange={(value) => handleInputChange('product_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All products (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
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
              <Select 
                value={formData.line_of_business} 
                onValueChange={(value) => handleInputChange('line_of_business', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select line of business" />
                </SelectTrigger>
                <SelectContent>
                  {lineOfBusinessOptions.map((lob) => (
                    <SelectItem key={lob} value={lob}>
                      {lob}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule_type">Rule Type *</Label>
              <Select 
                value={formData.rule_type} 
                onValueChange={(value) => handleInputChange('rule_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rule type" />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_year_rate">First Year Rate (%)</Label>
              <Input
                id="first_year_rate"
                type="number"
                step="0.01"
                value={formData.first_year_rate}
                onChange={(e) => handleInputChange('first_year_rate', e.target.value)}
                placeholder="e.g., 12.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_year_amount">First Year Amount (₹)</Label>
              <Input
                id="first_year_amount"
                type="number"
                step="0.01"
                value={formData.first_year_amount}
                onChange={(e) => handleInputChange('first_year_amount', e.target.value)}
                placeholder="e.g., 1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal_rate">Renewal Rate (%)</Label>
              <Input
                id="renewal_rate"
                type="number"
                step="0.01"
                value={formData.renewal_rate}
                onChange={(e) => handleInputChange('renewal_rate', e.target.value)}
                placeholder="e.g., 5.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal_amount">Renewal Amount (₹)</Label>
              <Input
                id="renewal_amount"
                type="number"
                step="0.01"
                value={formData.renewal_amount}
                onChange={(e) => handleInputChange('renewal_amount', e.target.value)}
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_from">Effective From</Label>
              <Input
                id="effective_from"
                type="date"
                value={formData.effective_from}
                onChange={(e) => handleInputChange('effective_from', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_to">Effective To (Optional)</Label>
              <Input
                id="effective_to"
                type="date"
                value={formData.effective_to}
                onChange={(e) => handleInputChange('effective_to', e.target.value)}
                placeholder="Leave empty for indefinite"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                  <SelectItem value="Ad-hoc">Ad-hoc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description of this commission rule"
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Rule Conditions
                <Button onClick={addCondition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conditions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conditions defined. This rule will apply to all products/policies.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attribute</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conditions.map((condition, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select 
                            value={condition.attribute} 
                            onValueChange={(value) => updateCondition(index, 'attribute', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAttributeOptions(formData.line_of_business).map((attr) => (
                                <SelectItem key={attr} value={attr}>
                                  {attr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={condition.operator} 
                            onValueChange={(value) => updateCondition(index, 'operator', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operatorOptions.map((op) => (
                                <SelectItem key={op} value={op}>
                                  {op}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            placeholder="Value"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCondition(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Commission Ranges
                <Button onClick={addRange} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Range
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ranges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No ranges defined. Required for Tiered and Premium-Based rules.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Min Value</TableHead>
                      <TableHead>Max Value</TableHead>
                      <TableHead>Commission Rate (%)</TableHead>
                      <TableHead>Commission Amount (₹)</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranges.map((range, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            type="number"
                            value={range.min_value}
                            onChange={(e) => updateRange(index, 'min_value', parseFloat(e.target.value))}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={range.max_value || ''}
                            onChange={(e) => updateRange(index, 'max_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="Unlimited"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={range.commission_rate || ''}
                            onChange={(e) => updateRange(index, 'commission_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="5.0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={range.commission_amount || ''}
                            onChange={(e) => updateRange(index, 'commission_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="1000"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={range.description || ''}
                            onChange={(e) => updateRange(index, 'description', e.target.value)}
                            placeholder="Optional"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRange(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applicable Agent Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {commissionTiers.map((tier) => (
                  <div key={tier.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`tier-${tier.id}`}
                      checked={selectedTiers.includes(tier.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTiers(prev => [...prev, tier.id]);
                        } else {
                          setSelectedTiers(prev => prev.filter(id => id !== tier.id));
                        }
                      }}
                      className="rounded border-input"
                    />
                    <Label htmlFor={`tier-${tier.id}`} className="text-sm">
                      {tier.name} ({tier.code})
                    </Label>
                  </div>
                ))}
              </div>
              {selectedTiers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  No specific tiers selected. This rule will apply to all agent tiers.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : (rule ? 'Update Rule' : 'Create Rule')}
        </Button>
      </div>
    </div>
  );
};