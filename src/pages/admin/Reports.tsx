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
  const [activeTab, setActiveTab] = useState("overview");
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
        case "overview":
          await fetchOverviewData();
          break;
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

  const fetchOverviewData = async () => {
    // Fetch overview KPIs from policies data
    const { data: policies } = await supabase
      .from("policies_with_details")
      .select("*");

    const totalPolicies = policies?.length || 0;
    const totalPremium = policies?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0;
    const commissionRate = 5.0;
    const totalCommissions = (totalPremium * commissionRate) / 100;
    const totalPayouts = totalCommissions; // Assuming full payout

    setKpis({
      totalPolicies,
      totalPremium,
      totalCommissions,
      totalPayouts
    });
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
    try {
      // Get commissions with proper joins to policies_new and agents
      const { data: commissions } = await supabase
        .from("commissions")
        .select(`
          *,
          agents!inner(name, agent_code),
          policies_new!inner(policy_number, premium_amount, line_of_business)
        `);

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
    } catch (error) {
      console.error("Error fetching commissions:", error);
      setData([]);
      setKpis({ totalCommission: 0, renewalCommissions: 0, avgCommissionRate: 0, totalPolicies: 0 });
    }
  };

  const fetchPayoutsReport = async () => {
    try {
      // Get payout transactions with related data
      const { data: payouts } = await supabase
        .from("payout_transactions")
        .select(`
          *,
          agents(name, agent_code, branches(name)),
          policies_new(policy_number, premium_amount, line_of_business)
        `)
        .order('payout_date', { ascending: false });

      setData(payouts || []);

      const totalPayouts = payouts?.reduce((sum, p) => sum + (p.payout_amount || 0), 0) || 0;
      const pendingPayouts = payouts?.filter(p => p.payout_status === "Pending")
        .reduce((sum, p) => sum + (p.payout_amount || 0), 0) || 0;
      const totalAgents = new Set(payouts?.map(p => p.agent_id)).size;

      setKpis({
        totalPayouts,
        pendingPayouts,
        avgPayoutPerAgent: totalAgents > 0 ? totalPayouts / totalAgents : 0,
        totalAgents
      });
    } catch (error) {
      console.error("Error fetching payouts:", error);
      setData([]);
      setKpis({ totalPayouts: 0, pendingPayouts: 0, avgPayoutPerAgent: 0, totalAgents: 0 });
    }
  };

  const fetchAgentPerformanceReport = async () => {
    try {
      // Get agents with their policies and commissions
      const { data: agents } = await supabase
        .from("agents")
        .select(`
          *,
          branches(name),
          agent_tiers(name, level)
        `);

      // Get policies for each agent
      const { data: policies } = await supabase
        .from("policies_new")
        .select(`
          agent_id,
          premium_amount,
          policy_start_date,
          line_of_business
        `);

      // Get commissions for each agent
      const { data: commissions } = await supabase
        .from("commissions")
        .select(`
          agent_id,
          commission_amount,
          commission_type
        `);

      // Calculate performance metrics for each agent
      const agentsWithMetrics = agents?.map(agent => {
        const agentPolicies = policies?.filter(p => p.agent_id === agent.id) || [];
        const agentCommissions = commissions?.filter(c => c.agent_id === agent.id) || [];
        
        const totalPolicies = agentPolicies.length;
        const totalPremium = agentPolicies.reduce((sum, p) => sum + (p.premium_amount || 0), 0);
        const totalCommission = agentCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const renewalCommissions = agentCommissions.filter(c => c.commission_type === "Renewal").length;

        return {
          ...agent,
          totalPolicies,
          totalPremium,
          totalCommission,
          renewalCommissions,
          avgPolicyValue: totalPolicies > 0 ? totalPremium / totalPolicies : 0
        };
      }) || [];

      setData(agentsWithMetrics);

      const activeAgents = agentsWithMetrics.filter(a => a.status === "Active").length;
      const avgCommissionPerAgent = agentsWithMetrics.length > 0 
        ? agentsWithMetrics.reduce((sum, a) => sum + a.totalCommission, 0) / agentsWithMetrics.length 
        : 0;
      const topPerformer = agentsWithMetrics.length > 0 
        ? agentsWithMetrics.sort((a, b) => b.totalCommission - a.totalCommission)[0]?.name || "N/A"
        : "N/A";

      setKpis({
        activeAgents,
        avgCommissionPerAgent,
        conversionRatio: 85, // This would need lead data to calculate properly
        topPerformer
      });
    } catch (error) {
      console.error("Error fetching agent performance:", error);
      setData([]);
      setKpis({ activeAgents: 0, avgCommissionPerAgent: 0, conversionRatio: 0, topPerformer: "N/A" });
    }
  };

  const fetchEmployeesReport = async () => {
    try {
      let query = supabase
        .from("employees")
        .select(`
          *,
          branches(name)
        `);

      if (filters.branch) query = query.eq("branch_id", filters.branch);
      if (filters.status) query = query.eq("status", filters.status);

      const { data: employees } = await query;

      // Get agents managed by each employee
      const { data: agents } = await supabase
        .from("agents")
        .select(`
          id,
          referred_by_employee_id,
          status
        `);

      // Get policies created by employees
      const { data: policies } = await supabase
        .from("policies_new")
        .select(`
          employee_id,
          premium_amount,
          created_at
        `);

      // Calculate employee performance metrics
      const employeesWithMetrics = employees?.map(employee => {
        const managedAgents = agents?.filter(a => a.referred_by_employee_id === employee.id) || [];
        const employeePolicies = policies?.filter(p => p.employee_id === employee.id) || [];
        
        const totalAgentsManaged = managedAgents.length;
        const activeAgentsManaged = managedAgents.filter(a => a.status === "Active").length;
        const totalPolicies = employeePolicies.length;
        const totalBusiness = employeePolicies.reduce((sum, p) => sum + (p.premium_amount || 0), 0);

        return {
          ...employee,
          totalAgentsManaged,
          activeAgentsManaged,
          totalPolicies,
          totalBusiness,
          managedAgents
        };
      }) || [];

      setData(employeesWithMetrics);

      const totalEmployees = employeesWithMetrics.length;
      const activeEmployees = employeesWithMetrics.filter(e => e.status === "Active").length;
      const avgBusinessPerEmployee = totalEmployees > 0 
        ? employeesWithMetrics.reduce((sum, e) => sum + e.totalBusiness, 0) / totalEmployees 
        : 0;
      const topPerformer = employeesWithMetrics.length > 0 
        ? employeesWithMetrics.sort((a, b) => b.totalBusiness - a.totalBusiness)[0]?.name || "N/A"
        : "N/A";

      setKpis({
        totalEmployees,
        activeEmployees,
        avgBusinessPerEmployee,
        topPerformer
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      setData([]);
      setKpis({ totalEmployees: 0, activeEmployees: 0, avgBusinessPerEmployee: 0, topPerformer: "N/A" });
    }
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
    try {
      // Get renewals from policy_renewals table
      const { data: renewals } = await supabase
        .from("policy_renewals")
        .select(`
          *,
          policies_new!policy_id(
            policy_number,
            premium_amount,
            line_of_business,
            product_id,
            insurer_id
          ),
          agents(name, agent_code),
          employees(name),
          branches(name)
        `)
        .order('renewal_due_date', { ascending: true });

      // Filter by line of business if specified
      let filteredRenewals = renewals || [];
      if (filters.lineOfBusiness) {
        filteredRenewals = filteredRenewals.filter(r => 
          r.policies_new?.line_of_business === filters.lineOfBusiness
        );
      }

      setData(filteredRenewals);

      const renewalsDue = filteredRenewals.length;
      const renewedPolicies = filteredRenewals.filter(r => r.renewal_status === "Renewed").length;
      const pendingRenewals = filteredRenewals.filter(r => r.renewal_status === "Pending").length;
      const missedRenewals = filteredRenewals.filter(r => r.renewal_status === "Missed").length;

      setKpis({
        renewalsDue,
        renewedPolicies,
        missedRenewals,
        renewalRate: renewalsDue > 0 ? (renewedPolicies / renewalsDue) * 100 : 0,
        pendingRenewals
      });
    } catch (error) {
      console.error("Error fetching renewals:", error);
      setData([]);
      setKpis({ renewalsDue: 0, renewedPolicies: 0, missedRenewals: 0, renewalRate: 0, pendingRenewals: 0 });
    }
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
      overview: [
        { label: "Total Policies", value: kpis.totalPolicies || 0, icon: FileText, format: "number" },
        { label: "Total Premium", value: kpis.totalPremium || 0, icon: DollarSign, format: "currency" },
        { label: "Total Commissions", value: kpis.totalCommissions || 0, icon: TrendingUp, format: "currency" },
        { label: "Total Payouts", value: kpis.totalPayouts || 0, icon: Users, format: "currency" }
      ],
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
        { label: "Pending Renewals", value: kpis.pendingRenewals || 0, icon: FileText, format: "number" },
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
            <TableCell>{policy.policy_start_date && !isNaN(new Date(policy.policy_start_date).getTime()) ? format(new Date(policy.policy_start_date), "dd/MM/yyyy") : "-"}</TableCell>
            <TableCell>{policy.policy_end_date && !isNaN(new Date(policy.policy_end_date).getTime()) ? format(new Date(policy.policy_end_date), "dd/MM/yyyy") : "-"}</TableCell>
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
            <TableCell>{commission.policies_new?.policy_number || "-"}</TableCell>
            <TableCell>{commission.agents?.name || "-"}</TableCell>
            <TableCell>₹{commission.policies_new?.premium_amount?.toLocaleString() || "0"}</TableCell>
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
          <TableHead>Managed Agents</TableHead>
          <TableHead>Policies Sold</TableHead>
          <TableHead>Business Generated</TableHead>
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
            <TableCell>
              <div className="text-sm">
                <div>{employee.totalAgentsManaged || 0} Total</div>
                <div className="text-muted-foreground">{employee.activeAgentsManaged || 0} Active</div>
              </div>
            </TableCell>
            <TableCell>{employee.totalPolicies || 0}</TableCell>
            <TableCell>₹{(employee.totalBusiness || 0).toLocaleString()}</TableCell>
            <TableCell>{employee.joining_date && !isNaN(new Date(employee.joining_date).getTime()) ? format(new Date(employee.joining_date), "dd/MM/yyyy") : "-"}</TableCell>
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
          <TableHead>Customer</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Renewal Status</TableHead>
          <TableHead>Premium Amount</TableHead>
          <TableHead>Days Until Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((renewal, index) => {
          const dueDate = new Date(renewal.renewal_due_date);
          const today = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{renewal.policies_new?.policy_number || "-"}</TableCell>
              <TableCell>{renewal.customer_name || "-"}</TableCell>
              <TableCell>{renewal.original_expiry_date && !isNaN(new Date(renewal.original_expiry_date).getTime()) ? format(new Date(renewal.original_expiry_date), "dd/MM/yyyy") : "-"}</TableCell>
              <TableCell>{renewal.agents?.name || "-"}</TableCell>
              <TableCell>{renewal.employees?.name || "-"}</TableCell>
              <TableCell>{renewal.branches?.name || "-"}</TableCell>
              <TableCell>
                <Badge variant={
                  renewal.renewal_status === "Renewed" ? "default" : 
                  renewal.renewal_status === "Missed" ? "destructive" : 
                  "secondary"
                }>
                  {renewal.renewal_status}
                </Badge>
              </TableCell>
              <TableCell>₹{renewal.policies_new?.premium_amount?.toLocaleString() || "0"}</TableCell>
              <TableCell>
                <span className={daysUntilDue <= 7 ? "text-destructive font-medium" : 
                                daysUntilDue <= 30 ? "text-yellow-600 font-medium" : ""}>
                  {daysUntilDue <= 0 ? "Overdue" : `${daysUntilDue} days`}
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
      <div className="flex justify-between items-center">
        <div></div>
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderKPICards()}
          
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-card border-primary/20 hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => navigate('/admin/reports/transactions')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Transaction Reports
                  <ArrowRight className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>
                  Unified view of all commission and payout transactions with advanced filtering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commissions & Payouts</span>
                  <Badge className="bg-gradient-primary">New</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-primary/20 hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => navigate('/admin/reports/commissions/received')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Commission Reports
                  <ArrowRight className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>
                  Detailed commission tracking with export options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission Analysis</span>
                  <Badge variant="secondary">Detailed</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-primary/20 hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => navigate('/admin/reports/payouts')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payout Reports
                  <ArrowRight className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>
                  Agent payout tracking and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payout Management</span>
                  <Badge variant="secondary">Tracking</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Reports Overview</CardTitle>
              <CardDescription>
                Your business intelligence hub - access all reports and analytics from one place
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Welcome to Reports Center</p>
                <p className="text-muted-foreground">
                  Select a specific report type from the tabs above or use the quick action cards to access detailed reports
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Payout Amount</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((payout, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{payout.payout_id}</TableCell>
                        <TableCell>{payout.agents?.name || "-"}</TableCell>
                        <TableCell>{payout.agents?.branches?.name || "-"}</TableCell>
                        <TableCell>{payout.policies_new?.policy_number || "-"}</TableCell>
                        <TableCell>₹{payout.payout_amount?.toLocaleString()}</TableCell>
                        <TableCell>{payout.payment_mode}</TableCell>
                        <TableCell>
                          <Badge variant={
                            payout.payout_status === "Paid" ? "default" : 
                            payout.payout_status === "Pending" ? "secondary" : 
                            "destructive"
                          }>
                            {payout.payout_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payout.payout_date && !isNaN(new Date(payout.payout_date).getTime()) ? format(new Date(payout.payout_date), "dd/MM/yyyy") : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Agent Code</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Policies Sold</TableHead>
                      <TableHead>Total Premium</TableHead>
                      <TableHead>Total Commission</TableHead>
                      <TableHead>Avg Policy Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((agent, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agent.agent_code}</TableCell>
                        <TableCell>{agent.branches?.name || "-"}</TableCell>
                        <TableCell>{agent.agent_tiers?.name || "-"}</TableCell>
                        <TableCell>{agent.totalPolicies || 0}</TableCell>
                        <TableCell>₹{(agent.totalPremium || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{(agent.totalCommission || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{(agent.avgPolicyValue || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={agent.status === "Active" ? "default" : "secondary"}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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