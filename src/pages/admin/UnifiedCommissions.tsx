import { useState, useEffect } from "react";
import { DollarSign, Download, Filter, Search, CheckCircle, Clock, Plus, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import users from "@/data/users.json";
import AddGridModal from "@/components/admin/AddGridModal";

interface GridEntry {
  id: string;
  product_type: string;
  provider: string;
  commission_rate: number;
  reward_rate?: number;
  is_active: boolean;
  created_at: string;
  valid_from?: string;
  valid_to?: string;
  commission_start_date?: string;
  commission_end_date?: string;
  [key: string]: any;
}

interface PolicyCommission {
  id: string;
  policy_id: string;
  product_type: string;
  grid_table: string;
  grid_id: string;
  commission_rate: number;
  reward_rate: number;
  total_rate: number;
  commission_amount: number;
  reward_amount: number;
  total_amount: number;
  payout_status: string;
  created_at: string;
  policy?: {
    policy_number: string;
    agent_id?: string;
    provider?: string;
  };
  agent?: {
    agent_name: string;
  } | null;
}

export default function UnifiedCommissions() {
  const user = users.admin;
  const { toast } = useToast();
  const [motorGrids, setMotorGrids] = useState<GridEntry[]>([]);
  const [healthGrids, setHealthGrids] = useState<GridEntry[]>([]);
  const [lifeGrids, setLifeGrids] = useState<GridEntry[]>([]);
  const [policyCommissions, setPolicyCommissions] = useState<PolicyCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("grids");
  const [activeGridTab, setActiveGridTab] = useState("motor");
  const [filters, setFilters] = useState({
    provider: "",
    status: "all"
  });

  useEffect(() => {
    fetchCommissionGrids();
    if (activeTab === "records") {
      fetchPolicyCommissions();
    }
  }, [activeTab]);

  const fetchCommissionGrids = async () => {
    try {
      setLoading(true);

      // Fetch Motor grids
      const { data: motorData, error: motorError } = await supabase
        .from('motor_payout_grid')
        .select('*')
        .order('created_at', { ascending: false });

      if (motorError) throw motorError;

      // Fetch Health grids
      const { data: healthData, error: healthError } = await supabase
        .from('health_payout_grid')
        .select('*')
        .order('created_at', { ascending: false });

      if (healthError) throw healthError;

      // Fetch Life grids
      const { data: lifeData, error: lifeError } = await supabase
        .from('life_payout_grid')
        .select('*')
        .order('created_at', { ascending: false });

      if (lifeError) throw lifeError;

      setMotorGrids(motorData || []);
      setHealthGrids(healthData || []);
      setLifeGrids(lifeData || []);
    } catch (error) {
      console.error('Error fetching commission grids:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission grids",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyCommissions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('policy_commissions')
        .select(`
          id,
          policy_id,
          product_type,
          grid_table,
          grid_id,
          commission_rate,
          reward_rate,
          total_rate,
          commission_amount,
          reward_amount,
          total_amount,
          payout_status,
          created_at,
          policies(
            policy_number,
            agent_id,
            provider,
            agents(
              agent_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData: PolicyCommission[] = (data || []).map((item: any) => ({
        id: item.id,
        policy_id: item.policy_id,
        product_type: item.product_type,
        grid_table: item.grid_table,
        grid_id: item.grid_id,
        commission_rate: item.commission_rate,
        reward_rate: item.reward_rate,
        total_rate: item.total_rate,
        commission_amount: item.commission_amount,
        reward_amount: item.reward_amount,
        total_amount: item.total_amount,
        payout_status: item.payout_status,
        created_at: item.created_at,
        policy: item.policies,
        agent: item.policies?.agents
      }));

      setPolicyCommissions(transformedData);
    } catch (error) {
      console.error('Error fetching policy commissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch policy commissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutStatus = async (commissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('policy_commissions')
        .update({ payout_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payout status updated to ${newStatus}`,
      });

      fetchPolicyCommissions();
    } catch (error) {
      console.error('Error updating payout status:', error);
      toast({
        title: "Error",
        description: "Failed to update payout status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, gridType: string) => {
    if (!confirm('Are you sure you want to delete this commission grid entry?')) return;

    try {
      let tableName: string;
      switch (gridType) {
        case 'motor':
          tableName = 'motor_payout_grid';
          break;
        case 'health':
          tableName = 'health_payout_grid';
          break;
        case 'life':
          tableName = 'life_payout_grid';
          break;
        default:
          throw new Error('Invalid grid type');
      }

      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission grid entry deleted successfully",
      });

      fetchCommissionGrids();
    } catch (error) {
      console.error('Error deleting grid entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission grid entry",
        variant: "destructive",
      });
    }
  };

  const filterGridData = (data: GridEntry[]) => {
    return data.filter(entry => {
      const matchesProvider = !filters.provider || entry.provider.toLowerCase().includes(filters.provider.toLowerCase());
      const matchesStatus = filters.status === "all" || 
        (filters.status === "active" && entry.is_active) ||
        (filters.status === "inactive" && !entry.is_active);
      
      return matchesProvider && matchesStatus;
    });
  };

  const getValidFromDate = (entry: GridEntry) => {
    return entry.valid_from || entry.commission_start_date || '';
  };

  const getValidToDate = (entry: GridEntry) => {
    return entry.valid_to || entry.commission_end_date || '';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPayoutStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'approved': return 'info';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const totalCommissions = policyCommissions.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const pendingCommissions = policyCommissions.filter(c => c.payout_status === 'pending');

  const renderGridTable = (data: GridEntry[], gridType: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by provider..."
          value={filters.provider}
          onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
          className="max-w-xs"
        />
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button>
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <AddGridModal 
          onGridAdded={fetchCommissionGrids} 
          orgId={user.id} 
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Product Type</TableHead>
            <TableHead>Commission %</TableHead>
            <TableHead>Reward %</TableHead>
            <TableHead>Total %</TableHead>
            <TableHead>Valid From</TableHead>
            <TableHead>Valid To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filterGridData(data).map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.provider}</TableCell>
              <TableCell>{entry.product_type}</TableCell>
              <TableCell>{entry.commission_rate}%</TableCell>
              <TableCell>{entry.reward_rate || 0}%</TableCell>
              <TableCell className="font-medium">
                {(entry.commission_rate + (entry.reward_rate || 0)).toFixed(2)}%
              </TableCell>
              <TableCell>
                {getValidFromDate(entry) ? new Date(getValidFromDate(entry)).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                {getValidToDate(entry) ? new Date(getValidToDate(entry)).toLocaleDateString() : 'No End Date'}
              </TableCell>
              <TableCell>
                <Badge variant={entry.is_active ? "default" : "secondary"}>
                  {entry.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(entry.id, gridType)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout role="admin" user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading commission data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Commission Management</h1>
            <p className="text-muted-foreground">
              Manage commission grids and track payout records
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalCommissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From policy commissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCommissions.length}</div>
              <p className="text-xs text-muted-foreground">
                ₹{pendingCommissions.reduce((sum, c) => sum + (c.total_amount || 0), 0).toLocaleString()} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Grids</CardTitle>
              <CheckCircle className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {motorGrids.filter(g => g.is_active).length + healthGrids.filter(g => g.is_active).length + lifeGrids.filter(g => g.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Commission Management</CardTitle>
            <CardDescription>
              Configure commission grids and view payout records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="grids">Commission Grids</TabsTrigger>
                <TabsTrigger value="records">Commission Records</TabsTrigger>
              </TabsList>

              <TabsContent value="grids" className="mt-6">
                <Tabs value={activeGridTab} onValueChange={setActiveGridTab}>
                  <TabsList>
                    <TabsTrigger value="motor">Motor Insurance</TabsTrigger>
                    <TabsTrigger value="health">Health Insurance</TabsTrigger>
                    <TabsTrigger value="life">Life Insurance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="motor" className="mt-6">
                    {renderGridTable(motorGrids, "motor")}
                  </TabsContent>

                  <TabsContent value="health" className="mt-6">
                    {renderGridTable(healthGrids, "health")}
                  </TabsContent>

                  <TabsContent value="life" className="mt-6">
                    {renderGridTable(lifeGrids, "life")}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="records" className="mt-6">
                <div className="space-y-4">
                  <div className="mb-4 flex space-x-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search policy commissions..."
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Records
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Product Type</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Grid Source</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policyCommissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.policy?.policy_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {commission.agent?.agent_name || 'Unassigned'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{commission.product_type}</Badge>
                          </TableCell>
                          <TableCell>{commission.commission_rate}%</TableCell>
                          <TableCell className="font-medium">
                            ₹{commission.total_amount?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell>
                            <StatusChip variant={getPayoutStatusVariant(commission.payout_status)}>
                              {commission.payout_status}
                            </StatusChip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">
                                {commission.grid_table?.replace('_payout_grid', '')}
                              </span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {commission.payout_status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updatePayoutStatus(commission.id, 'approved')}
                                >
                                  Approve
                                </Button>
                              )}
                              {commission.payout_status === 'approved' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updatePayoutStatus(commission.id, 'paid')}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}