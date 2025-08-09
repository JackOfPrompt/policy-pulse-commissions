import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TierPayoutForm } from "@/components/admin/TierPayoutForm";
import { TierForm } from "@/components/admin/TierForm";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  X, 
  Trash2,
  Calculator,
  Target,
  Settings,
  Trophy
} from "lucide-react";

const Payouts = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
    fetchTiers();
    fetchProducts();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("tier_payout_rules")
        .select(`
          *,
          agent_tiers (name),
          insurance_products (name, insurance_providers (provider_name))
        `)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`agent_tiers.name.ilike.%${searchTerm}%,insurance_products.name.ilike.%${searchTerm}%`);
      }
      if (tierFilter && tierFilter !== "all") {
        query = query.eq("agent_tier_id", tierFilter);
      }
      if (productFilter && productFilter !== "all") {
        query = query.eq("product_id", productFilter);
      }
      if (typeFilter && typeFilter !== "all") {
        query = query.eq("agent_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payout rules",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      setTiersLoading(true);
      const { data, error } = await supabase
        .from("agent_tiers")
        .select("*")
        .order("level");

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error("Error fetching tiers:", error);
    } finally {
      setTiersLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("insurance_products")
        .select("id, name, insurance_providers(provider_name)")
        .eq("status", "Active")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchRules();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, tierFilter, productFilter, typeFilter]);

  const handleEditRule = (rule: any) => {
    setSelectedRule(rule);
    setShowForm(true);
  };

  const handleDisableRule = async (rule: any) => {
    try {
      const newStatus = rule.status === "Active" ? "Inactive" : "Active";
      const { error } = await supabase
        .from("tier_payout_rules")
        .update({ status: newStatus })
        .eq("id", rule.id);

      if (error) throw error;
      
      toast({ title: `Payout rule ${newStatus.toLowerCase()} successfully` });
      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (rule: any) => {
    if (!confirm("Are you sure you want to delete this payout rule?")) return;

    try {
      const { error } = await supabase
        .from("tier_payout_rules")
        .delete()
        .eq("id", rule.id);

      if (error) throw error;
      
      toast({ title: "Payout rule deleted successfully" });
      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditTier = (tier: any) => {
    setSelectedTier(tier);
    setShowTierForm(true);
  };

  const handleDeleteTier = async (tier: any) => {
    if (!confirm("Are you sure you want to delete this tier? This will also delete all associated payout rules.")) return;

    try {
      const { error } = await supabase
        .from("agent_tiers")
        .delete()
        .eq("id", tier.id);

      if (error) throw error;
      
      toast({ title: "Tier deleted successfully" });
      fetchTiers();
      fetchRules(); // Refresh rules as they might be affected
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">

        <div className="flex items-center justify-between">
          <div></div>
        </div>
      </div>

      <Tabs defaultValue="payout-rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payout-rules" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Payout Rules
          </TabsTrigger>
          <TabsTrigger value="tier-management" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Tier Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payout-rules" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setSelectedRule(null);
                setShowForm(true);
              }}
              className="bg-gradient-primary shadow-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payout Rule
            </Button>
          </div>

          {/* Filters */}
          <Card className="shadow-card">
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
                
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by product" />
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

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by agent type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="POSP">POSP</SelectItem>
                    <SelectItem value="MISP">MISP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payout Rules Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Payout Rules ({rules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Insurer</TableHead>
                      <TableHead>Agent Type</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            {rule.agent_tiers?.name}
                          </div>
                        </TableCell>
                        <TableCell>{rule.insurance_products?.name}</TableCell>
                        <TableCell>{rule.insurance_products?.insurance_providers?.provider_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rule.agent_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {rule.commission_type === "Percentage" 
                              ? `${rule.commission_value}%` 
                              : `₹${rule.commission_value}`
                            }
                          </span>
                        </TableCell>
                        <TableCell>{new Date(rule.effective_from).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={rule.status === "Active" ? "default" : "secondary"}
                            className={rule.status === "Active" ? "bg-gradient-success" : ""}
                          >
                            {rule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Rule
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDisableRule(rule)}>
                                <X className="h-4 w-4 mr-2" />
                                {rule.status === "Active" ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRule(rule)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {!loading && rules.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payout rules found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tier-management" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setSelectedTier(null);
                setShowTierForm(true);
              }}
              className="bg-gradient-primary shadow-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Tier
            </Button>
          </div>

          {/* Agent Tiers Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Agent Tiers ({tiers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tiersLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            {tier.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tier.level ? (
                            <Badge variant="outline">Level {tier.level}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tier.description || (
                            <span className="text-muted-foreground">No description</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(tier.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTier(tier)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Tier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTier(tier)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {!tiersLoading && tiers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No agent tiers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TierPayoutForm
        open={showForm}
        onOpenChange={setShowForm}
        rule={selectedRule}
        onSuccess={() => {
          fetchRules();
          setSelectedRule(null);
        }}
      />

      <TierForm
        open={showTierForm}
        onOpenChange={setShowTierForm}
        tier={selectedTier}
        onSuccess={() => {
          fetchTiers();
          setSelectedTier(null);
        }}
      />
    </div>
  );
};

export default Payouts;