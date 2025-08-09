import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Download, FileText, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { useFinanceData } from "@/hooks/useFinanceData";

export default function Finance() {
  const { data: financeData, loading, error } = useFinanceData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [payoutFilter, setPayoutFilter] = useState("all");
  const [reclaimFilter, setReclaimFilter] = useState("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading finance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Error Loading Finance Data</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { payoutSummary, reclaimSummary, pendingPayouts, reclaimItems } = financeData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Approved": return "bg-blue-100 text-blue-800";
      case "Paid": return "bg-green-100 text-green-800";
      case "Held": return "bg-red-100 text-red-800";
      case "Recovered": return "bg-green-100 text-green-800";
      case "Waived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payoutSummary.totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {payoutSummary.agentCount} agents pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Payouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payoutSummary.totalApproved)}</div>
            <p className="text-xs text-muted-foreground">
              Ready for processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reclaims</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reclaimSummary.totalRecovered)}</div>
            <p className="text-xs text-muted-foreground">
              {reclaimSummary.reclaimCount} cases processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(1500000)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payouts">Payout Processing</TabsTrigger>
          <TabsTrigger value="reclaims">Reclaim Management</TabsTrigger>
          <TabsTrigger value="invoices">Provider Invoices</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Payout Processing</CardTitle>
              <CardDescription>
                Manage commission payouts for agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <DatePickerWithRange
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range"
                />
                <Select value={payoutFilter} onValueChange={setPayoutFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="held">Held</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Search agent..." className="w-60" />
                <Button>Apply Filters</Button>
              </div>

              {/* Payout Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Policies</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">{payout.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payout.agentName}</div>
                            <div className="text-sm text-muted-foreground">{payout.agentCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payout.daysOverdue > 0 ? (
                            <Badge variant="destructive">{payout.daysOverdue} days</Badge>
                          ) : (
                            <span className="text-green-600">On time</span>
                          )}
                        </TableCell>
                        <TableCell>{payout.policies}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm">Process</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reclaims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reclaim Management</CardTitle>
              <CardDescription>
                Handle commission reclaims from policy cancellations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reclaim Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Recovered</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(reclaimSummary.totalRecovered)}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Recovery</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {formatCurrency(reclaimSummary.totalPending)}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Waived</p>
                        <p className="text-2xl font-bold text-gray-600">
                          {formatCurrency(reclaimSummary.totalWaived)}
                        </p>
                      </div>
                      <XCircle className="h-8 w-8 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reclaim Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reclaim ID</TableHead>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reclaimItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.policyNumber}</TableCell>
                        <TableCell>{item.agentName}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            {item.status === "Pending" && (
                              <Button size="sm">Process</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Invoice Management</CardTitle>
              <CardDescription>
                Track and reconcile commission invoices from insurance providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Invoice Management</h3>
                <p>Upload and track commission invoices from insurance providers</p>
                <Button className="mt-4">
                  Upload Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate comprehensive financial reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Agent Payout Summary</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Detailed payout report by date range
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Payout Aging Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Payouts pending over 7/15/30 days
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Commission Received vs Expected</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Monthly reconciliation report
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Reclaim Trend Analysis</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analysis of reclaim patterns and trends
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}