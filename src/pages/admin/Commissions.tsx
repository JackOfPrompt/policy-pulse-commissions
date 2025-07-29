import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Filter, Search, Edit, Trash2, Settings, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommissionRuleForm } from "@/components/admin/CommissionRuleForm";
import { CommissionCalculator } from "@/components/admin/CommissionCalculator";

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

const Commissions = () => {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("all");
  const [filterLOB, setFilterLOB] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [activeTab, setActiveTab] = useState("rules");
  
  const { toast } = useToast();

  // Commission statistics
  const commissionStats = [
    { label: "Active Rules", value: filteredRules.filter(r => r.is_active).length.toString(), change: "+5%" },
    { label: "Lines of Business", value: new Set(filteredRules.map(r => r.line_of_business)).size.toString(), change: "4" },
    { label: "Avg First Year Rate", value: "12.5%", change: "+2%" },
    { label: "Avg Renewal Rate", value: "5.8%", change: "+1%" }
  ];

  useEffect(() => {
    fetchCommissionRules();
  }, []);

  useEffect(() => {
    filterRules();
  }, [commissionRules, searchTerm, filterInsurer, filterLOB, filterTier, filterStatus]);

  const fetchCommissionRules = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .select(`
          *,
          insurance_providers:insurer_id(provider_name),
          insurance_products:product_id(name),
          commission_rule_tiers(
            commission_tiers(name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissionRules(data || []);
    } catch (error) {
      console.error('Error fetching commission rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRules = () => {
    let filtered = commissionRules;

    if (searchTerm) {
      filtered = filtered.filter(rule =>
        rule.insurance_providers?.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.insurance_products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterInsurer && filterInsurer !== "all") {
      filtered = filtered.filter(rule => rule.insurer_id === filterInsurer);
    }

    if (filterLOB && filterLOB !== "all") {
      filtered = filtered.filter(rule => rule.line_of_business === filterLOB);
    }

    if (filterStatus && filterStatus !== "all") {
      filtered = filtered.filter(rule => rule.is_active.toString() === filterStatus);
    }

    setFilteredRules(filtered);
  };

  const handleEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    setShowRuleForm(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this commission rule?')) return;

    try {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission rule deleted successfully",
      });
      
      fetchCommissionRules();
    } catch (error) {
      console.error('Error deleting commission rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission rule",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowRuleForm(false);
    setEditingRule(null);
    fetchCommissionRules();
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-gradient-success">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getRuleTypeBadge = (ruleType: string) => {
    const colors = {
      'Flat %': 'bg-primary',
      'Fixed': 'bg-secondary',
      'Tiered': 'bg-gradient-warning',
      'Premium-Based': 'bg-gradient-primary',
      'Volume-Based': 'bg-accent'
    };
    
    return (
      <Badge className={colors[ruleType as keyof typeof colors] || 'bg-secondary'}>
        {ruleType}
      </Badge>
    );
  };

  const formatRate = (rate?: number, amount?: number) => {
    if (rate) return `${rate}%`;
    if (amount) return `₹${amount}`;
    return '-';
  };

  if (loading) {
    return <div className="p-6">Loading commission rules...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Commission Rule Engine</h1>
            <p className="text-muted-foreground mt-1">
              Manage commission rules for all insurance products and lines of business
            </p>
          </div>
          
          <Dialog open={showRuleForm} onOpenChange={setShowRuleForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRule(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Commission Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Commission Rule' : 'Create New Commission Rule'}
                </DialogTitle>
              </DialogHeader>
              <CommissionRuleForm 
                rule={editingRule}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowRuleForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-6">
          {/* Commission Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {commissionStats.map((stat) => (
              <Card key={stat.label} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <Badge variant="outline" className="mt-1 bg-gradient-success">
                        {stat.change}
                      </Badge>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search rules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterLOB} onValueChange={setFilterLOB}>
                  <SelectTrigger>
                    <SelectValue placeholder="Line of Business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lines</SelectItem>
                    <SelectItem value="Motor">Motor</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Life">Life</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterInsurer("all");
                    setFilterLOB("all");
                    setFilterTier("all");
                    setFilterStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commission Rules Table */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Rules ({filteredRules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insurer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Line of Business</TableHead>
                    <TableHead>Rule Type</TableHead>
                    <TableHead>First Year</TableHead>
                    <TableHead>Renewal</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Tiers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
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
                        {getRuleTypeBadge(rule.rule_type)}
                      </TableCell>
                      <TableCell>
                        {formatRate(rule.first_year_rate, rule.first_year_amount)}
                      </TableCell>
                      <TableCell>
                        {formatRate(rule.renewal_rate, rule.renewal_amount)}
                      </TableCell>
                      <TableCell>{rule.effective_from}</TableCell>
                      <TableCell>{rule.effective_to || 'Indefinite'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">v{rule.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rule.frequency}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.commission_rule_tiers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rule.commission_rule_tiers.slice(0, 2).map((tier, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tier.commission_tiers.code}
                              </Badge>
                            ))}
                            {rule.commission_rule_tiers.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{rule.commission_rule_tiers.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "All Tiers"
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(rule.is_active)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No commission rules found. Create your first rule to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <CommissionCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Commissions;