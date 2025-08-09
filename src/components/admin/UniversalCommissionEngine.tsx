import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  Plus, 
  Filter, 
  Search, 
  Edit, 
  Trash2, 
  Settings, 
  DollarSign, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Target,
  Users,
  Building,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UniversalCommissionRule {
  id?: string;
  insurer_id: string;
  product_id?: string;
  line_of_business: string;
  rule_type: string;
  policy_type: string;
  premium_component: string;
  commission_type: 'flat' | 'slab' | 'tier' | 'fixed' | 'combo';
  commission_value?: number;
  frequency: string;
  start_date: Date;
  end_date?: Date;
  applies_to: 'agent' | 'employee' | 'both';
  status: 'active' | 'inactive' | 'expired';
  rule_conditions_json?: any;
  created_at?: string;
  updated_at?: string;
  // Database fields
  first_year_rate?: number;
  first_year_amount?: number;
  renewal_rate?: number;
  renewal_amount?: number;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
  version?: number;
  description?: string;
  // Relations
  insurance_providers?: { provider_name: string };
  insurance_products?: { name: string };
  commission_slabs?: CommissionSlab[];
}

interface CommissionSlab {
  id?: string;
  rule_id: string;
  from_amount: number;
  to_amount?: number;
  commission_rate?: number;
  commission_amount?: number;
  description?: string;
}

interface CommissionTransaction {
  id: string;
  policy_id: string;
  rule_id?: string;
  calculated_commission?: number;
  commission_amount?: number;
  agent_id?: string;
  commission_rate?: number;
  commission_type?: string;
  payment_date?: string;
  received_on?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  policies_new?: { policy_number: string };
  agents?: { name: string };
  policy_number?: string;
  agent_name?: string;
  insurer_name?: string;
}

