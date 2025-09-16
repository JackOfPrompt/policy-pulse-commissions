import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolicyCommissionFiltersComponent } from '@/components/reports/PolicyCommissionFilters';
import { PolicyCommissionTable } from '@/components/reports/PolicyCommissionTable';
import { PolicyCommissionReport } from '@/components/admin/PolicyCommissionReport';
import { usePolicyCommissionReport } from '@/hooks/usePolicyCommissionReport';
import { useReportsData } from '@/hooks/useReportsData';
import { useCommissionReport } from '@/hooks/useCommissionReport';
import { useEnhancedCommissionReport } from '@/hooks/useEnhancedCommissionReport';
import { useCommissionGrids } from '@/hooks/useCommissionGrids';
import { useProductTypes } from '@/hooks/useProductTypes';
import { Button } from "@/components/ui/button";
import { CommissionGridModal } from "@/components/admin/CommissionGridModal";
import { Download, FileSpreadsheet, TrendingUp, Users, DollarSign, Calculator, Plus, Edit2, Trash2, RefreshCcw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Reports = () => {
  const [selectedRange, setSelectedRange] = useState<{ start?: string; end?: string }>({});
  const [filters, setFilters] = useState({});
  const [commissionFilters, setCommissionFilters] = useState({});
  const [gridFilters, setGridFilters] = useState({});
  const [gridModalOpen, setGridModalOpen] = useState(false);
  const [editingGrid, setEditingGrid] = useState<any>(null);
  const [recalcLoading, setRecalcLoading] = useState(false);

  const { data: reportData, loading: reportLoading } = useReportsData();
  const { data: commissionData, loading: commissionLoading, exportToCSV, totals, fetchPolicyCommissions } = usePolicyCommissionReport(filters);
  const { data: newCommissionData, loading: newCommissionLoading, exportToCSV: exportCommissionCSV, totals: commissionTotals, fetchCommissionReport } = useCommissionReport(commissionFilters);
  const enhancedReportResult = useEnhancedCommissionReport();
  const enhancedReportData = enhancedReportResult.enhancedReportData || [];
  const enhancedLoading = enhancedReportResult.loading;
  const exportEnhancedCSV = () => {};
  const enhancedTotals = {
    totalInsurer: 0,
    totalAgent: 0,
    totalMisp: 0,
    totalEmployee: 0,
    totalBroker: 0
  };
  const refetchEnhanced = () => {};
  const { data: grids, loading: gridsLoading, createCommissionGrid, updateCommissionGrid, deleteCommissionGrid } = useCommissionGrids(gridFilters);
  const { data: productTypes } = useProductTypes();

  // Auto-refresh data on component mount
  React.useEffect(() => {
    fetchCommissionReport();
    refetchEnhanced();
  }, []);

  const handleCreateGrid = async (data: any) => {
    const success = await createCommissionGrid(data);
    if (success) {
      // Refresh commission data after grid creation
      fetchCommissionReport();
    }
    return success;
  };

  const handleUpdateGrid = async (data: any) => {
    if (editingGrid) {
      const success = await updateCommissionGrid(editingGrid.id, data);
      if (success) {
        // Refresh commission data after grid update
        fetchCommissionReport();
      }
      return success;
    }
    return false;
  };

  const handleRecalculate = async () => {
    try {
      setRecalcLoading(true);
      await supabase.rpc('sync_comprehensive_commissions_updated');
      await fetchPolicyCommissions(1);
      await refetchEnhanced();
    } finally {
      setRecalcLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive reporting and commission management system
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRecalculate} variant="outline" disabled={recalcLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            {recalcLoading ? 'Recalculating...' : 'Recalculate'}
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="policy-commissions">Policy Commission Report</TabsTrigger>
            <TabsTrigger value="commissions">Commission Reports</TabsTrigger>
            <TabsTrigger value="commission-distribution">Commission Distribution</TabsTrigger>
            <TabsTrigger value="commission-grids">Commission Grids</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{reportData.totalPremium.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    From {reportData.totalPolicies} policies
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{reportData.totalCommissions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {reportData.avgCommissionRate.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.pendingPayouts}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting processing
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Policy Renewal Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.policyRenewalRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="policy-commissions" className="space-y-6">
            <PolicyCommissionReport />
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <PolicyCommissionFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onExport={exportToCSV}
              loading={commissionLoading}
            />
            
            <PolicyCommissionTable
              data={commissionData}
              loading={commissionLoading}
              totals={totals}
            />
          </TabsContent>

          <TabsContent value="commission-distribution" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Commission Distribution Report</h2>
                <p className="text-muted-foreground">
                  Detailed breakdown of commissions from insurer to agents, MISPs, employees, and broker share
                </p>
              </div>
              <Button onClick={exportEnhancedCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Enhanced CSV
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select onValueChange={(value) => setCommissionFilters({...commissionFilters, product_type: value === 'all' ? undefined : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Product Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="Life">Life</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Motor">Motor</SelectItem>
                      {productTypes?.map((productType) => (
                        <SelectItem key={productType.id} value={productType.name}>
                          {productType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select onValueChange={(value) => setCommissionFilters({...commissionFilters, commission_status: value === 'all' ? undefined : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Commission Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="calculated">Calculated</SelectItem>
                      <SelectItem value="adjusted">Adjusted</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    placeholder="From Date"
                    onChange={(e) => setCommissionFilters({...commissionFilters, date_from: e.target.value})}
                  />

                  <Input
                    type="date"
                    placeholder="To Date"
                    onChange={(e) => setCommissionFilters({...commissionFilters, date_to: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Insurer Commission</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{enhancedTotals.totalInsurer.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agent Commission</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{enhancedTotals.totalAgent.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">MISP Commission</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{enhancedTotals.totalMisp.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Employee Commission</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{enhancedTotals.totalEmployee.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Broker Share</CardTitle>
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{enhancedTotals.totalBroker.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Commission Distribution Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Product Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Insurer Commission</TableHead>
                      <TableHead>Agent Commission</TableHead>
                      <TableHead>MISP Commission</TableHead>
                      <TableHead>Employee Commission</TableHead>
                      <TableHead>Broker Share</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enhancedLoading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : enhancedReportData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center">No commission data found</TableCell>
                      </TableRow>
                    ) : (
                      enhancedReportData.map((record) => (
                        <TableRow key={record.policy_id}>
                          <TableCell className="font-medium">{record.policy_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.product_type}</Badge>
                          </TableCell>
                          <TableCell>{record.customer_name}</TableCell>
                          <TableCell>₹{record.premium_amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>₹{record.insurer_commission_amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>₹{record.agent_commission_amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>₹{record.misp_commission_amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>₹{record.employee_commission_amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>₹{record.broker_share_amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={record.commission_status === 'calculated' ? 'secondary' : 
                                     record.commission_status === 'paid' ? 'default' : 'outline'}
                            >
                              {record.commission_status}
                            </Badge>
                          </TableCell>
                           <TableCell>
                             {record.source_type === 'employee' 
                               ? `Internal (${record.source_name})` 
                               : record.source_type === 'agent' || record.source_type === 'misp'
                                 ? `External (${record.source_type === 'agent' ? 'POSP' : 'MISP'} - ${record.source_name})`
                                 : 'Direct Sale'}
                           </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission-grids" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Commission Grids Management</h2>
                <p className="text-muted-foreground">
                  Configure commission rates by product type and premium ranges
                </p>
              </div>
              <Button onClick={() => setGridModalOpen(true)} className="bg-gradient-primary hover:bg-gradient-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                Add Commission Grid
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select onValueChange={(value) => setGridFilters({...gridFilters, product_type: value === 'all' ? undefined : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Product Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="life">Life</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Filter by Product Subtype"
                    onChange={(e) => setGridFilters({...gridFilters, product_subtype: e.target.value})}
                  />

                  <Button 
                    variant="outline" 
                    onClick={() => setGridFilters({})}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission Grid Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Type</TableHead>
                      <TableHead>Product Subtype</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Min Premium</TableHead>
                      <TableHead>Max Premium</TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead>Effective To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gridsLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : grids.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">No commission grids configured</TableCell>
                      </TableRow>
                    ) : (
                      grids.map((grid) => (
                        <TableRow key={grid.id}>
                          <TableCell>
                            <Badge variant="outline">{grid.product_type}</Badge>
                          </TableCell>
                          <TableCell>{grid.product_subtype || '-'}</TableCell>
                          <TableCell>{grid.provider || '-'}</TableCell>
                          <TableCell>₹{grid.min_premium?.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell>₹{grid.max_premium?.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell>{grid.commission_rate}%</TableCell>
                          <TableCell>{new Date(grid.effective_from).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {grid.effective_to ? new Date(grid.effective_to).toLocaleDateString() : 'Open'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingGrid(grid);
                                    setGridModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Commission Grid</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this commission grid? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteCommissionGrid(grid.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CommissionGridModal
          open={gridModalOpen}
          onClose={() => {
            setGridModalOpen(false);
            setEditingGrid(null);
          }}
          onSubmit={editingGrid ? handleUpdateGrid : handleCreateGrid}
          grid={editingGrid}
          title={editingGrid ? 'Edit Commission Grid' : 'Create Commission Grid'}
        />
      </div>
    </div>
  );
};

export default Reports;
