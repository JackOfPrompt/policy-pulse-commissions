import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Download, Filter, BarChart3, PieChart, TrendingUp, Eye, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PolicyStatusBadge from "@/components/admin/PolicyStatusBadge";
import { PolicyStatusHistory } from "@/components/admin/PolicyStatusHistory";

const PolicyReports = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [reportType, setReportType] = useState("all");
  const [dateRange, setDateRange] = useState("");
  const [statusUpdateDateRange, setStatusUpdateDateRange] = useState("");
  const [selectedLOB, setSelectedLOB] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<any>({});
  const [selectedPolicyForHistory, setSelectedPolicyForHistory] = useState<string>("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
    fetchBranches();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, reportType, dateRange, statusUpdateDateRange, selectedLOB, selectedProvider, selectedBranch]);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from("policies_with_details")
        .select(`
          *,
          sum_insured,
          status_updated_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
      calculateStatusCounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch policy reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("status", "Active")
        .order("name");

      if (error) throw error;
      setBranches(data || []);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
    }
  };

  const calculateStatusCounts = (data: any[]) => {
    const counts = data.reduce((acc, policy) => {
      const status = policy.policy_status || policy.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    setStatusCounts(counts);
  };

  const filterPolicies = () => {
    let filtered = policies;

    // Filter by report type (status)
    if (reportType !== "all") {
      filtered = filtered.filter(policy => 
        (policy.policy_status || policy.status)?.toLowerCase() === reportType.toLowerCase()
      );
    }

    // Filter by date range
    if (dateRange && dateRange !== "all") {
      const today = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case "7days":
          startDate.setDate(today.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(today.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(today.getDate() - 90);
          break;
      }
      
      filtered = filtered.filter(policy => 
        new Date(policy.created_at) >= startDate
      );
    }

    // Filter by LOB
    if (selectedLOB && selectedLOB !== "all") {
      filtered = filtered.filter(policy => 
        policy.line_of_business === selectedLOB
      );
    }

    // Filter by Provider
    if (selectedProvider && selectedProvider !== "all") {
      filtered = filtered.filter(policy => 
        policy.insurer_name === selectedProvider
      );
    }

    // Filter by Branch
    if (selectedBranch && selectedBranch !== "all") {
      filtered = filtered.filter(policy => 
        policy.branch_id === selectedBranch
      );
    }

    // Filter by Status Update Date Range
    if (statusUpdateDateRange && statusUpdateDateRange !== "all") {
      const today = new Date();
      let startDate = new Date();
      
      switch (statusUpdateDateRange) {
        case "7days":
          startDate.setDate(today.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(today.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(today.getDate() - 90);
          break;
      }
      
      filtered = filtered.filter(policy => 
        policy.status_updated_at && new Date(policy.status_updated_at) >= startDate
      );
    }

    setFilteredPolicies(filtered);
    calculateStatusCounts(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      // Headers
      ["Policy Number", "Customer", "Provider", "Product", "LOB", "Status", "Premium", "Policy Value", "Agent/Employee", "Branch", "Last Updated", "Created Date"].join(","),
      // Data rows
      ...filteredPolicies.map(policy => [
        policy.policy_number,
        policy.customer_name || "N/A",
        policy.insurer_name,
        policy.product_name,
        policy.line_of_business,
        policy.policy_status || policy.status,
        policy.premium_amount,
        policy.sum_insured || policy.sum_assured || "N/A",
        policy.agent_name || policy.employee_name,
        policy.branch_name || "N/A",
        policy.status_updated_at ? new Date(policy.status_updated_at).toLocaleDateString() : "N/A",
        new Date(policy.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const reportTypes = [
    { value: "all", label: "All Policies with Status Breakdown" },
    { value: "underwriting", label: "Policies in Underwriting" },
    { value: "issued", label: "Issued Policies" },
    { value: "rejected", label: "Rejected Policies" },
    { value: "cancelled", label: "Cancelled Policies" },
    { value: "free look cancellation", label: "Free Look Cancellations" }
  ];

  const getTotalPremium = () => {
    return filteredPolicies.reduce((sum, policy) => sum + (policy.premium_amount || 0), 0);
  };

  const getTotalPolicyValue = () => {
    return filteredPolicies.reduce((sum, policy) => sum + (policy.sum_insured || policy.sum_assured || 0), 0);
  };

  const handleViewHistory = (policyId: string) => {
    setSelectedPolicyForHistory(policyId);
    setIsHistoryModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading policy reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Policy Status" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLOB} onValueChange={setSelectedLOB}>
              <SelectTrigger>
                <SelectValue placeholder="Line of Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LOB</SelectItem>
                <SelectItem value="Motor">Motor</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Life">Life</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Creation Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusUpdateDateRange} onValueChange={setStatusUpdateDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Status Updated" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {Array.from(new Set(policies.map(p => p.insurer_name).filter(Boolean))).map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredPolicies.length}</div>
            <p className="text-muted-foreground">Total Policies</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">₹{getTotalPremium().toLocaleString()}</div>
            <p className="text-muted-foreground">Total Premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">₹{getTotalPolicyValue().toLocaleString()}</div>
            <p className="text-muted-foreground">Total Policy Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusCounts["Issued"] || 0}</div>
            <p className="text-muted-foreground">Issued Policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusCounts["Underwriting"] || 0}</div>
            <p className="text-muted-foreground">In Underwriting</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Policy Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold">{count as number}</div>
                <PolicyStatusBadge status={status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policy Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Number</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>LOB</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Assigned Agent/Employee</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Last Updated At</TableHead>
                <TableHead>Status History</TableHead>
                <TableHead>Policy Value</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.policy_number}</TableCell>
                  <TableCell>{policy.product_name}</TableCell>
                  <TableCell>{policy.line_of_business}</TableCell>
                  <TableCell>{policy.customer_name || "N/A"}</TableCell>
                  <TableCell>{policy.agent_name || policy.employee_name}</TableCell>
                  <TableCell>
                    <PolicyStatusBadge status={policy.policy_status || policy.status} />
                  </TableCell>
                  <TableCell>
                    {policy.status_updated_at 
                      ? new Date(policy.status_updated_at).toLocaleDateString() + " " + 
                        new Date(policy.status_updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(policy.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                  <TableCell>₹{(policy.sum_insured || policy.sum_assured || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View Policy
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPolicies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg font-medium">No policies found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Status History Modal */}
      <PolicyStatusHistory
        policyId={selectedPolicyForHistory}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};

export default PolicyReports;