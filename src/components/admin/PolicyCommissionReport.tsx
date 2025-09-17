import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Calculator } from "lucide-react";
import { useEnhancedPolicyCommissionReport, type EnhancedPolicyCommissionRecord } from "@/hooks/useEnhancedPolicyCommissionReport";
import { useCommissionTierCalculation } from "@/hooks/useCommissionTierCalculation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function PolicyCommissionReport() {
  const { toast } = useToast();
  const { syncAllCommissions, loading: syncLoading } = useCommissionTierCalculation();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    productType: '',
    sourceType: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    provider: '',
  });

  const { data, loading: reportLoading, totals, fetchPolicyCommissions, exportToCSV } = useEnhancedPolicyCommissionReport(filters);

  // Auto-load data on component mount
  useEffect(() => {
    fetchPolicyCommissions(1);
  }, []);

  const handleRecalculate = async () => {
    try {
      await syncAllCommissions();
      await fetchPolicyCommissions(1);
    } catch (err) {
      // Error handling is done in the hook
      console.error('Error syncing commissions:', err);
    }
  };

  const handleGenerateReport = () => {
    exportToCSV();
    toast({
      title: "Success",
      description: "Commission report exported successfully",
    });
  };

  // Use totals from hook or fallback to default values
  const displayTotals = totals || {
    totalCommission: 0,
    totalCommissionAmount: 0,
    totalRewardAmount: 0,
    totalPremium: 0,
    gridMatchedCount: 0,
    count: data?.length || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Policy-wise Commission Report</h2>
          <p className="text-muted-foreground">
            Detailed commission calculations based on commission grids and policy conditions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleRecalculate} 
            variant="outline"
            disabled={loading || syncLoading || reportLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || syncLoading || reportLoading) ? 'animate-spin' : ''}`} />
            Recalculate with Tiers
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            variant="outline"
            disabled={reportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Select onValueChange={(value) => setFilters({...filters, productType: value === 'all' ? '' : value})}>
            <SelectTrigger>
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="Life">Life</SelectItem>
              <SelectItem value="Health">Health</SelectItem>
              <SelectItem value="Motor">Motor</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, sourceType: value === 'all' ? '' : value})}>
            <SelectTrigger>
              <SelectValue placeholder="Source Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="misp">MISP</SelectItem>
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
              <SelectItem value="New India Assurance">New India Assurance</SelectItem>
              <SelectItem value="LIC">LIC</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="From Date"
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
          />

          <Input
            type="date"
            placeholder="To Date"
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
          />

          <Input
            placeholder="Search policies..."
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="w-full"
          />
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing commission data calculated from commission grids
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insurer Commission</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.reduce((sum, record) => sum + record.insurer_commission, 0)).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {displayTotals.count} policies
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Commission</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.reduce((sum, record) => sum + record.agent_commission, 0)).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MISP Commission</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.reduce((sum, record) => sum + record.misp_commission, 0)).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Commission</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.reduce((sum, record) => sum + record.employee_commission, 0)).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reporting Employee Commission</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.reduce((sum, record) => sum + record.reporting_employee_commission, 0)).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Remaining from external policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broker Share</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.reduce((sum, record) => sum + record.broker_share, 0)).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policy-wise Commission Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Gross Premium</TableHead>
                  <TableHead>Base Rate (%)</TableHead>
                  <TableHead>Reward Rate (%)</TableHead>
                  <TableHead>Bonus Rate (%)</TableHead>
                  <TableHead>Total Rate (%)</TableHead>
                  <TableHead>Insurer Commission</TableHead>
                  <TableHead>Agent Commission</TableHead>
                  <TableHead>MISP Commission</TableHead>
                  <TableHead>Employee Commission</TableHead>
                  <TableHead>Reporting Employee Commission</TableHead>
                  <TableHead>Broker Share</TableHead>
                  <TableHead>Grid Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {reportLoading ? (
                <TableRow>
                  <TableCell colSpan={18} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} className="text-center">No commission data found</TableCell>
                </TableRow>
              ) : (
                data.map((record) => (
                  <TableRow key={record.policy_id}>
                    <TableCell className="font-medium">{record.policy_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.product_type}</Badge>
                    </TableCell>
                    <TableCell>{record.provider || '-'}</TableCell>
                    <TableCell>{record.customer_name || '-'}</TableCell>
                    <TableCell>{record.plan_name || '-'}</TableCell>
                    <TableCell>₹{record.gross_premium?.toLocaleString() || '0'}</TableCell>
                    <TableCell>{record.base_rate?.toFixed(2) || '0.00'}%</TableCell>
                    <TableCell>{record.reward_rate?.toFixed(2) || '0.00'}%</TableCell>
                    <TableCell>{record.bonus_rate?.toFixed(2) || '0.00'}%</TableCell>
                    <TableCell>{record.total_rate?.toFixed(2) || '0.00'}%</TableCell>
                    <TableCell>₹{record.insurer_commission?.toLocaleString() || '0'}</TableCell>
                    <TableCell>₹{record.agent_commission?.toLocaleString() || '0'}</TableCell>
                    <TableCell>₹{record.misp_commission?.toLocaleString() || '0'}</TableCell>
                    <TableCell>₹{record.employee_commission?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <div>
                        <div>₹{record.reporting_employee_commission?.toLocaleString() || '0'}</div>
                        {record.reporting_employee_name && (
                          <div className="text-xs text-muted-foreground">
                            {record.reporting_employee_name}
                            {record.reporting_employee_code && ` (${record.reporting_employee_code})`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>₹{record.broker_share?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <Badge variant={record.grid_matched ? "default" : "destructive"}>
                        {record.grid_matched ? 'Matched' : 'No Match'}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {record.grid_source || 'No grid'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.source_name || 'Direct'}
                          {record.source_code && (
                            <span className="ml-1 text-muted-foreground">({record.source_code})</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.source_type === 'employee' ? 'Employee (Internal)' : 
                           record.source_type === 'agent' ? 'Agent (External)' : 
                           record.source_type === 'misp' ? 'MISP (External)' :
                           record.source_type || 'Direct'}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}