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
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedCommissionGridModal } from "@/components/admin/EnhancedCommissionGridModal";
import { CommissionCalculationPanel } from "@/components/admin/CommissionCalculationPanel";

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
  // Enhanced fields for commission distribution
  source_type?: string;
  source_name?: string;
  premium_amount?: number;
  customer_name?: string;
  agent_commission_rate?: number;
  agent_commission_amount?: number;
  misp_commission_rate?: number;
  misp_commission_amount?: number;
  employee_commission_rate?: number;
  employee_commission_amount?: number;
  broker_share_rate?: number;
  broker_share_amount?: number;
}

export default function UnifiedCommissions() {
  const { profile } = useAuth();
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
  const [searchTerm, setSearchTerm] = useState("");
  const [gridModalOpen, setGridModalOpen] = useState(false);
  const [editingGrid, setEditingGrid] = useState<GridEntry | null>(null);

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

      // Use the enhanced commission distribution report for better data
      const { data, error } = await supabase
        .rpc('get_commission_distribution_report', {
          p_org_id: null, // Uses current user's org
          p_product_type: null,
          p_commission_status: null,
          p_date_from: null,
          p_date_to: null
        });

      if (error) throw error;

      // Transform the enhanced data to match our interface
      const transformedData: PolicyCommission[] = (data || []).map((item: any) => ({
        id: item.policy_id, // Use policy_id as unique identifier
        policy_id: item.policy_id,
        product_type: item.product_type,
        grid_table: item.grid_source || 'unknown',
        grid_id: 'N/A',
        commission_rate: item.insurer_commission_rate || 0,
        reward_rate: 0, // Will calculate from total
        total_rate: item.insurer_commission_rate || 0,
        commission_amount: item.insurer_commission_amount || 0,
        reward_amount: 0,
        total_amount: item.insurer_commission_amount || 0,
        payout_status: item.commission_status || 'calculated',
        created_at: item.calc_date,
        policy: {
          policy_number: item.policy_number,
          agent_id: null,
          provider: item.provider
        },
        agent: item.source_type === 'agent' ? { agent_name: item.source_name } : null,
        // Enhanced fields for distribution
        source_type: item.source_type,
        source_name: item.source_name,
        premium_amount: item.premium_amount,
        customer_name: item.customer_name,
        agent_commission_rate: item.agent_commission_rate || 0,
        agent_commission_amount: item.agent_commission_amount || 0,
        misp_commission_rate: item.misp_commission_rate || 0,
        misp_commission_amount: item.misp_commission_amount || 0,
        employee_commission_rate: item.employee_commission_rate || 0,
        employee_commission_amount: item.employee_commission_amount || 0,
        broker_share_rate: item.broker_share_rate || 0,
        broker_share_amount: item.broker_share_amount || 0
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

  const exportCommissionData = () => {
    if (policyCommissions.length === 0) return;

    const headers = [
      'Policy Number',
      'Customer Name',
      'Product Type',
      'Provider',
      'Premium Amount',
      'Source Type',
      'Source Name',
      'Total Commission Rate %',
      'Insurer Commission Amount',
      'Agent Commission Amount',
      'MISP Commission Amount', 
      'Employee Commission Amount',
      'Broker Share Amount',
      'Status',
      'Date'
    ];

    const csvContent = [
      headers.join(','),
      ...policyCommissions.map(record => [
        record.policy?.policy_number || '',
        record.customer_name || '',
        record.product_type || '',
        record.policy?.provider || '',
        record.premium_amount || 0,
        record.source_type || 'direct',
        record.source_name || 'Direct',
        record.commission_rate || 0,
        record.commission_amount || 0,
        record.agent_commission_amount || 0,
        record.misp_commission_amount || 0,
        record.employee_commission_amount || 0,
        record.broker_share_amount || 0,
        record.payout_status || '',
        new Date(record.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commission_distribution_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleCopy = async (gridEntry: GridEntry, gridType: string) => {
    try {
      // Create a copy with new ID and current timestamp
      const copyData = {
        ...gridEntry,
        id: undefined, // Let the database generate new ID
        created_at: undefined,
        updated_at: undefined,
        provider: `${gridEntry.provider} (Copy)`,
        is_active: false // Make copies inactive by default
      };

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
        .insert(copyData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission grid copied successfully",
      });

      fetchCommissionGrids();
    } catch (error) {
      console.error('Error copying grid entry:', error);
      toast({
        title: "Error",
        description: "Failed to copy commission grid entry",
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

  const totalCommissions = policyCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const pendingCommissions = policyCommissions.filter(c => c.payout_status === 'pending' || c.payout_status === 'calculated');
  const totalBrokerShare = policyCommissions.reduce((sum, c) => sum + (c.broker_share_amount || 0), 0);
  const totalAgentCommissions = policyCommissions.reduce((sum, c) => sum + (c.agent_commission_amount || 0), 0);
  const totalMispCommissions = policyCommissions.reduce((sum, c) => sum + (c.misp_commission_amount || 0), 0);
  const totalEmployeeCommissions = policyCommissions.reduce((sum, c) => sum + (c.employee_commission_amount || 0), 0);

  const filteredPolicyCommissions = policyCommissions.filter(commission => {
    const searchFields = [
      commission.policy?.policy_number,
      commission.agent?.agent_name,
      commission.source_name,
      commission.customer_name,
      commission.product_type,
      commission.payout_status,
      commission.source_type
    ].join(' ').toLowerCase();
    
    return searchFields.includes(searchTerm.toLowerCase());
  });

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
        <Button onClick={() => setGridModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Commission Grid
        </Button>
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingGrid(entry);
                      setGridModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopy(entry, gridType)}
                  >
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
      <DashboardLayout role="admin" user={{
        name: profile?.full_name || "Admin User",
        email: profile?.email || "",
        role: profile?.role || "admin"
      }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading commission data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" user={{
      name: profile?.full_name || "Admin User",
      email: profile?.email || "",
      role: profile?.role || "admin"
    }}>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Insurer Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalCommissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From all policies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Broker Share</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₹{totalBrokerShare.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Retained by organization</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Source Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{(totalAgentCommissions + totalMispCommissions + totalEmployeeCommissions).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Agent: ₹{totalAgentCommissions.toLocaleString()} | MISP: ₹{totalMispCommissions.toLocaleString()} | Employee: ₹{totalEmployeeCommissions.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCommissions.length}</div>
              <p className="text-xs text-muted-foreground">
                ₹{pendingCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0).toLocaleString()} pending
              </p>
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
                <TabsTrigger value="calculations">Live Calculations</TabsTrigger>
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

              <TabsContent value="calculations" className="mt-6">
                <CommissionCalculationPanel />
              </TabsContent>

              <TabsContent value="records" className="mt-6">
                <div className="space-y-4">
                  <div className="mb-4 flex space-x-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search policy commissions..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={exportCommissionData}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Records
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy Details</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Total Rate %</TableHead>
                        <TableHead>Insurer Commission</TableHead>
                        <TableHead>Source Commission</TableHead>
                        <TableHead>Broker Share</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPolicyCommissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {commission.policy?.policy_number || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {commission.customer_name || 'Unknown Customer'}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {commission.product_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {commission.source_name || 'Direct'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {commission.source_type || 'direct'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{commission.premium_amount?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-primary">
                              {commission.commission_rate?.toFixed(2) || 0}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                ₹{commission.commission_amount?.toLocaleString() || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {commission.commission_rate?.toFixed(1) || 0}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {commission.source_type === 'agent' && (
                                <>
                                  <div className="font-medium text-blue-600">
                                    ₹{commission.agent_commission_amount?.toLocaleString() || 0}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Agent: {commission.agent_commission_rate?.toFixed(1) || 0}%
                                  </div>
                                </>
                              )}
                              {commission.source_type === 'misp' && (
                                <>
                                  <div className="font-medium text-green-600">
                                    ₹{commission.misp_commission_amount?.toLocaleString() || 0}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    MISP: {commission.misp_commission_rate?.toFixed(1) || 0}%
                                  </div>
                                </>
                              )}
                              {commission.source_type === 'employee' && (
                                <>
                                  <div className="font-medium text-purple-600">
                                    ₹{commission.employee_commission_amount?.toLocaleString() || 0}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Employee: {commission.employee_commission_rate?.toFixed(1) || 0}%
                                  </div>
                                </>
                              )}
                              {(!commission.source_type || commission.source_type === 'direct') && (
                                <div className="text-sm text-muted-foreground">Direct Sale</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-orange-600">
                                ₹{commission.broker_share_amount?.toLocaleString() || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Broker: {commission.broker_share_rate?.toFixed(1) || 0}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusChip variant={getPayoutStatusVariant(commission.payout_status)}>
                              {commission.payout_status}
                            </StatusChip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {commission.payout_status === 'calculated' && (
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

      <EnhancedCommissionGridModal
        open={gridModalOpen}
        onOpenChange={setGridModalOpen}
        grid={editingGrid}
        onSuccess={() => {
          fetchCommissionGrids();
          setEditingGrid(null);
        }}
      />
    </DashboardLayout>
  );
}