export const UniversalCommissionEngine: React.FC = () => {
  const [rules, setRules] = useState<UniversalCommissionRule[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rules");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<UniversalCommissionRule | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<UniversalCommissionRule>({
    insurer_id: '',
    line_of_business: '',
    rule_type: 'flat',
    policy_type: 'New',
    premium_component: 'gross',
    commission_type: 'flat',
    frequency: 'Yearly',
    start_date: new Date(),
    applies_to: 'both',
    status: 'active'
  });

  // Filter states
  const [filters, setFilters] = useState({
    insurer: 'all',
    lob: 'all',
    policyType: 'all',
    status: 'all',
    search: ''
  });

  const [insurers, setInsurers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [slabs, setSlabs] = useState<CommissionSlab[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch insurers
      const { data: insurerData } = await supabase
        .from('insurance_providers')
        .select('id, provider_name')
        .eq('status', 'Active');
      
      // Fetch products
      const { data: productData } = await supabase
        .from('insurance_products')
        .select('id, name, line_of_business_id, provider_id');
      
      // Fetch commission rules
      const { data: rulesData } = await supabase
        .from('commission_rules')
        .select(`
          *,
          insurance_providers:insurer_id(provider_name),
          insurance_products:product_id(name)
        `)
        .order('created_at', { ascending: false });

      // Fetch commission transactions
      const { data: transactionsData } = await supabase
        .from('commissions')
        .select(`
          *,
          policies_new:policy_id(policy_number),
          agents:agent_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      setInsurers(insurerData || []);
      setProducts(productData || []);
      
      // Transform rules data to match interface
      const transformedRules = (rulesData || []).map(rule => ({
        ...rule,
        commission_type: 'flat' as const,
        premium_component: 'gross',
        start_date: new Date(rule.effective_from || Date.now()),
        end_date: rule.effective_to ? new Date(rule.effective_to) : undefined,
        applies_to: 'both' as const,
        status: rule.is_active ? 'active' as const : 'inactive' as const
      }));
      
      setRules(transformedRules);
      setTransactions(transactionsData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const ruleData = {
        insurer_id: formData.insurer_id,
        product_id: (formData.product_id && formData.product_id !== 'all') ? formData.product_id : null,
        line_of_business: formData.line_of_business,
        rule_type: formData.commission_type,
        first_year_rate: formData.commission_type === 'flat' ? formData.commission_value : null,
        first_year_amount: formData.commission_type === 'fixed' ? formData.commission_value : null,
        renewal_rate: formData.commission_type === 'flat' ? formData.commission_value : null,
        renewal_amount: formData.commission_type === 'fixed' ? formData.commission_value : null,
        effective_from: formData.start_date.toISOString().split('T')[0],
        effective_to: formData.end_date?.toISOString().split('T')[0] || null,
        frequency: formData.frequency,
        is_active: formData.status === 'active',
        description: `${formData.commission_type} commission rule for ${formData.line_of_business}`
      };

      let result;
      if (editingRule?.id) {
        result = await supabase
          .from('commission_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
      } else {
        result = await supabase
          .from('commission_rules')
          .insert(ruleData);
      }

      if (result.error) throw result.error;

      // Save slabs if commission type is slab
      if (formData.commission_type === 'slab' && slabs.length > 0) {
        const ruleId = editingRule?.id || result.data?.[0]?.id;
        if (ruleId) {
          // Delete existing slabs
          await supabase.from('rule_ranges').delete().eq('commission_rule_id', ruleId);
          
          // Insert new slabs
          const slabData = slabs.map(slab => ({
            commission_rule_id: ruleId,
            min_value: slab.from_amount,
            max_value: slab.to_amount,
            commission_rate: slab.commission_rate,
            commission_amount: slab.commission_amount,
            description: slab.description
          }));
          
          await supabase.from('rule_ranges').insert(slabData);
        }
      }

      toast({
        title: "Success",
        description: `Commission rule ${editingRule ? 'updated' : 'created'} successfully`,
      });
      
      setShowRuleForm(false);
      setEditingRule(null);
      resetForm();
      fetchData();
      
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Failed to save commission rule",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      insurer_id: '',
      line_of_business: '',
      rule_type: 'flat',
      policy_type: 'New',
      premium_component: 'gross',
      commission_type: 'flat',
      frequency: 'Yearly',
      start_date: new Date(),
      applies_to: 'both',
      status: 'active'
    });
    setSlabs([]);
  };

  const addSlab = () => {
    setSlabs([...slabs, {
      rule_id: '',
      from_amount: 0,
      to_amount: undefined,
      commission_rate: 0,
      description: ''
    }]);
  };

  const updateSlab = (index: number, field: keyof CommissionSlab, value: any) => {
    const updatedSlabs = [...slabs];
    updatedSlabs[index] = { ...updatedSlabs[index], [field]: value };
    setSlabs(updatedSlabs);
  };

  const removeSlab = (index: number) => {
    setSlabs(slabs.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { icon: CheckCircle, class: "bg-gradient-success", label: "Active" },
      inactive: { icon: XCircle, class: "bg-muted", label: "Inactive" },
      expired: { icon: AlertTriangle, class: "bg-gradient-warning", label: "Expired" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || CheckCircle;
    
    return (
      <Badge className={config?.class || "bg-muted"}>
        <Icon className="h-3 w-3 mr-1" />
        {config?.label || status}
      </Badge>
    );
  };

  const getCommissionTypeBadge = (type: string) => {
    const typeConfig = {
      flat: { class: "bg-primary", label: "Flat %" },
      slab: { class: "bg-gradient-warning", label: "Slab Based" },
      tier: { class: "bg-accent", label: "Tier Based" },
      fixed: { class: "bg-secondary", label: "Fixed Amount" },
      combo: { class: "bg-gradient-primary", label: "Combo" }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig];
    return (
      <Badge className={config?.class || "bg-muted"}>
        {config?.label || type}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-6">Loading commission engine...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Universal Commission Engine</h1>
            <p className="text-muted-foreground">Centralized commission management for all insurance products</p>
          </div>
          
          <Dialog open={showRuleForm} onOpenChange={setShowRuleForm}>
            <DialogTrigger asChild>
              <Button onClick={() => {resetForm(); setEditingRule(null);}}>
                <Plus className="h-4 w-4 mr-2" />
                New Commission Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Commission Rule' : 'Create Universal Commission Rule'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="insurer">Insurance Provider *</Label>
                        <Select value={formData.insurer_id} onValueChange={(value) => setFormData({...formData, insurer_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select insurer" />
                          </SelectTrigger>
                          <SelectContent>
                            {insurers.map((insurer) => (
                              <SelectItem key={insurer.id} value={insurer.id}>
                                {insurer.provider_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="product">Product (Optional)</Label>
                        <Select value={formData.product_id || ''} onValueChange={(value) => setFormData({...formData, product_id: value || undefined})}>
                          <SelectTrigger>
                            <SelectValue placeholder="All products or select specific" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            {products
                              .filter(p => p.provider_id === formData.insurer_id)
                              .map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="lob">Line of Business *</Label>
                        <Select value={formData.line_of_business} onValueChange={(value) => setFormData({...formData, line_of_business: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select LOB" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Motor">Motor</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Life">Life</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Loan">Loan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                        <div>
                          <Label htmlFor="policyType">Policy Type *</Label>
                          <Select value={formData.policy_type} onValueChange={(value: any) => setFormData({...formData, policy_type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New Business</SelectItem>
                              <SelectItem value="Renewal">Renewal</SelectItem>
                              <SelectItem value="Portability">Portability</SelectItem>
                              <SelectItem value="Top-Up">Top-Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Commission Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Commission Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="commissionType">Commission Type *</Label>
                        <Select value={formData.commission_type} onValueChange={(value: any) => setFormData({...formData, commission_type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat Percentage</SelectItem>
                            <SelectItem value="slab">Slab Based</SelectItem>
                            <SelectItem value="tier">Tier Based</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="combo">Combo (Base + Bonus)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="premiumComponent">Premium Component *</Label>
                        <Select value={formData.premium_component} onValueChange={(value: any) => setFormData({...formData, premium_component: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gross">Gross Premium</SelectItem>
                            <SelectItem value="net">Net Premium</SelectItem>
                            <SelectItem value="od">OD Premium (Motor)</SelectItem>
                            <SelectItem value="tp">TP Premium (Motor)</SelectItem>
                            <SelectItem value="sum_insured">Sum Insured</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(formData.commission_type === 'flat' || formData.commission_type === 'fixed') && (
                        <div>
                          <Label htmlFor="commissionValue">
                            Commission {formData.commission_type === 'flat' ? 'Rate (%)' : 'Amount (₹)'} *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.commission_value || ''}
                            onChange={(e) => setFormData({...formData, commission_value: parseFloat(e.target.value)})}
                            placeholder={formData.commission_type === 'flat' ? "Enter percentage" : "Enter amount"}
                          />
                        </div>
                      )}
                    </div>

                    {/* Slab Configuration */}
                    {formData.commission_type === 'slab' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Commission Slabs</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addSlab}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Slab
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {slabs.map((slab, index) => (
                            <Card key={index} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                <div>
                                  <Label className="text-sm">From Amount</Label>
                                  <Input
                                    type="number"
                                    value={slab.from_amount}
                                    onChange={(e) => updateSlab(index, 'from_amount', parseFloat(e.target.value))}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">To Amount</Label>
                                  <Input
                                    type="number"
                                    value={slab.to_amount || ''}
                                    onChange={(e) => updateSlab(index, 'to_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    placeholder="Unlimited"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Rate (%)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={slab.commission_rate || ''}
                                    onChange={(e) => updateSlab(index, 'commission_rate', parseFloat(e.target.value))}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Description</Label>
                                  <Input
                                    value={slab.description || ''}
                                    onChange={(e) => updateSlab(index, 'description', e.target.value)}
                                    placeholder="Slab description"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSlab(index)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Validity & Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Validity & Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Start Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.start_date}
                              onSelect={(date) => date && setFormData({...formData, start_date: date})}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label>End Date (Optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.end_date ? format(formData.end_date, "PPP") : "No end date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.end_date}
                              onSelect={(date) => setFormData({...formData, end_date: date})}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label htmlFor="frequency">Frequency *</Label>
                        <Select value={formData.frequency} onValueChange={(value: any) => setFormData({...formData, frequency: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Yearly">Annual</SelectItem>
                            <SelectItem value="One-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="appliesTo">Applies To *</Label>
                        <Select value={formData.applies_to} onValueChange={(value: any) => setFormData({...formData, applies_to: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Both Agents & Employees</SelectItem>
                            <SelectItem value="agent">Agents Only</SelectItem>
                            <SelectItem value="employee">Employees Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.status === 'active'}
                          onCheckedChange={(checked) => setFormData({...formData, status: checked ? 'active' : 'inactive'})}
                        />
                        <Label>Active Rule</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowRuleForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRule}>
                    {editingRule ? 'Update' : 'Create'} Rule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="slabs">Slab Management</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Rules ({rules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insurer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>LOB</TableHead>
                    <TableHead>Policy Type</TableHead>
                    <TableHead>Commission Type</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Rate/Amount</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.insurance_providers?.provider_name}
                      </TableCell>
                      <TableCell>
                        {rule.insurance_products?.name || "All Products"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.line_of_business}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rule.policy_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {getCommissionTypeBadge(rule.rule_type || rule.commission_type)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.premium_component}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.first_year_rate ? `${rule.first_year_rate}%` : 
                         rule.first_year_amount ? `₹${rule.first_year_amount}` : 
                         rule.commission_value ? `${rule.commission_value}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{rule.effective_from || format(rule.start_date, "yyyy-MM-dd")}</div>
                          <div className="text-muted-foreground">
                            {rule.effective_to || (rule.end_date && format(rule.end_date, "yyyy-MM-dd")) ? 
                             `to ${rule.effective_to || format(rule.end_date!, "yyyy-MM-dd")}` : 'Indefinite'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(rule.is_active !== false ? 'active' : 'inactive')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule);
                              setShowRuleForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Insurer</TableHead>
                    <TableHead>Commission Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.policies_new?.policy_number || transaction.policy_number || '-'}
                      </TableCell>
                      <TableCell>{transaction.agents?.name || transaction.agent_name || '-'}</TableCell>
                      <TableCell>{transaction.insurer_name || '-'}</TableCell>
                      <TableCell>
                        ₹{(transaction.calculated_commission || transaction.commission_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {transaction.created_at ? format(new Date(transaction.created_at), "PPP") : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};