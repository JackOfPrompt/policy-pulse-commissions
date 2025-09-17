import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  Download, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building,
  Calculator,
  Search
} from "lucide-react";
import { usePolicyCommissionDistribution, CommissionFilters } from "@/hooks/usePolicyCommissionDistribution";
import { useCommissionReportFilters } from "@/hooks/useCommissionReportFilters";

export function PolicyCommissionDistribution() {
  const [filters, setFilters] = useState<CommissionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const { filterOptions } = useCommissionReportFilters();

  const { 
    data, 
    loading, 
    error, 
    totals, 
    calculatePolicyCommissions, 
    exportToCSV 
  } = usePolicyCommissionDistribution({
    ...filters,
    search: searchTerm
  });

  const handleFilterChange = (key: keyof CommissionFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'calculated':
        return <Badge variant="default">Calculated</Badge>;
      case 'grid_mismatch':
        return <Badge variant="destructive">Grid Mismatch</Badge>;
      case 'config_missing':
        return <Badge variant="secondary">Config Missing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (sourceType: string, sourceName: string) => {
    const color = sourceType === 'employee' ? 'default' : 
                  sourceType === 'agent' ? 'secondary' : 
                  sourceType === 'misp' ? 'outline' : 'destructive';
    
    return <Badge variant={color}>{sourceName}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Policy-wise Commission Distribution</h2>
          <p className="text-muted-foreground">
            Comprehensive commission calculations using payout grids and agent tiers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={calculatePolicyCommissions} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
          <Button onClick={exportToCSV} disabled={data.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

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
                placeholder="Search policy number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            <Select onValueChange={(value) => handleFilterChange('provider', value === 'all' ? '' : value)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">All Providers</SelectItem>
                {filterOptions.providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalPolicies.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalPremium.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurer Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalInsurerCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Commission</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalAgentCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Commission</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalEmployeeCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broker Share</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalBrokerShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Distribution Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policy-wise Commission Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Calculating commissions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error: {error}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No commission data available. Click Recalculate to generate data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                    <TableHead className="text-center">Base %</TableHead>
                    <TableHead className="text-center">Reward %</TableHead>
                    <TableHead className="text-center">Bonus %</TableHead>
                    <TableHead className="text-center">Total %</TableHead>
                    <TableHead className="text-right">Insurer Comm.</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Agent Comm.</TableHead>
                    <TableHead className="text-right">Employee Comm.</TableHead>
                    <TableHead className="text-right">MISP Comm.</TableHead>
                    <TableHead className="text-right">Broker Share</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.policy_id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{record.policy_number}</TableCell>
                      <TableCell>{record.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.product_type}</Badge>
                      </TableCell>
                      <TableCell>{record.provider}</TableCell>
                      <TableCell className="text-right">₹{record.premium_amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-center">{record.base_commission_rate.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">{record.reward_rate.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">{record.bonus_rate.toFixed(1)}%</TableCell>
                      <TableCell className="text-center font-semibold">{record.total_rate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-semibold">₹{record.insurer_commission.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {getSourceBadge(record.source_type, record.source_name)}
                        {record.tier_name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Tier: {record.tier_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">₹{record.agent_commission.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{record.employee_commission.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{record.misp_commission.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{record.broker_share.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{getCommissionStatusBadge(record.commission_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}