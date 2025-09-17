import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Eye, RefreshCw, Calculator } from "lucide-react";
import { useEnhancedCommissionReportWithDetails, PolicyCommissionDetail } from "@/hooks/useEnhancedCommissionReportWithDetails";
import { useCommissionCalculationWithProviders } from "@/hooks/useCommissionCalculationWithProviders";

export function EnhancedPolicyCommissionReport() {
  const { reportData, loading, error, generateReport } = useEnhancedCommissionReportWithDetails();
  const { 
    generateCommissionReport, 
    syncCommissionData, 
    loading: calcLoading 
  } = useCommissionCalculationWithProviders();
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyCommissionDetail | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const getSourceBadgeVariant = (sourceType: string) => {
    switch (sourceType?.toLowerCase()) {
      case 'agent':
      case 'misp':
      case 'posp':
        return 'destructive' as const;
      case 'employee':
        return 'default' as const;
      case 'direct':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType?.toLowerCase()) {
      case 'agent':
      case 'misp':
      case 'posp':
        return 'External';
      case 'employee':
        return 'Internal';
      case 'direct':
        return 'Direct';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Enhanced Policy Commission Report
            <RefreshCw className="h-4 w-4 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading commission data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Policy Commission Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={generateReport} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Enhanced Policy Commission Report
          <div className="flex space-x-2">
            <Button onClick={generateReport} variant="outline" size="sm" disabled={loading || calcLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || calcLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={syncCommissionData} variant="outline" size="sm" disabled={loading || calcLoading}>
              <Calculator className={`h-4 w-4 mr-2 ${(loading || calcLoading) ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reportData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No commission data available. Policies may not have matching commission grids.
          </p>
        ) : (
          <div className="overflow-x-auto">
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
                  <TableHead>Business Source</TableHead>
                  <TableHead>Agent Comm.</TableHead>
                  <TableHead>MISP Comm.</TableHead>
                  <TableHead>Employee Comm.</TableHead>
                  <TableHead>Reporting Emp. Comm.</TableHead>
                  <TableHead>Broker Share</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((policy, index) => (
                  <TableRow key={`${policy.policy_id}-${index}`}>
                    <TableCell className="font-medium">{policy.policy_number}</TableCell>
                    <TableCell>{policy.customer_name}</TableCell>
                    <TableCell>{policy.product_type}</TableCell>
                    <TableCell>{policy.provider}</TableCell>
                    <TableCell>{formatCurrency(policy.premium_amount)}</TableCell>
                    <TableCell>{formatPercentage(policy.base_commission_rate)}</TableCell>
                    <TableCell>{formatPercentage(policy.reward_commission_rate)}</TableCell>
                    <TableCell>{formatPercentage(policy.bonus_commission_rate)}</TableCell>
                    <TableCell className="font-medium">{formatPercentage(policy.total_commission_rate)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(policy.insurer_commission)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={getSourceBadgeVariant(policy.source_type)}>
                          {getSourceLabel(policy.source_type)}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {policy.source_type === 'employee' 
                            ? `${policy.source_name}` 
                            : policy.source_type === 'agent' 
                              ? `${policy.source_name}`
                              : policy.source_type === 'misp'
                                ? `${policy.source_name}`
                                : policy.source_type === 'posp'
                                  ? `${policy.source_name}`
                                  : policy.source_type === 'direct'
                                    ? 'Direct Policy'
                                    : policy.source_name
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(policy.agent_commission)}</TableCell>
                    <TableCell>{formatCurrency(policy.misp_commission)}</TableCell>
                    <TableCell>{formatCurrency(policy.employee_commission)}</TableCell>
                    <TableCell>{formatCurrency(policy.reporting_employee_commission)}</TableCell>
                    <TableCell>{formatCurrency(policy.broker_share)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPolicy(policy)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Policy Commission Details</DialogTitle>
                          </DialogHeader>
                          {selectedPolicy && (
                            <div className="space-y-6">
                              {/* Policy Information */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3">Policy Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                                    <p className="text-base">{selectedPolicy.policy_number}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                                    <p className="text-base">{selectedPolicy.customer_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Product</p>
                                    <p className="text-base">{selectedPolicy.product_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                                    <p className="text-base">{selectedPolicy.provider}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Premium Amount</p>
                                    <p className="text-base font-medium">{formatCurrency(selectedPolicy.premium_amount)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Business Source</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={getSourceBadgeVariant(selectedPolicy.source_type)}>
                                        {getSourceLabel(selectedPolicy.source_type)}
                                      </Badge>
                                       <span className="text-sm">
                                         {selectedPolicy.source_type === 'employee' 
                                           ? `${selectedPolicy.source_name}` 
                                           : selectedPolicy.source_type === 'agent' 
                                             ? `${selectedPolicy.source_name}`
                                             : selectedPolicy.source_type === 'misp'
                                               ? `${selectedPolicy.source_name}`
                                               : selectedPolicy.source_type === 'posp'
                                                 ? `${selectedPolicy.source_name}`
                                                 : selectedPolicy.source_type === 'direct'
                                                   ? 'Direct Policy'
                                                   : selectedPolicy.source_name
                                         }
                                       </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Commission Rates */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3">Commission Rates</h3>
                                <div className="grid grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Base Commission</p>
                                    <p className="text-base">{formatPercentage(selectedPolicy.base_commission_rate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Reward Commission</p>
                                    <p className="text-base">{formatPercentage(selectedPolicy.reward_commission_rate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Bonus Commission</p>
                                    <p className="text-base">{formatPercentage(selectedPolicy.bonus_commission_rate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                                    <p className="text-base font-medium">{formatPercentage(selectedPolicy.total_commission_rate)}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Commission Distribution */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3">Commission Distribution</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Insurer Commission</p>
                                    <p className="text-lg font-bold text-primary">{formatCurrency(selectedPolicy.insurer_commission)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Agent Commission</p>
                                    <p className="text-base">{formatCurrency(selectedPolicy.agent_commission)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">MISP Commission</p>
                                    <p className="text-base">{formatCurrency(selectedPolicy.misp_commission)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Employee Commission</p>
                                    <p className="text-base">{formatCurrency(selectedPolicy.employee_commission)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Reporting Employee Commission</p>
                                    <p className="text-base">{formatCurrency(selectedPolicy.reporting_employee_commission)}</p>
                                    {selectedPolicy.reporting_employee_name && (
                                      <p className="text-xs text-muted-foreground">{selectedPolicy.reporting_employee_name}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Broker Share</p>
                                    <p className="text-base">{formatCurrency(selectedPolicy.broker_share)}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Commission Status */}
                              <div className="bg-muted p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Commission Status</p>
                                    <p className="text-base capitalize">{selectedPolicy.commission_status}</p>
                                  </div>
                                  <Badge variant="outline">{selectedPolicy.commission_status}</Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}