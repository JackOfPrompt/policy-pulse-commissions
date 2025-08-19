import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  AlertTriangle,
  Building2,
  Package,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ruleSchema = z.object({
  rule_type: z.enum(['Fixed', 'Slab', 'Flat', 'Renewal', 'Bonus', 'Tiered', 'Campaign']),
  insurer_id: z.string().min(1, 'Insurance provider is required'),
  product_id: z.string().min(1, 'Product is required'),
  lob_id: z.string().min(1, 'Line of business is required'),
  base_rate: z.number().min(0).max(100).optional(),
  channel: z.string().optional(),
  policy_year: z.number().min(1).max(10).default(1),
  valid_from: z.date(),
  valid_to: z.date().optional(),
  flat_amount: z.number().min(0).optional(),
  unit_type: z.enum(['PerPolicy', 'PerVehicle', 'PerMember']).optional(),
  campaign_name: z.string().optional(),
});

interface CommissionRule {
  rule_id: string;
  rule_type: string;
  insurer_id: string;
  product_id: string;
  lob_id: string;
  base_rate: number;
  channel: string;
  policy_year: number;
  valid_from: string;
  valid_to: string;
  status: string;
  final_effective_rate: number;
  is_compliant: boolean;
  irdai_cap: number;
  master_insurance_providers: { provider_name: string };
  master_product_name: { product_name: string };
  master_line_of_business: { lob_name: string };
}

interface Slab {
  min_value: number;
  max_value: number;
  rate: number;
}

