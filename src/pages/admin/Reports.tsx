import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Download, FileText, DollarSign, Users, TrendingUp, Activity, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface FilterState {
  startDate: string;
  endDate: string;
  branch: string;
  agent: string;
  employee: string;
  product: string;
  insurer: string;
  lineOfBusiness: string;
  status: string;
  source: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("policies");
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    branch: "",
    agent: "",
    employee: "",
    product: "",
    insurer: "",
    lineOfBusiness: "",
    status: "",
    source: ""
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});

  useEffect(() => {
    fetchReportData();
  }, [activeTab, filters]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "policies":
          await fetchPoliciesReport();
          break;
        case "commissions":
          await fetchCommissionsReport();
          break;
        case "payouts":
          await fetchPayoutsReport();
          break;
        case "performance":
          await fetchAgentPerformanceReport();
          break;
        case "employees":
          await fetchEmployeesReport();
          break;
        case "leads":
          await fetchLeadsReport();
          break;
        case "renewals":
          await fetchRenewalsReport();
          break;
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPoliciesReport = async () => {
    let query = supabase
      .from("policies_with_details")
      .select("*");

    if (filters.startDate) query = query.gte("policy_start_date", filters.startDate);
    if (filters.endDate) query = query.lte("policy_start_date", filters.endDate);
    if (filters.lineOfBusiness) query = query.eq("line_of_business", filters.lineOfBusiness);
    if (filters.status) query = query.eq("status", filters.status);

    const { data: policies } = await query;
    setData(policies || []);

    // Calculate KPIs
    const totalPolicies = policies?.length || 0;
    const totalPremium = policies?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0;
    const activePolicies = policies?.filter(p => p.status === "Active").length || 0;

    setKpis({
      totalPolicies,
      totalPremium,
      activePolicies,
      renewalsDue: 0 // Calculate based on expiry dates
    });
  };

  const fetchCommissionsReport = async () => {
    let query = supabase
      .from("commissions")
      .select(`
        *,
        policies!inner(policy_number, premium_amount, line_of_business),
        agents!inner(name, agent_code)
      `);

    const { data: commissions } = await query;
    setData(commissions || []);

    const totalCommission = commissions?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;
    const renewalCommissions = commissions?.filter(c => c.commission_type === "Renewal")
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

    setKpis({
      totalCommission,
      renewalCommissions,
      avgCommissionRate: commissions?.length ? (commissions.reduce((sum, c) => sum + (c.commission_rate || 0), 0) / commissions.length) : 0,
      totalPolicies: commissions?.length || 0
    });
  };

  const fetchPayoutsReport = async () => {
    // Placeholder for payouts data
    setData([]);
    setKpis({
      totalPayouts: 0,
      pendingPayouts: 0,
      avgPayoutPerAgent: 0,
      totalAgents: 0
    });
  };

  const fetchAgentPerformanceReport = async () => {
    let query = supabase
      .from("agents")
      .select(`
        *,
        policies!inner(premium_amount, policy_start_date),
        commissions(commission_amount)
      `);

    const { data: agents } = await query;
    setData(agents || []);

    setKpis({
      activeAgents: agents?.filter(a => a.status === "Active").length || 0,
      avgCommissionPerAgent: 0,
      conversionRatio: 0,
      topPerformer: "N/A"
    });
  };

  const fetchEmployeesReport = async () => {
    let query = supabase
      .from("employees")
      .select(`
        *,
        branches(name),
        agents(id)
      `);

    if (filters.branch) query = query.eq("branch_id", filters.branch);
    if (filters.status) query = query.eq("status", filters.status);

    const { data: employees } = await query;
    setData(employees || []);

    const totalEmployees = employees?.length || 0;
    const activeEmployees = employees?.filter(e => e.status === "Active").length || 0;

    setKpis({
      totalEmployees,
      activeEmployees,
      avgBusinessPerEmployee: 0,
      topPerformer: "N/A"
    });
  };

  const fetchLeadsReport = async () => {
    // Placeholder for leads data - would need leads table
    setData([]);
    setKpis({
      totalLeads: 0,
      conversionRate: 0,
      convertedLeads: 0,
      lostLeads: 0
    });
  };

  const fetchRenewalsReport = async () => {
    let query = supabase
      .from("policies_with_details")
      .select("*")
      .gte("policy_end_date", new Date().toISOString().split('T')[0]);

    if (filters.lineOfBusiness) query = query.eq("line_of_business", filters.lineOfBusiness);

    const { data: renewals } = await query;
    setData(renewals || []);

    const renewalsDue = renewals?.length || 0;
    const renewedPolicies = renewals?.filter(r => r.status === "Renewed").length || 0;

    setKpis({
      renewalsDue,
      renewedPolicies,
      missedRenewals: renewalsDue - renewedPolicies,
      renewalRate: renewalsDue > 0 ? (renewedPolicies / renewalsDue) * 100 : 0
    });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = (format: string) => {
    // Placeholder for export functionality
    console.log(`Exporting ${activeTab} report as ${format}`);
  };

  const renderKPICards = () => {
    const kpiConfigs = {
      policies: [
        { label: "Total Policies", value: kpis.totalPolicies || 0, icon: FileText, format: "number" },
        { label: "Total Premium", value: kpis.totalPremium || 0, icon: DollarSign, format: "currency" },
        { label: "Active Policies", value: kpis.activePolicies || 0, icon: Activity, format: "number" },
        { label: "Renewals Due", value: kpis.renewalsDue || 0, icon: Calendar, format: "number" }
      ],
      commissions: [
        { label: "Total Commission", value: kpis.totalCommission || 0, icon: DollarSign, format: "currency" },
        { label: "Renewal Commission", value: kpis.renewalCommissions || 0, icon: TrendingUp, format: "currency" },
        { label: "Avg Commission Rate", value: kpis.avgCommissionRate || 0, icon: Activity, format: "percentage" },
        { label: "Total Policies", value: kpis.totalPolicies || 0, icon: FileText, format: "number" }
      ],
      payouts: [
        { label: "Total Payouts", value: kpis.totalPayouts || 0, icon: DollarSign, format: "currency" },
        { label: "Pending Payouts", value: kpis.pendingPayouts || 0, icon: Calendar, format: "currency" },
        { label: "Avg Payout/Agent", value: kpis.avgPayoutPerAgent || 0, icon: Users, format: "currency" },
        { label: "Total Agents", value: kpis.totalAgents || 0, icon: Users, format: "number" }
      ],
      performance: [
        { label: "Active Agents", value: kpis.activeAgents || 0, icon: Users, format: "number" },
        { label: "Avg Commission", value: kpis.avgCommissionPerAgent || 0, icon: DollarSign, format: "currency" },
        { label: "Conversion Ratio", value: kpis.conversionRatio || 0, icon: TrendingUp, format: "percentage" },
        { label: "Top Performer", value: kpis.topPerformer || "N/A", icon: Activity, format: "text" }
      ],
      employees: [
        { label: "Total Employees", value: kpis.totalEmployees || 0, icon: Users, format: "number" },
        { label: "Active Employees", value: kpis.activeEmployees || 0, icon: Activity, format: "number" },
        { label: "Avg Business/Employee", value: kpis.avgBusinessPerEmployee || 0, icon: DollarSign, format: "currency" },
        { label: "Top Performer", value: kpis.topPerformer || "N/A", icon: TrendingUp, format: "text" }
      ],
      leads: [
        { label: "Total Leads", value: kpis.totalLeads || 0, icon: Users, format: "number" },
        { label: "Conversion Rate", value: kpis.conversionRate || 0, icon: TrendingUp, format: "percentage" },
        { label: "Converted Leads", value: kpis.convertedLeads || 0, icon: Activity, format: "number" },
        { label: "Lost Leads", value: kpis.lostLeads || 0, icon: FileText, format: "number" }
      ],
      renewals: [
        { label: "Renewals Due", value: kpis.renewalsDue || 0, icon: Calendar, format: "number" },
        { label: "Renewed Policies", value: kpis.renewedPolicies || 0, icon: Activity, format: "number" },
        { label: "Missed Renewals", value: kpis.missedRenewals || 0, icon: FileText, format: "number" },
        { label: "Renewal Rate", value: kpis.renewalRate || 0, icon: TrendingUp, format: "percentage" }
      ]
    };

    const currentKPIs = kpiConfigs[activeTab as keyof typeof kpiConfigs] || [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {currentKPIs.map((kpi) => {
          const IconComponent = kpi.icon;
          let formattedValue = kpi.value;
          
          if (kpi.format === "currency") {
            formattedValue = new Intl.NumberFormat('en-IN', { 
              style: 'currency', 
              currency: 'INR' 
            }).format(Number(kpi.value));
          } else if (kpi.format === "percentage") {
            formattedValue = `${Number(kpi.value).toFixed(2)}%`;
          } else if (kpi.format === "number") {
            formattedValue = Number(kpi.value).toLocaleString();
          }

          return (
            <Card key={kpi.label} className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
                  </div>
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Line of Business</Label>
            <Select value={filters.lineOfBusiness} onValueChange={(value) => handleFilterChange("lineOfBusiness", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select LOB" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Motor">Motor</SelectItem>
                <SelectItem value="Life">Life</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Lapsed">Lapsed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPoliciesTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Policy Number</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>Premium Amount</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Agent Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((policy, index) => (
          <TableRow key={index}>
            <TableCell>{policy.policy_number}</TableCell>
            <TableCell>{policy.product_name}</TableCell>
            <TableCell>₹{policy.premium_amount?.toLocaleString()}</TableCell>
            <TableCell>{policy.policy_start_date ? format(new Date(policy.policy_start_date), "dd/MM/yyyy") : "-"}</TableCell>
            <TableCell>{policy.policy_end_date ? format(new Date(policy.policy_end_date), "dd/MM/yyyy") : "-"}</TableCell>
            <TableCell>{policy.agent_name}</TableCell>
            <TableCell>
              <Badge variant={policy.status === "Active" ? "default" : "secondary"}>
                {policy.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCommissionsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Policy Number</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Premium</TableHead>
          <TableHead>Commission %</TableHead>
          <TableHead>Commission Amount</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((commission, index) => (
          <TableRow key={index}>
            <TableCell>{commission.policies?.policy_number}</TableCell>
            <TableCell>{commission.agents?.name}</TableCell>
            <TableCell>₹{commission.policies?.premium_amount?.toLocaleString()}</TableCell>
            <TableCell>{commission.commission_rate}%</TableCell>
            <TableCell>₹{commission.commission_amount?.toLocaleString()}</TableCell>
            <TableCell>{commission.commission_type}</TableCell>
            <TableCell>
              <Badge variant={commission.status === "Paid" ? "default" : "secondary"}>
                {commission.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderEmployeesTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Assigned Agents</TableHead>
          <TableHead>Policies Sold</TableHead>
          <TableHead>Premium Generated</TableHead>
          <TableHead>Joined On</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((employee, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.role}</TableCell>
            <TableCell>{employee.branches?.name || "-"}</TableCell>
            <TableCell>{employee.agents?.length || 0}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>₹0</TableCell>
            <TableCell>{employee.joining_date ? format(new Date(employee.joining_date), "dd/MM/yyyy") : "-"}</TableCell>
            <TableCell>
              <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                {employee.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderLeadsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead Name</TableHead>
          <TableHead>Contact Info</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Line of Business</TableHead>
          <TableHead>Assigned Employee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created On</TableHead>
          <TableHead>Converted On</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
            Leads module coming soon - requires leads table implementation
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  const renderRenewalsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Policy Number</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>Policyholder</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Renewal Status</TableHead>
          <TableHead>Renewal Premium</TableHead>
          <TableHead>Days Until Expiry</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((renewal, index) => {
          const expiryDate = new Date(renewal.policy_end_date);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{renewal.policy_number}</TableCell>
              <TableCell>{renewal.product_name}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>{format(expiryDate, "dd/MM/yyyy")}</TableCell>
              <TableCell>{renewal.agent_name}</TableCell>
              <TableCell>
                <Badge variant={daysUntilExpiry <= 30 ? "destructive" : "default"}>
                  {daysUntilExpiry <= 0 ? "Expired" : "Due"}
                </Badge>
              </TableCell>
              <TableCell>₹{renewal.premium_amount?.toLocaleString()}</TableCell>
              <TableCell>
                <span className={daysUntilExpiry <= 30 ? "text-destructive font-medium" : ""}>
                  {daysUntilExpiry} days
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business intelligence and performance reports
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-primary shadow-primary">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportReport("excel")}>
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportReport("csv")}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportReport("pdf")}>
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          {renderKPICards()}
          {renderFilters()}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Policies Report</CardTitle>
              <CardDescription>
                Comprehensive view of all policies with filtering options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderPoliciesTable()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          {renderKPICards()}
          
          <Card className="shadow-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Commission Reports
                <Button 
                  onClick={() => navigate('/admin/reports/commissions/received')}
                  className="bg-gradient-primary"
                >
                  View Detailed Reports
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardTitle>
              <CardDescription>
                Access comprehensive commission tracking with advanced filtering and export options
              </CardDescription>
            </CardHeader>
          </Card>
          
          {renderFilters()}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Commissions Report</CardTitle>
              <CardDescription>
                Detailed commission tracking and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderCommissionsTable()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          {renderKPICards()}
          {renderFilters()}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Payouts Report</CardTitle>
              <CardDescription>
                Agent payout tracking and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Payouts functionality coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {renderKPICards()}
          {renderFilters()}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Agent Performance Report</CardTitle>
              <CardDescription>
                Individual agent performance metrics and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance analysis coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          {renderKPICards()}
          {renderFilters()}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Employees Report</CardTitle>
              <CardDescription>
                Employee performance and business metrics analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderEmployeesTable()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {renderKPICards()}
          {renderFilters()}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Leads Report</CardTitle>
              <CardDescription>
                Lead tracking, conversion analysis and pipeline management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderLeadsTable()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-6">
          {renderKPICards()}
          {renderFilters()}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Renewals Report</CardTitle>
              <CardDescription>
                Policy renewal tracking and expiry management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderRenewalsTable()
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;