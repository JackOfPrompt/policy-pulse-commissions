import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, RefreshCw, DollarSign, TrendingUp, Users } from "lucide-react";
import { useRevenueTable } from "@/hooks/useRevenueTable";

// Simple currency formatter function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function RevenueTableReport() {
  const { 
    data, 
    loading, 
    error, 
    syncRevenueTable, 
    exportToCSV, 
    totals 
  } = useRevenueTable();

  const getSourceBadgeVariant = (sourceType: string) => {
    switch (sourceType) {
      case 'employee': return 'default';
      case 'agent': return 'secondary';
      case 'misp': return 'outline';
      default: return 'destructive';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'calculated': return 'default';
      case 'paid': return 'secondary';
      case 'pending': return 'outline';
      default: return 'destructive';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading revenue data: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalPremium)}</div>
            <p className="text-xs text-muted-foreground">
              Across {totals.count} policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insurer Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalInsurer)}</div>
            <p className="text-xs text-muted-foreground">
              Avg Rate: {totals.avgBaseRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">External Commissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalAgent + totals.totalMisp)}
            </div>
            <p className="text-xs text-muted-foreground">
              Agents & MISPs combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internal Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalEmployee + totals.totalBroker)}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees & Broker Share
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Revenue Table - Live Commission Calculations
            <div className="flex space-x-2">
              <Button 
                onClick={exportToCSV} 
                variant="outline" 
                size="sm"
                disabled={data.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                onClick={syncRevenueTable} 
                variant="default" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync Data
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && data.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading revenue data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No revenue data available. Click "Sync Data" to populate.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Source Name</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                    <TableHead className="text-right">Base %</TableHead>
                    <TableHead className="text-right">Reward %</TableHead>
                    <TableHead className="text-right">Insurer Comm.</TableHead>
                    <TableHead className="text-right">Agent Comm.</TableHead>
                    <TableHead className="text-right">Employee Comm.</TableHead>
                    <TableHead className="text-right">Broker Share</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{record.policy_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(record.calc_date).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.customer_name}</TableCell>
                      <TableCell>{record.product_type}</TableCell>
                      <TableCell>{record.provider || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getSourceBadgeVariant(record.source_type)}>
                          {record.source_type || 'Direct'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {record.employee_name || record.agent_name || record.misp_name || '-'}
                          </div>
                          {record.reporting_employee_name && (
                            <div className="text-xs text-muted-foreground">
                              Reports to: {record.reporting_employee_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(record.premium)}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.base_rate?.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {record.reward_rate?.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(record.insurer_commission)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(record.agent_commission)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(record.employee_commission)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(record.broker_share)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.commission_status)}>
                          {record.commission_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals Summary */}
          {data.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Premium</div>
                  <div className="font-semibold">{formatCurrency(totals.totalPremium)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Insurer Commission</div>
                  <div className="font-semibold">{formatCurrency(totals.totalInsurer)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Agent Commission</div>
                  <div className="font-semibold">{formatCurrency(totals.totalAgent)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Broker Share</div>
                  <div className="font-semibold">{formatCurrency(totals.totalBroker)}</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}