export const CommissionRuleBuilder = () => {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [providers, setProviders] = useState([]);
  const [products, setProducts] = useState([]);
  const [lobs, setLobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      policy_year: 1,
      rule_type: 'Fixed',
    },
  });

  const watchedRuleType = form.watch('rule_type');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch commission rules
      const { data: rulesData, error: rulesError } = await supabase.functions.invoke('commission-management', {
        body: {
          action: 'GET_COMMISSION_RULES',
          tenantId: profile?.tenant_id
        }
      });

      if (rulesError) throw rulesError;
      setRules(rulesData.rules || []);

      // Fetch master data
      const [providersRes, productsRes, lobsRes] = await Promise.all([
        supabase.from('master_insurance_providers').select('provider_id, provider_name').eq('status', 'Active'),
        supabase.from('master_product_name').select('product_id, product_name').eq('status', 'Active'),
        supabase.from('master_line_of_business').select('lob_id, lob_name').eq('status', 'Active')
      ]);

      setProviders(providersRes.data || []);
      setProducts(productsRes.data || []);
      setLobs(lobsRes.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load commission rules data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof ruleSchema>) => {
    try {
      const payload = {
        ...data,
        valid_from: format(data.valid_from, 'yyyy-MM-dd'),
        valid_to: data.valid_to ? format(data.valid_to, 'yyyy-MM-dd') : null,
        slabs: watchedRuleType === 'Slab' ? slabs : undefined,
        campaign: watchedRuleType === 'Campaign' ? {
          campaign_name: data.campaign_name,
          bonus_rate: data.base_rate,
          valid_from: format(data.valid_from, 'yyyy-MM-dd'),
          valid_to: data.valid_to ? format(data.valid_to, 'yyyy-MM-dd') : null,
        } : undefined
      };

      const action = editingRule ? 'UPDATE_COMMISSION_RULE' : 'CREATE_COMMISSION_RULE';
      
      const requestBody = editingRule 
        ? { ...payload, rule_id: editingRule.rule_id }
        : payload;

      const { error } = await supabase.functions.invoke('commission-management', {
        body: {
          action,
          tenantId: profile?.tenant_id,
          ...requestBody
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Commission rule ${editingRule ? 'updated' : 'created'} successfully`,
      });

      setShowForm(false);
      setEditingRule(null);
      setSlabs([]);
      form.reset();
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

  const handleEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    form.reset({
      rule_type: rule.rule_type as any,
      insurer_id: rule.insurer_id,
      product_id: rule.product_id,
      lob_id: rule.lob_id,
      base_rate: rule.base_rate,
      channel: rule.channel,
      policy_year: rule.policy_year,
      valid_from: new Date(rule.valid_from),
      valid_to: rule.valid_to ? new Date(rule.valid_to) : undefined,
    });
    setShowForm(true);
  };

  const handleDelete = async (ruleId: string) => {
    try {
      const { error } = await supabase.functions.invoke('commission-management', {
        body: {
          action: 'DELETE_COMMISSION_RULE',
          tenantId: profile?.tenant_id,
          ruleId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission rule deleted successfully",
      });

      fetchData();

    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission rule",
        variant: "destructive",
      });
    }
  };

  const addSlab = () => {
    setSlabs([...slabs, { min_value: 0, max_value: 0, rate: 0 }]);
  };

  const updateSlab = (index: number, field: keyof Slab, value: number) => {
    const updatedSlabs = [...slabs];
    updatedSlabs[index][field] = value;
    setSlabs(updatedSlabs);
  };

  const removeSlab = (index: number) => {
    setSlabs(slabs.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading commission rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Commission Rule Builder</h2>
          <p className="text-muted-foreground">Create and manage commission rules with IRDAI compliance</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRule(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit' : 'Create'} Commission Rule</DialogTitle>
              <DialogDescription>
                Configure commission structure with automatic IRDAI compliance validation
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rule Type */}
                  <FormField
                    control={form.control}
                    name="rule_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rule type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Fixed">Fixed Rate</SelectItem>
                            <SelectItem value="Slab">Slab-based</SelectItem>
                            <SelectItem value="Flat">Flat Amount</SelectItem>
                            <SelectItem value="Renewal">Renewal Bonus</SelectItem>
                            <SelectItem value="Bonus">Business Bonus</SelectItem>
                            <SelectItem value="Tiered">Tiered</SelectItem>
                            <SelectItem value="Campaign">Campaign Bonus</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Insurance Provider */}
                  <FormField
                    control={form.control}
                    name="insurer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {providers.map((provider: any) => (
                              <SelectItem key={provider.provider_id} value={provider.provider_id}>
                                {provider.provider_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Line of Business */}
                  <FormField
                    control={form.control}
                    name="lob_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Line of Business</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select LOB" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lobs.map((lob: any) => (
                              <SelectItem key={lob.lob_id} value={lob.lob_id}>
                                {lob.lob_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Product */}
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product: any) => (
                              <SelectItem key={product.product_id} value={product.product_id}>
                                {product.product_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Policy Year */}
                  <FormField
                    control={form.control}
                    name="policy_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Channel */}
                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Agent, Direct, Online" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valid From */}
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Valid From</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valid To */}
                  <FormField
                    control={form.control}
                    name="valid_to"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Valid To (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dynamic Fields Based on Rule Type */}
                {(watchedRuleType === 'Fixed' || watchedRuleType === 'Renewal' || watchedRuleType === 'Campaign') && (
                  <FormField
                    control={form.control}
                    name="base_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 15.50"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchedRuleType === 'Flat' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="flat_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flat Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="e.g., 500.00"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PerPolicy">Per Policy</SelectItem>
                              <SelectItem value="PerVehicle">Per Vehicle</SelectItem>
                              <SelectItem value="PerMember">Per Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {watchedRuleType === 'Campaign' && (
                  <FormField
                    control={form.control}
                    name="campaign_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Festival Special Bonus" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Slab Configuration */}
                {watchedRuleType === 'Slab' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">Commission Slabs</h4>
                      <Button type="button" onClick={addSlab} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slab
                      </Button>
                    </div>

                    {slabs.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Min Premium</TableHead>
                            <TableHead>Max Premium</TableHead>
                            <TableHead>Rate (%)</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {slabs.map((slab, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={slab.min_value}
                                  onChange={(e) => updateSlab(index, 'min_value', parseFloat(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={slab.max_value}
                                  onChange={(e) => updateSlab(index, 'max_value', parseFloat(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={slab.rate}
                                  onChange={(e) => updateSlab(index, 'rate', parseFloat(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  onClick={() => removeSlab(index)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    {editingRule ? 'Update' : 'Create'} Rule
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Rules</CardTitle>
          <CardDescription>Manage all commission rules with IRDAI compliance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>LOB</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Final Rate</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.rule_id}>
                  <TableCell>
                    <Badge variant="secondary">{rule.rule_type}</Badge>
                  </TableCell>
                  <TableCell>{rule.master_insurance_providers?.provider_name}</TableCell>
                  <TableCell>{rule.master_product_name?.product_name}</TableCell>
                  <TableCell>{rule.master_line_of_business?.lob_name}</TableCell>
                  <TableCell>{rule.base_rate}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{rule.final_effective_rate}%</span>
                      {!rule.is_compliant && (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_compliant ? 'default' : 'destructive'}>
                      {rule.is_compliant ? 'Compliant' : 'Exceeds Cap'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                      {rule.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleEdit(rule)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(rule.rule_id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No commission rules found. Create your first rule to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};