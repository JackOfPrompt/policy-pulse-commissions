import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, TrendingUp, Users, Building, DollarSign, Search, RotateCcw } from "lucide-react";
import { useRevenueTable, RevenueFilters } from '@/hooks/useRevenueTable';
import { EnhancedPolicyCommissionReport } from '@/components/admin/EnhancedPolicyCommissionReport';
import { useCommissionReportFilters } from '@/hooks/useCommissionReportFilters';

export default function CommissionReports() {
  const [filters, setFilters] = useState<RevenueFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const { filterOptions } = useCommissionReportFilters();
  
  const { 
    revenueData, 
    loading, 
    error, 
    totals, 
    filters: currentFilters,
    fetchRevenueData, 
    applyFilters,
    syncRevenueTable, 
    exportToCSV 
  } = useRevenueTable();

  const handleFilterChange = (key: keyof RevenueFilters, value: string) => {
    const newFilters = {
      ...currentFilters,
      [key]: value || undefined
    };
    applyFilters(newFilters);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const newFilters = {
      ...currentFilters,
      search: term || undefined
    };
    applyFilters(newFilters);
  };

  const getSourceDisplay = (record: any) => {
    if (record.source_type === 'employee') {
      return `Internal (${record.employee_name || 'Employee'})`;
    } else if (record.source_type === 'agent') {
      return `External (${record.agent_name || 'Agent'})`;
    } else if (record.source_type === 'misp') {
      return `External (${record.misp_name || 'MISP'})`;
    }
    return 'Direct Sale';
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Commission Reports</h1>
              <p className="text-muted-foreground">
                View comprehensive commission calculations with detailed breakdowns
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={syncRevenueTable} disabled={loading} variant="outline">
                <RotateCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Sync All
              </Button>
              <Button onClick={fetchRevenueData} disabled={loading} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportToCSV} disabled={revenueData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="policy-wise" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="policy-wise">Policy-wise Commission Distribution</TabsTrigger>
            <TabsTrigger value="revenue-table">Revenue Table View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="policy-wise" className="space-y-6">
            <EnhancedPolicyCommissionReport />
          </TabsContent>
          
          <TabsContent value="revenue-table" className="space-y-6">
            {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policy number..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select onValueChange={(value) => handleFilterChange('product_type', value === 'all' ? '' : value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">All Products</SelectItem>
                  {filterOptions.productTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => handleFilterChange('source_type', value === 'all' ? '' : value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Source Type" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">All Sources</SelectItem>
                  {filterOptions.sourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'agent' ? 'Agent' : 
                       type === 'employee' ? 'Employee' : 
                       type === 'misp' ? 'MISP' : 
                       type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Date from"
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totals.totalPremium.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">
                From {totals.count} policies
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Insurer Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totals.totalInsurer.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">
                Total from grid
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agent Commission</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totals.totalAgent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">
                External agents
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employee Commission</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totals.totalEmployee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">
                Internal employees
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Broker Share</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totals.totalBroker.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">
                Company retained
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Live Commission Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error: {error || 'Unknown error'}
              </div>
            ) : revenueData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No commission data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Policy</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Provider</th>
                      <th className="text-right p-2">Premium</th>
                      <th className="text-center p-2">Base %</th>
                      <th className="text-center p-2">Reward %</th>
                      <th className="text-center p-2">Bonus %</th>
                      <th className="text-center p-2">Total %</th>
                      <th className="text-right p-2">Insurer Comm.</th>
                      <th className="text-left p-2">Source</th>
                      <th className="text-right p-2">Agent Comm.</th>
                      <th className="text-right p-2">Employee Comm.</th>
                      <th className="text-right p-2">Report. Emp. Comm.</th>
                      <th className="text-right p-2">Broker Share</th>
                    </tr>
                  </thead>
                  <tbody>
                     {revenueData.map((record, index) => (
                       <tr key={`${record.policy_id}-${record.id || index}`} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-sm">{record.policy_number}</td>
                        <td className="p-2">{record.customer_name || '-'}</td>
                        <td className="p-2 capitalize">{record.product_type}</td>
                        <td className="p-2">{record.provider}</td>
                        <td className="p-2 text-right">₹{record.premium?.toLocaleString('en-IN') || '0'}</td>
                        <td className="p-2 text-center">{record.base_rate?.toFixed(1) || '0'}%</td>
                        <td className="p-2 text-center">{record.reward_rate?.toFixed(1) || '0'}%</td>
                        <td className="p-2 text-center">{record.bonus_rate?.toFixed(1) || '0'}%</td>
                        <td className="p-2 text-center font-semibold">{record.total_rate?.toFixed(1) || '0'}%</td>
                        <td className="p-2 text-right font-semibold">₹{record.insurer_commission?.toLocaleString('en-IN') || '0'}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {getSourceDisplay(record)}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">₹{record.agent_commission?.toLocaleString('en-IN') || '0'}</td>
                        <td className="p-2 text-right">₹{record.employee_commission?.toLocaleString('en-IN') || '0'}</td>
                        <td className="p-2 text-right">₹{record.reporting_employee_commission?.toLocaleString('en-IN') || '0'}</td>
                        <td className="p-2 text-right">₹{record.broker_share?.toLocaleString('en-IN') || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}