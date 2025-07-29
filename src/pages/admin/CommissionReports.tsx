import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Download, Filter, Calendar, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FilterState {
  startDate: string;
  endDate: string;
  lineOfBusiness: string;
  insuranceProvider: string;
  createdBy: string;
  branch: string;
  policyType: string;
  status: string;
}

interface CommissionRecord {
  policy_number: string;
  insurer_name: string;
  product_name: string;
  line_of_business: string;
  premium_amount: number;
  commission_amount: number;
  commission_date: string;
  created_by_type: string;
  issuer_name: string;
  branch_name: string;
  status: string;
  commission_rate: number;
}

const CommissionReports = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    lineOfBusiness: "",
    insuranceProvider: "",
    createdBy: "",
    branch: "",
    policyType: "",
    status: ""
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommissionRecord[]>([]);
  const [kpis, setKpis] = useState({
    totalCommission: 0,
    totalPolicies: 0,
    avgCommissionRate: 0,
    paidCommissions: 0
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
    fetchCommissionData();
  }, []);

  useEffect(() => {
    fetchCommissionData();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      // Fetch branches
      const { data: branchData } = await supabase
        .from('branches')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      setBranches(branchData || []);

      // Fetch insurers
      const { data: insurerData } = await supabase
        .from('insurance_providers')
        .select('id, provider_name')
        .eq('status', 'Active')
        .order('provider_name');
      setInsurers(insurerData || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchCommissionData = async () => {
    setLoading(true);
    try {
      // First, try to get commission data from the view which joins all data
      let query = supabase
        .from('policies_with_details')
        .select('*');

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data: policies, error } = await query;

      if (error) throw error;

      // Transform policy data to commission records with calculated commissions
      const transformedData: CommissionRecord[] = (policies || []).map((policy: any) => {
        // Calculate commission (using 5% as default rate)
        const commissionRate = 5.0;
        const commissionAmount = (policy.premium_amount * commissionRate) / 100;
        
        return {
          policy_number: policy.policy_number,
          insurer_name: policy.insurer_name || '',
          product_name: policy.product_name || '',
          line_of_business: policy.line_of_business,
          premium_amount: policy.premium_amount,
          commission_amount: commissionAmount,
          commission_date: policy.created_at,
          created_by_type: policy.created_by_type || 'Employee',
          issuer_name: policy.created_by_type === 'Agent' 
            ? policy.agent_name || ''
            : policy.employee_name || '',
          branch_name: policy.branch_name || '',
          status: 'Pending', // Default status since no commission records exist
          commission_rate: commissionRate
        };
      });

      // Apply client-side filters
      let filteredData = transformedData;
      
      if (filters.lineOfBusiness) {
        filteredData = filteredData.filter(record => 
          record.line_of_business === filters.lineOfBusiness
        );
      }
      if (filters.insuranceProvider) {
        filteredData = filteredData.filter(record => 
          record.insurer_name.toLowerCase().includes(filters.insuranceProvider.toLowerCase())
        );
      }
      if (filters.createdBy) {
        filteredData = filteredData.filter(record => 
          record.created_by_type === filters.createdBy
        );
      }
      if (filters.branch) {
        filteredData = filteredData.filter(record => 
          record.branch_name.toLowerCase().includes(filters.branch.toLowerCase())
        );
      }
      if (filters.status && filters.status !== '') {
        filteredData = filteredData.filter(record => 
          record.status === filters.status
        );
      }

      setData(filteredData);

      // Calculate KPIs
      const totalCommission = filteredData.reduce((sum, record) => sum + record.commission_amount, 0);
      const totalPolicies = filteredData.length;
      const paidCommissions = filteredData
        .filter(record => record.status === 'Paid')
        .reduce((sum, record) => sum + record.commission_amount, 0);
      const avgCommissionRate = totalPolicies > 0 
        ? filteredData.reduce((sum, record) => sum + record.commission_rate, 0) / totalPolicies 
        : 0;

      setKpis({
        totalCommission,
        totalPolicies,
        avgCommissionRate,
        paidCommissions
      });

    } catch (error: any) {
      console.error('Error fetching commission data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = () => {
    // Create CSV content
    const headers = [
      'Policy Number',
      'Insurer Name',
      'Product Name',
      'Line of Business',
      'Premium Amount',
      'Commission Amount',
      'Commission Rate',
      'Commission Date',
      'Created By Type',
      'Issuer Name',
      'Branch',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        record.policy_number,
        record.insurer_name,
        record.product_name,
        record.line_of_business,
        record.premium_amount,
        record.commission_amount,
        `${record.commission_rate}%`,
        format(new Date(record.commission_date), 'dd/MM/yyyy'),
        record.created_by_type,
        record.issuer_name,
        record.branch_name,
        record.status
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const kpiCards = [
    {
      label: "Total Commission",
      value: `₹${kpis.totalCommission.toLocaleString()}`,
      icon: DollarSign,
      description: "Total commission earned"
    },
    {
      label: "Paid Commission",
      value: `₹${kpis.paidCommissions.toLocaleString()}`,
      icon: TrendingUp,
      description: "Commission already paid"
    },
    {
      label: "Total Policies",
      value: kpis.totalPolicies.toString(),
      icon: Users,
      description: "Policies with commission"
    },
    {
      label: "Avg Commission Rate",
      value: `${kpis.avgCommissionRate.toFixed(2)}%`,
      icon: Calendar,
      description: "Average commission percentage"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commission Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track commission received from insurance providers
          </p>
        </div>
        <Button onClick={exportReport} className="bg-gradient-primary">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const IconComponent = kpi.icon;
          return (
            <Card key={kpi.label} className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  </div>
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter commission reports by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <SelectValue placeholder="All LOB" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Lines</SelectItem>
                  <SelectItem value="Motor">Motor</SelectItem>
                  <SelectItem value="Life">Life</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Created By</Label>
              <Select value={filters.createdBy} onValueChange={(value) => handleFilterChange("createdBy", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Creators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Insurance Provider</Label>
              <Input
                placeholder="Search provider..."
                value={filters.insuranceProvider}
                onChange={(e) => handleFilterChange("insuranceProvider", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <Input
                placeholder="Search branch..."
                value={filters.branch}
                onChange={(e) => handleFilterChange("branch", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Details</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `Showing ${data.length} commission records`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Number</TableHead>
                <TableHead>Insurer Name</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Line of Business</TableHead>
                <TableHead>Premium Amount</TableHead>
                <TableHead>Commission Amount</TableHead>
                <TableHead>Commission Date</TableHead>
                <TableHead>Created By Type</TableHead>
                <TableHead>Issuer Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{record.policy_number}</TableCell>
                  <TableCell>{record.insurer_name}</TableCell>
                  <TableCell>{record.product_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.line_of_business}</Badge>
                  </TableCell>
                  <TableCell>₹{record.premium_amount?.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">₹{record.commission_amount?.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(record.commission_date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={record.created_by_type === "Agent" ? "default" : "secondary"}
                      className={record.created_by_type === "Agent" ? "bg-gradient-primary text-primary-foreground" : "bg-gradient-accent text-accent-foreground"}
                    >
                      {record.created_by_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.issuer_name}</TableCell>
                  <TableCell>{record.branch_name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={record.status === "Paid" ? "default" : record.status === "Pending" ? "secondary" : "destructive"}
                      className={record.status === "Paid" ? "bg-gradient-success" : ""}
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {data.length === 0 && !loading && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No commission records found</p>
              <p className="text-muted-foreground">
                Try adjusting your filters or check if there are policies with commissions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionReports;