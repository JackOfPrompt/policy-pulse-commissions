import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, TrendingUp, Users, FileText } from "lucide-react";
import { PolicyCommissionRecord } from "@/hooks/usePolicyCommissionReport";
import { useState } from "react";

interface PolicyCommissionTableProps {
  data: PolicyCommissionRecord[];
  loading: boolean;
  totals: {
    totalCommission: number;
    totalPremium: number;
    count: number;
  };
}

export function PolicyCommissionTable({ data, loading, totals }: PolicyCommissionTableProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyCommissionRecord | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success text-success-foreground';
      case 'bound': return 'bg-info text-info-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      case 'expired': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'processing': return 'bg-info text-info-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSourceIcon = (sourceType: string | null) => {
    switch (sourceType) {
      case 'agent': return <Users className="h-4 w-4" />;
      case 'employee': return <FileText className="h-4 w-4" />;
      case 'misp': return <TrendingUp className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalPremium.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {totals.count} policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.totalPremium > 0 ? ((totals.totalCommission / totals.totalPremium) * 100).toFixed(2) : 0}% of premium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Commission</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totals.count > 0 ? (totals.totalCommission / totals.count).toLocaleString() : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per policy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policy-wise Commission Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No policy commission data found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Gross Premium</TableHead>
                    <TableHead className="text-right">Commission Rate</TableHead>
                    <TableHead className="text-right">Commission Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.policy_id}>
                      <TableCell className="font-medium">
                        {record.policy_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{record.provider}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.product_type}</div>
                          <div className="text-sm text-muted-foreground">{record.product_category}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{record.gross_premium.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div>{record.commission_rate.toFixed(2)}%</div>
                          {record.reward_rate > 0 && (
                            <div className="text-xs text-muted-foreground">
                              +{record.reward_rate.toFixed(2)}% reward
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">₹{record.total_commission.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            Comm: ₹{record.commission_amount.toLocaleString()}
                            {record.reward_amount > 0 && ` + ₹${record.reward_amount.toLocaleString()}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSourceIcon(record.source_type)}
                          <div>
                            <div className="font-medium">{record.source_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {record.source_type || 'Direct'}
                              {record.tier_name && (
                                <span className="ml-1 text-primary">({record.tier_name})</span>
                              )}
                              {record.override_used && (
                                <span className="ml-1 text-orange-600">(Override)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.policy_status)}>
                          {record.policy_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPayoutStatusColor(record.payout_status)}>
                          {record.payout_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedPolicy(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Commission Breakdown - {record.policy_number}</DialogTitle>
                            </DialogHeader>
                            {selectedPolicy && (
                              <PolicyCommissionDetails policy={selectedPolicy} />
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
    </>
  );
}

function PolicyCommissionDetails({ policy }: { policy: PolicyCommissionRecord }) {
  return (
    <div className="space-y-6">
      {/* Policy Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Policy Information</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Customer:</span> {policy.customer_name}</div>
            <div><span className="text-muted-foreground">Product:</span> {policy.product_type} ({policy.product_category})</div>
            <div><span className="text-muted-foreground">Provider:</span> {policy.provider}</div>
            <div><span className="text-muted-foreground">Period:</span> {policy.policy_start_date} to {policy.policy_end_date}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Financial Details</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Gross Premium:</span> ₹{policy.gross_premium.toLocaleString()}</div>
            <div><span className="text-muted-foreground">Net Premium:</span> ₹{policy.net_premium.toLocaleString()}</div>
            <div><span className="text-muted-foreground">Commission Rate:</span> {policy.commission_rate.toFixed(2)}%</div>
            <div><span className="text-muted-foreground">Reward Rate:</span> {policy.reward_rate.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div>
        <h4 className="font-semibold mb-2">Commission Breakdown</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Commission:</span> ₹{policy.commission_amount.toLocaleString()}</div>
            <div><span className="text-muted-foreground">Reward:</span> ₹{policy.reward_amount.toLocaleString()}</div>
            <div className="font-semibold"><span className="text-muted-foreground">Total:</span> ₹{policy.total_commission.toLocaleString()}</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Source:</span> {policy.source_name} ({policy.source_type || 'Direct'})</div>
            <div><span className="text-muted-foreground">Status:</span> 
              <Badge className={`ml-2 ${policy.policy_status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                {policy.policy_status}
              </Badge>
            </div>
            <div><span className="text-muted-foreground">Payout:</span> 
              <Badge className={`ml-2 ${policy.payout_status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                {policy.payout_status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Distribution */}
      <div>
        <h4 className="font-semibold mb-2">Payout Distribution</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Org Admin Share:</span>
              <span>{policy.org_admin_share}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agent Share:</span>
              <span>{policy.agent_share}%</span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">MISP Share:</span>
              <span>{policy.misp_share}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee Share:</span>
              <span>{policy.employee_share}%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total Distribution:</span>
              <span>100%</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span>₹{policy.total_commission.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}