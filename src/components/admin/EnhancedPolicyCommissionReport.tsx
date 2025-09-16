import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Download, 
  RefreshCw, 
  Calculator, 
  TrendingUp, 
  DollarSign,
  Users,
  Building,
  Eye,
  Filter
} from "lucide-react";
import { useEnhancedCommissionReportWithDetails, PolicyCommissionDetail } from "@/hooks/useEnhancedCommissionReportWithDetails";
import { useToast } from "@/hooks/use-toast";

interface PolicyDetail {
  policy_id: string;
  policy_number: string;
  product_category: string;
  product_name: string;
  plan_name: string;
  provider: string;
  source_type: string;
  agent_name?: string;
  employee_name?: string;
  misp_name?: string;
  base_commission_rate: number;
  reward_commission_rate: number;
  bonus_commission_rate: number;
  total_commission_rate: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  reporting_employee_commission: number;
  broker_share: number;
  grid_id: string;
  grid_table: string;
  calc_date: string;
}

export function EnhancedPolicyCommissionReport() {
  const { toast } = useToast();
  const { 
    data, 
    loading, 
    error, 
    generateReport, 
    syncCommissions, 
    getCommissionSummary 
  } = useEnhancedCommissionReportWithDetails();

  const [filters, setFilters] = useState({
    product_type: '',
    provider: '',
    source_type: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  const [activeTab, setActiveTab] = useState('summary');
const [selectedPolicy, setSelectedPolicy] = useState<PolicyCommissionDetail | null>(null);

  useEffect(() => {
    generateReport();
  }, []);

  const handleSyncCommissions = async () => {
    const success = await syncCommissions();
    if (success) {
      await generateReport();
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        'Policy Number',
        'Customer Name',
        'Product Type',
        'Provider',
        'Premium Amount',
        'Source Type',
        'Base Rate (%)',
        'Reward Rate (%)',
        'Bonus Rate (%)',
        'Total Rate (%)',
        'Insurer Commission',
        'Agent Commission',
        'MISP Commission',
        'Employee Commission',
        'Reporting Employee Comm.',
        'Broker Share',
        'Grid Table',
        'Calculation Date'
      ].join(','),
      ...filteredData.map(policy => [
        `"${policy.policy_number}"`,
        `"${policy.customer_name}"`,
        `"${policy.product_category}"`,
        `"${policy.provider}"`,
        policy.premium_amount.toFixed(2),
        `"${policy.source_type || 'Direct'}"`,
        policy.base_commission_rate.toFixed(2),
        policy.reward_commission_rate.toFixed(2),
        policy.bonus_commission_rate.toFixed(2),
        policy.total_commission_rate.toFixed(2),
        policy.insurer_commission.toFixed(2),
        policy.agent_commission.toFixed(2),
        policy.misp_commission.toFixed(2),
        policy.employee_commission.toFixed(2),
        policy.reporting_employee_commission.toFixed(2),
        policy.broker_share.toFixed(2),
        `"${policy.grid_table}"`,
        `"${new Date(policy.calc_date).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Commission report has been exported successfully",
    });
  };

  const filteredData = data.filter(policy => {
    const matchesProduct = !filters.product_type || policy.product_category.toLowerCase().includes(filters.product_type.toLowerCase());
    const matchesProvider = !filters.provider || policy.provider.toLowerCase().includes(filters.provider.toLowerCase());
    const matchesSource = !filters.source_type || policy.source_type === filters.source_type;
    const matchesSearch = !filters.search || 
      policy.policy_number.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesProduct && matchesProvider && matchesSource && matchesSearch;
  });

  const summary = getCommissionSummary();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Commission Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive policy-wise commission analysis with detailed breakdowns
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleSyncCommissions} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
          <Button 
            onClick={handleExportReport} 
            variant="outline"
            disabled={loading || filteredData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary Dashboard</TabsTrigger>
          <TabsTrigger value="detailed">Policy Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          {/* Summary Cards */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Calculating commissions...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No commission data available. This could be due to:
              </p>
              <ul className="text-sm text-muted-foreground mb-4 text-left max-w-md mx-auto">
                <li>• No active policies found</li>
                <li>• No matching commission grids configured</li>
                <li>• Commission grids not covering premium ranges</li>
                <li>• Product types not matching grid configurations</li>
              </ul>
              <div className="space-x-2">
                <Button 
                  onClick={handleSyncCommissions} 
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Calculate All Commissions
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => generateReport()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.totalPolicies || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active commission calculations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Insurer Commission</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(summary?.totalInsurer || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Gross commission from insurers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">External Payouts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{((summary?.totalAgent || 0) + (summary?.totalMisp || 0)).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Agent + MISP commissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Broker Retention</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(summary?.totalBroker || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Net broker share
                </p>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Commission Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Agent Commissions</span>
                    <span className="font-medium">₹{(summary?.totalAgent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MISP Commissions</span>
                    <span className="font-medium">₹{(summary?.totalMisp || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Employee Commissions</span>
                    <span className="font-medium">₹{(summary?.totalEmployee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reporting Employee</span>
                    <span className="font-medium">₹{(summary?.totalReportingEmployee || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Broker Share</span>
                      <span>₹{(summary?.totalBroker || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredData.slice(0, 5).map((policy, index) => (
                    <div key={policy.policy_id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">{policy.policy_number}</div>
                        <div className="text-xs text-muted-foreground">{policy.provider}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">₹{policy.insurer_commission.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{policy.total_commission_rate.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select onValueChange={(value) => setFilters({...filters, product_type: value === 'all' ? '' : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Product Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="motor">Motor</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => setFilters({...filters, provider: value === 'all' ? '' : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="HDFC Life">HDFC Life</SelectItem>
                    <SelectItem value="ICICI Lombard">ICICI Lombard</SelectItem>
                    <SelectItem value="Bajaj Allianz">Bajaj Allianz</SelectItem>
                    <SelectItem value="Star Health">Star Health</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => setFilters({...filters, source_type: value === 'all' ? '' : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="misp">MISP</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                />

                <Input
                  placeholder="Search policies..."
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Policy-wise Commission Details ({filteredData.length} policies)</CardTitle>
            </CardHeader>
            <CardContent>
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Base %</TableHead>
                    <TableHead>Reward %</TableHead>
                    <TableHead>Bonus %</TableHead>
                    <TableHead>Total %</TableHead>
                    <TableHead>Insurer Comm.</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Agent Comm.</TableHead>
                    <TableHead>MISP Comm.</TableHead>
                    <TableHead>Employee Comm.</TableHead>
                    <TableHead>Reporting Emp. Comm.</TableHead>
                    <TableHead>Broker Share</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={17} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={17} className="text-center">No commission data found</TableCell>
                      </TableRow>
                   ) : (
                       filteredData.map((policy) => (
                       <TableRow key={policy.policy_id}>
                         <TableCell className="font-medium">{policy.policy_number}</TableCell>
                         <TableCell>{policy.customer_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{policy.product_category}</Badge>
                        </TableCell>
                        <TableCell>{policy.provider}</TableCell>
                        <TableCell>₹{policy.premium_amount.toLocaleString()}</TableCell>
                        <TableCell>{policy.base_commission_rate.toFixed(2)}%</TableCell>
                        <TableCell>{policy.reward_commission_rate.toFixed(2)}%</TableCell>
                        <TableCell>{policy.bonus_commission_rate.toFixed(2)}%</TableCell>
                        <TableCell className="font-medium">{policy.total_commission_rate.toFixed(2)}%</TableCell>
                        <TableCell className="font-medium">₹{policy.insurer_commission.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            policy.source_type === 'agent' ? 'default' : 
                            policy.source_type === 'employee' ? 'secondary' : 
                            policy.source_type === 'misp' ? 'destructive' :
                            policy.source_type === 'posp' ? 'outline' :
                            'outline'
                          }>
                            {policy.source_type === 'agent' ? 'External (Agent)' :
                             policy.source_type === 'employee' ? 'Internal (Employee)' :
                             policy.source_type === 'misp' ? 'External (MISP)' :
                             policy.source_type === 'posp' ? 'External (POSP)' :
                             'Direct'}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{policy.agent_commission.toLocaleString()}</TableCell>
                        <TableCell>₹{policy.misp_commission.toLocaleString()}</TableCell>
                        <TableCell>₹{policy.employee_commission.toLocaleString()}</TableCell>
                        <TableCell>₹{policy.reporting_employee_commission.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{policy.broker_share.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPolicy(policy)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Product Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Life', 'Health', 'Motor'].map(product => {
                    const productData = filteredData.filter(p => p.product_category === product);
                    const totalCommission = productData.reduce((sum, p) => sum + p.insurer_commission, 0);
                    const avgRate = productData.length > 0 ? 
                      productData.reduce((sum, p) => sum + p.total_commission_rate, 0) / productData.length : 0;
                    
                    return (
                      <div key={product} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{product}</div>
                          <div className="text-sm text-muted-foreground">{productData.length} policies</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{totalCommission.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Avg: {avgRate.toFixed(2)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission by Source Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['agent', 'misp', 'employee', 'direct'].map(source => {
                    const sourceData = filteredData.filter(p => p.source_type === source);
                    const totalCommission = sourceData.reduce((sum, p) => sum + p.insurer_commission, 0);
                    
                    return (
                      <div key={source} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium capitalize">{source}</div>
                          <div className="text-sm text-muted-foreground">{sourceData.length} policies</div>
                        </div>
                        <div className="font-medium">₹{totalCommission.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Policy Detail Modal would go here */}
      {selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Policy Commission Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setSelectedPolicy(null)}
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {selectedPolicy.policy_number}</div>
                <div><strong>Product Name:</strong> {selectedPolicy.product_name}</div>
                <div><strong>Product:</strong> {selectedPolicy.product_category}</div>
                <div><strong>Provider:</strong> {selectedPolicy.provider}</div>
                <div><strong>Plan Name:</strong> {selectedPolicy.plan_name}</div>
                <div><strong>Source Type:</strong> {selectedPolicy.source_type}</div>
                <div><strong>Base Rate:</strong> {selectedPolicy.base_commission_rate.toFixed(2)}%</div>
                <div><strong>Reward Rate:</strong> {selectedPolicy.reward_commission_rate.toFixed(2)}%</div>
                <div><strong>Bonus Rate:</strong> {selectedPolicy.bonus_commission_rate.toFixed(2)}%</div>
                <div><strong>Total Rate:</strong> {selectedPolicy.total_commission_rate.toFixed(2)}%</div>
                <div><strong>Insurer Commission:</strong> ₹{selectedPolicy.insurer_commission.toLocaleString()}</div>
                <div><strong>Agent Commission:</strong> ₹{selectedPolicy.agent_commission.toLocaleString()}</div>
                <div><strong>MISP Commission:</strong> ₹{selectedPolicy.misp_commission.toLocaleString()}</div>
                <div><strong>Employee Commission:</strong> ₹{selectedPolicy.employee_commission.toLocaleString()}</div>
                <div><strong>Reporting Employee Commission:</strong> ₹{selectedPolicy.reporting_employee_commission.toLocaleString()}</div>
                <div><strong>Broker Share:</strong> ₹{selectedPolicy.broker_share.toLocaleString()}</div>
                <div><strong>Grid Table:</strong> {selectedPolicy.grid_table}</div>
                <div><strong>Calculation Date:</strong> {new Date(selectedPolicy.calc_date).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}