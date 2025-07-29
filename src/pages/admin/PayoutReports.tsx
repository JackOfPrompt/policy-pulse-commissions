import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Download,
  Upload,
  CreditCard,
  Users,
  Clock,
  TrendingUp,
  Calendar
} from "lucide-react";

const PayoutReports = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [lineOfBusinessFilter, setLineOfBusinessFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  
  // KPI States
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [agentsPaid, setAgentsPaid] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);

  // Filter options
  const [agents, setAgents] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
    fetchKPIs();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchPayouts();
      fetchKPIs();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter, agentFilter, branchFilter, tierFilter, providerFilter, lineOfBusinessFilter, dateFromFilter, dateToFilter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("payout_reports")
        .select("*")
        .order("payout_date", { ascending: false });

      if (searchTerm) {
        query = query.or(`agent_name.ilike.%${searchTerm}%,agent_code.ilike.%${searchTerm}%,policy_number.ilike.%${searchTerm}%`);
      }
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("payout_status", statusFilter as "Pending" | "Paid" | "Failed" | "On Hold");
      }
      if (agentFilter && agentFilter !== "all") {
        query = query.eq("agent_id", agentFilter);
      }
      if (branchFilter && branchFilter !== "all") {
        query = query.eq("branch_name", branchFilter);
      }
      if (tierFilter && tierFilter !== "all") {
        query = query.eq("agent_tier_name", tierFilter);
      }
      if (providerFilter && providerFilter !== "all") {
        query = query.eq("insurer_name", providerFilter);
      }
      if (lineOfBusinessFilter && lineOfBusinessFilter !== "all") {
        query = query.eq("line_of_business", lineOfBusinessFilter);
      }
      if (dateFromFilter) {
        query = query.gte("payout_date", dateFromFilter);
      }
      if (dateToFilter) {
        query = query.lte("payout_date", dateToFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayouts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payout reports",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async () => {
    try {
      // Total payouts this month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { data: totalData, error: totalError } = await supabase
        .from("payout_reports")
        .select("payout_amount")
        .gte("payout_date", `${currentMonth}-01`);

      if (totalError) throw totalError;
      
      const total = totalData?.reduce((sum, item) => sum + (item.payout_amount || 0), 0) || 0;
      setTotalPayouts(total);

      // Unique agents paid this month
      const { data: agentsData, error: agentsError } = await supabase
        .from("payout_reports")
        .select("agent_id")
        .gte("payout_date", `${currentMonth}-01`)
        .eq("payout_status", "Paid");

      if (agentsError) throw agentsError;
      
      const uniqueAgents = new Set(agentsData?.map(item => item.agent_id)).size;
      setAgentsPaid(uniqueAgents);

      // Pending payouts count
      const { data: pendingData, error: pendingError } = await supabase
        .from("payout_reports")
        .select("id", { count: "exact" })
        .eq("payout_status", "Pending");

      if (pendingError) throw pendingError;
      setPendingPayouts(pendingData?.length || 0);

      // Total commission vs payout
      const { data: commissionData, error: commissionError } = await supabase
        .from("payout_reports")
        .select("commission_amount")
        .gte("payout_date", `${currentMonth}-01`);

      if (commissionError) throw commissionError;
      
      const totalCommissionEarned = commissionData?.reduce((sum, item) => sum + (item.commission_amount || 0), 0) || 0;
      setTotalCommission(totalCommissionEarned);

    } catch (error: any) {
      console.error("Error fetching KPIs:", error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch agents
      const { data: agentsData } = await supabase
        .from("agents")
        .select("id, name, agent_code")
        .eq("status", "Active");
      setAgents(agentsData || []);

      // Fetch branches
      const { data: branchesData } = await supabase
        .from("branches")
        .select("name")
        .eq("status", "Active");
      if (branchesData) {
        const branchNames = branchesData.map(b => b.name).filter(Boolean);
        setBranches([...new Set(branchNames)]);
      }

      // Fetch tiers
      const { data: tiersData } = await supabase
        .from("agent_tiers")
        .select("name");
      if (tiersData) {
        const tierNames = tiersData.map(t => t.name).filter(Boolean);
        setTiers([...new Set(tierNames)]);
      }

      // Fetch providers
      const { data: providersData } = await supabase
        .from("insurance_providers")
        .select("provider_name")
        .eq("status", "Active");
      if (providersData) {
        const providerNames = providersData.map(p => p.provider_name).filter(Boolean);
        setProviders([...new Set(providerNames)]);
      }

    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const handleExport = async () => {
    try {
      // Implementation for CSV export
      const csvContent = payouts.map(payout => [
        payout.payout_id,
        payout.payout_date,
        payout.agent_name,
        payout.agent_code,
        payout.agent_tier_name,
        payout.branch_name,
        payout.line_of_business,
        payout.product_name,
        payout.insurer_name,
        payout.policy_number,
        payout.premium_amount,
        payout.commission_amount,
        payout.payout_amount,
        payout.payout_status,
        payout.payment_mode,
        payout.processed_by_name,
        payout.remarks
      ].join(",")).join("\n");

      const headers = [
        "Payout ID", "Payout Date", "Agent Name", "Agent Code", "Agent Tier",
        "Branch", "Line of Business", "Product", "Insurer", "Policy Number",
        "Premium Amount", "Commission", "Payout Amount", "Status", "Payment Mode",
        "Processed By", "Remarks"
      ].join(",");

      const csv = headers + "\n" + csvContent;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payout_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: "Report exported successfully" });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid": return "default";
      case "Pending": return "secondary";
      case "Failed": return "destructive";
      case "On Hold": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/dashboard">Admin Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payout Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payout Reports</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage agent commission payouts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-gradient-primary shadow-primary">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts (This Month)</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPayouts.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents Paid</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentsPaid}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission vs Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCommission > 0 ? Math.round((totalPayouts / totalCommission) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search agents, codes, policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.agent_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {tiers.map((tier) => (
                  <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={lineOfBusinessFilter} onValueChange={setLineOfBusinessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by line of business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Motor">Motor</SelectItem>
                <SelectItem value="Life">Life</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="From date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
              <Input
                type="date"
                placeholder="To date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout Transactions ({payouts.length})
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Line of Business</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Payout Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.payout_id}</TableCell>
                      <TableCell>{new Date(payout.payout_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.agent_name}</div>
                          <div className="text-sm text-muted-foreground">{payout.agent_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{payout.branch_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payout.agent_tier_name}</Badge>
                      </TableCell>
                      <TableCell>{payout.line_of_business}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.product_name}</div>
                          <div className="text-sm text-muted-foreground">{payout.insurer_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{payout.policy_number}</TableCell>
                      <TableCell>₹{payout.commission_amount?.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">₹{payout.payout_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(payout.payout_status)}>
                          {payout.payout_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payout.payment_mode}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!loading && payouts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payout transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutReports;