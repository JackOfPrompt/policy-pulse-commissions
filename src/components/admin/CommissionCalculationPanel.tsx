import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calculator, RefreshCw, Download, AlertCircle } from "lucide-react";
import { useCommissionCalculation, CommissionCalculationResult } from "@/hooks/useCommissionCalculation";
import { useToast } from "@/hooks/use-toast";

export function CommissionCalculationPanel() {
  const [calculations, setCalculations] = useState<CommissionCalculationResult[]>([]);
  const { loading, calculateCommissions, syncCommissions } = useCommissionCalculation();
  const { toast } = useToast();

  useEffect(() => {
    handleCalculate();
  }, []);

  const handleCalculate = async () => {
    const results = await calculateCommissions();
    setCalculations(results);
  };

  const handleSync = async () => {
    const results = await syncCommissions();
    setCalculations(results);
  };

  const exportToCSV = () => {
    if (calculations.length === 0) return;

    const csvHeaders = [
      'Policy Number',
      'Customer',
      'Product Type',
      'Provider',
      'Premium Amount',
      'Source Type',
      'Source Name',
      'Commission Rate (%)',
      'Insurer Commission',
      'Agent Commission',
      'MISP Commission',
      'Employee Commission',
      'Broker Share',
      'Status',
      'Grid Table'
    ];

    const csvData = calculations.map(calc => [
      calc.policy_number,
      calc.customer_name,
      calc.product_type,
      calc.provider,
      calc.premium_amount,
      calc.source_type,
      calc.source_name,
      calc.commission_rate.toFixed(2),
      calc.insurer_commission.toFixed(2),
      calc.agent_commission.toFixed(2),
      calc.misp_commission.toFixed(2),
      calc.employee_commission.toFixed(2),
      calc.broker_share.toFixed(2),
      calc.commission_status,
      calc.grid_table
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commission-calculations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = calculations.reduce((acc, calc) => ({
    totalPremium: acc.totalPremium + calc.premium_amount,
    totalInsurer: acc.totalInsurer + calc.insurer_commission,
    totalAgent: acc.totalAgent + calc.agent_commission,
    totalMisp: acc.totalMisp + calc.misp_commission,
    totalEmployee: acc.totalEmployee + calc.employee_commission,
    totalBroker: acc.totalBroker + calc.broker_share,
    calculatedCount: acc.calculatedCount + (calc.commission_status === 'calculated' ? 1 : 0),
    noGridCount: acc.noGridCount + (calc.commission_status === 'no_grid_match' ? 1 : 0)
  }), {
    totalPremium: 0,
    totalInsurer: 0,
    totalAgent: 0,
    totalMisp: 0,
    totalEmployee: 0,
    totalBroker: 0,
    calculatedCount: 0,
    noGridCount: 0
  });

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Commission Calculations</h2>
          <p className="text-muted-foreground">
            Live calculation of commissions based on policies and commission grids
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCalculate} variant="outline" disabled={loading}>
            <Calculator className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Calculate
          </Button>
          <Button onClick={handleSync} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync to Database
          </Button>
          <Button onClick={exportToCSV} variant="outline" disabled={calculations.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalPremium.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {calculations.length} policies
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insurer Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalInsurer.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.calculatedCount} calculated, {totals.noGridCount} no grid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalEmployee.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Employee share
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broker Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalBroker.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Remaining after distribution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calculations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Base Rate %</TableHead>
                  <TableHead>Reward Rate %</TableHead>
                  <TableHead>Bonus Rate %</TableHead>
                  <TableHead>Insurer Commission</TableHead>
                  <TableHead>Agent/MISP Commission</TableHead>
                  <TableHead>Broker Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow key={calc.policy_id}>
                    <TableCell className="font-medium">
                      {calc.policy_number}
                    </TableCell>
                    <TableCell>{calc.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{calc.product_type}</Badge>
                    </TableCell>
                    <TableCell>{calc.provider}</TableCell>
                    <TableCell>₹{calc.premium_amount.toLocaleString()}</TableCell>
                    <TableCell>{calc.commission_rate.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(calc.reward_rate || 0).toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(calc.bonus_rate || 0).toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell>₹{calc.insurer_commission.toLocaleString()}</TableCell>
                    <TableCell>₹{(calc.agent_commission + calc.misp_commission + calc.employee_commission).toLocaleString()}</TableCell>
                    <TableCell>₹{calc.broker_share.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={calc.commission_status === 'calculated' ? 'default' : 'destructive'}
                      >
                        {calc.commission_status === 'calculated' ? 'Calculated' : 'No Grid Match'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {calc.grid_table || 'None'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {calculations.length === 0 && !loading && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No calculations available. Click Calculate to start.</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Calculating commissions...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}