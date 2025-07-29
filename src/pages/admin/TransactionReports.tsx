import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DollarSign, Download, Filter, Calendar, TrendingUp, Users, CreditCard, Clock } from "lucide-react";
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
  status: string;
}

interface TransactionRecord {
  id: string;
  type: 'Commission' | 'Payout';
  policy_number: string;
  insurer_name: string;
  product_name: string;
  line_of_business: string;
  premium_amount: number;
  transaction_amount: number;
  transaction_date: string;
  created_by_type: string;
  issuer_name: string;
  branch_name: string;
  status: string;
  rate: number;
  payout_id?: string;
  agent_code?: string;
  payment_mode?: string;
}

const TransactionReports = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    lineOfBusiness: "",
    insuranceProvider: "",
    createdBy: "",
    branch: "",
    status: ""
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TransactionRecord[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [kpis, setKpis] = useState({
    totalCommissions: 0,
    totalPayouts: 0,
    totalTransactions: 0,
    pendingAmount: 0,
    totalPolicies: 0,
    avgCommissionRate: 0
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
    fetchTransactionData();
  }, []);

  useEffect(() => {
    fetchTransactionData();
  }, [filters, activeTab]);

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

  const fetchTransactionData = async () => {
    setLoading(true);
    try {
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

      // Transform policies to transaction records (both commission and payout)
      const transformedData: TransactionRecord[] = [];
      
      (policies || []).forEach((policy: any, index: number) => {
        const commissionRate = 5.0;
        const commissionAmount = (policy.premium_amount * commissionRate) / 100;
        
        // Add commission record
        const commissionRecord: TransactionRecord = {
          id: `comm-${policy.id}`,
          type: 'Commission',
          policy_number: policy.policy_number,
          insurer_name: policy.insurer_name || '',
          product_name: policy.product_name || '',
          line_of_business: policy.line_of_business,
          premium_amount: policy.premium_amount,
          transaction_amount: commissionAmount,
          transaction_date: policy.created_at,
          created_by_type: policy.created_by_type || 'Employee',
          issuer_name: policy.created_by_type === 'Agent' 
            ? policy.agent_name || ''
            : policy.employee_name || '',
          branch_name: policy.branch_name || '',
          status: 'Pending',
          rate: commissionRate
        };

        // Add payout record if there's an agent
        if (policy.agent_id) {
          const payoutRecord: TransactionRecord = {
            id: `payout-${policy.id}`,
            type: 'Payout',
            policy_number: policy.policy_number,
            insurer_name: policy.insurer_name || '',
            product_name: policy.product_name || '',
            line_of_business: policy.line_of_business,
            premium_amount: policy.premium_amount,
            transaction_amount: commissionAmount,
            transaction_date: policy.created_at,
            created_by_type: policy.created_by_type || 'Agent',
            issuer_name: policy.agent_name || '',
            branch_name: policy.branch_name || '',
            status: 'Pending',
            rate: commissionRate,
            payout_id: `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(index + 1).padStart(6, '0')}`,
            agent_code: `AG${String(index + 1).padStart(4, '0')}`,
            payment_mode: 'Bank Transfer'
          };
          transformedData.push(payoutRecord);
        }

        transformedData.push(commissionRecord);
      });

      // Apply client-side filters
      let filteredData = transformedData;
      
      if (activeTab !== "all") {
        filteredData = filteredData.filter(record => 
          record.type.toLowerCase() === activeTab
        );
      }
      
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
      if (filters.status) {
        filteredData = filteredData.filter(record => 
          record.status === filters.status
        );
      }

      setData(filteredData);

      // Calculate KPIs
      const commissions = transformedData.filter(r => r.type === 'Commission');
      const payouts = transformedData.filter(r => r.type === 'Payout');
      
      const totalCommissions = commissions.reduce((sum, record) => sum + record.transaction_amount, 0);
      const totalPayouts = payouts.reduce((sum, record) => sum + record.transaction_amount, 0);
      const pendingAmount = filteredData
        .filter(record => record.status === 'Pending')
        .reduce((sum, record) => sum + record.transaction_amount, 0);
      const totalPolicies = new Set(transformedData.map(r => r.policy_number)).size;
      const avgCommissionRate = commissions.length > 0 
        ? commissions.reduce((sum, record) => sum + record.rate, 0) / commissions.length 
        : 0;

      setKpis({
        totalCommissions,
        totalPayouts,
        totalTransactions: totalCommissions + totalPayouts,
        pendingAmount,
        totalPolicies,
        avgCommissionRate
      });

    } catch (error: any) {
      console.error('Error fetching transaction data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction data",
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
    const headers = [
      'Type',
      'Policy Number',
      'Insurer Name',
      'Product Name',
      'Line of Business',
      'Premium Amount',
      'Transaction Amount',
      'Rate',
      'Transaction Date',
      'Created By Type',
      'Issuer Name',
      'Branch',
      'Status',
      'Payout ID',
      'Agent Code',
      'Payment Mode'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        record.type,
        record.policy_number,
        record.insurer_name,
        record.product_name,
        record.line_of_business,
        record.premium_amount,
        record.transaction_amount,
        `${record.rate}%`,
        format(new Date(record.transaction_date), 'dd/MM/yyyy'),
        record.created_by_type,
        record.issuer_name,
        record.branch_name,
        record.status,
        record.payout_id || '',
        record.agent_code || '',
        record.payment_mode || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const kpiCards = [
    {
      label: "Total Commissions",
      value: `₹${kpis.totalCommissions.toLocaleString()}`,
      icon: DollarSign,
      description: "Total commission earned"
    },
    {
      label: "Total Payouts",
      value: `₹${kpis.totalPayouts.toLocaleString()}`,
      icon: CreditCard,
      description: "Total payouts processed"
    },
    {
      label: "Pending Amount",
      value: `₹${kpis.pendingAmount.toLocaleString()}`,
      icon: Clock,
      description: "Pending transactions"
    },
    {
      label: "Total Policies",
      value: kpis.totalPolicies.toString(),
      icon: Users,
      description: "Policies with transactions"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variant = status === "Paid" ? "default" : status === "Pending" ? "secondary" : "destructive";
    const className = status === "Paid" ? "bg-gradient-success" : "";
    return <Badge variant={variant} className={className}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const className = type === "Commission" ? "bg-gradient-primary" : "bg-gradient-accent";
    return <Badge className={className}>{type}</Badge>;
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
              <BreadcrumbLink href="/admin/reports">Reports</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Transaction Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transaction Reports</h1>
            <p className="text-muted-foreground mt-1">
              Unified view of all commission and payout transactions
            </p>
          </div>
          <Button onClick={exportReport} className="bg-gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
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
          <CardDescription>Filter transaction reports by various criteria</CardDescription>
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
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
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

      {/* Transaction Data with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `Showing ${data.length} transaction records`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="commission">Commissions</TabsTrigger>
              <TabsTrigger value="payout">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Insurer Name</TableHead>
                    <TableHead>Line of Business</TableHead>
                    <TableHead>Premium Amount</TableHead>
                    <TableHead>Transaction Amount</TableHead>
                    <TableHead>Transaction Date</TableHead>
                    <TableHead>Issuer Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    {activeTab === "payout" && <TableHead>Payout ID</TableHead>}
                    {activeTab === "payout" && <TableHead>Payment Mode</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{getTypeBadge(record.type)}</TableCell>
                      <TableCell className="font-medium">{record.policy_number}</TableCell>
                      <TableCell>{record.insurer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.line_of_business}</Badge>
                      </TableCell>
                      <TableCell>₹{record.premium_amount?.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">₹{record.transaction_amount?.toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(record.transaction_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{record.issuer_name}</TableCell>
                      <TableCell>{record.branch_name}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      {activeTab === "payout" && <TableCell>{record.payout_id}</TableCell>}
                      {activeTab === "payout" && <TableCell>{record.payment_mode}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {data.length === 0 && !loading && (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No transaction records found</p>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or check if there are policies with transactions
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionReports;