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
import { useEnhancedCommissionReport } from "@/hooks/useEnhancedCommissionReport";
import { useDetailedCommissionReport } from "@/hooks/useDetailedCommissionReport";
import { useCommissionTierCalculation } from "@/hooks/useCommissionTierCalculation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function PolicyCommissionReport() {
  const { toast } = useToast();
  const { syncAllCommissions, loading: syncLoading } = useCommissionTierCalculation();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    product_type: '',
    commission_status: '',
    search: '',
    date_from: '',
    date_to: '',
    provider: '',
  });

  const { data, loading: reportLoading, totals, refetch, exportToCSV } = useDetailedCommissionReport(filters);

  // Auto-load data on component mount
  useEffect(() => {
    refetch();
  }, []);

  const handleRecalculate = async () => {
    try {
      await syncAllCommissions();
      await refetch();
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
    totalAgentCommission: 0,
    totalMispCommission: 0,
    totalEmployeeCommission: 0,
    totalBrokerShare: 0,
    totalPremium: 0,
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select onValueChange={(value) => setFilters({...filters, product_type: value === 'all' ? '' : value})}>
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

          <Select onValueChange={(value) => setFilters({...filters, commission_status: value === 'all' ? '' : value})}>
            <SelectTrigger>
              <SelectValue placeholder="Commission Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="calculated">Calculated</SelectItem>
              <SelectItem value="grid_mismatch">Grid Mismatch</SelectItem>
              <SelectItem value="config_missing">Config Missing</SelectItem>
              <SelectItem value="adjusted">Adjusted</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
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
            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insurer Commission</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{displayTotals.totalCommission.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">₹{displayTotals.totalAgentCommission.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MISP Commission</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{displayTotals.totalMispCommission.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broker Share</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{displayTotals.totalBrokerShare.toLocaleString()}</div>
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
                  <TableHead>Gross Premium</TableHead>
                  <TableHead>Total Rate (%)</TableHead>
                  <TableHead>Base Rate (%)</TableHead>
                  <TableHead>Reward Rate (%)</TableHead>
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
              {reportLoading ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center">No commission data found</TableCell>
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
                    <TableCell>₹{record.premium_amount?.toLocaleString() || '0'}</TableCell>
                    <TableCell>{record.commission_rate?.toFixed(2) || '0.00'}%</TableCell>
                    <TableCell>{record.commission_rate?.toFixed(2) || '0.00'}%</TableCell>
                    <TableCell>0.00%</TableCell>
                    <TableCell>₹{record.total_amount?.toLocaleString() || '0'}</TableCell>
                    <TableCell>₹{record.agent_commission?.toLocaleString() || '0'}</TableCell>
                    <TableCell>₹{record.misp_commission?.toLocaleString() || '0'}</TableCell>
                    <TableCell>₹{record.employee_commission?.toLocaleString() || '0'}</TableCell>
                    <TableCell>₹{record.broker_share?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {record.commission_status || 'Calculated'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.source_name || 'Direct'}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.source_type || 'direct'}
                          {record.tier_name && (
                            <span className="ml-1 text-primary">({record.tier_name})</span>
                          )}
                          {record.override_used && (
                            <span className="ml-1 text-orange-600">(Override)</span>
                          )}
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