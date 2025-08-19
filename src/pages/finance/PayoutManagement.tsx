import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Check, X, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Payout {
  id: string;
  agentOrg: string;
  amount: number;
  requestDate: string;
  status: 'Requested' | 'Approved' | 'Paid' | 'Rejected';
  paymentRef?: string;
  breakdown: PayoutBreakdown[];
}

interface PayoutBreakdown {
  type: string;
  amount: number;
  percentage: number;
}

const PayoutManagement = () => {
  const [payouts] = useState<Payout[]>([
    {
      id: 'PO001',
      agentOrg: 'Agent A001 - John Doe',
      amount: 15000,
      requestDate: '2024-01-15',
      status: 'Requested',
      breakdown: [
        { type: 'Base Commission', amount: 12000, percentage: 80 },
        { type: 'Renewal Bonus', amount: 2000, percentage: 13.33 },
        { type: 'Performance Bonus', amount: 1000, percentage: 6.67 }
      ]
    },
    {
      id: 'PO002',
      agentOrg: 'Branch B001 - Mumbai Office',
      amount: 25000,
      requestDate: '2024-01-14',
      status: 'Approved',
      breakdown: [
        { type: 'Branch Commission', amount: 20000, percentage: 80 },
        { type: 'Override Commission', amount: 5000, percentage: 20 }
      ]
    },
    {
      id: 'PO003',
      agentOrg: 'Agent A002 - Jane Smith',
      amount: 8500,
      requestDate: '2024-01-16',
      status: 'Paid',
      paymentRef: 'TXN12345',
      breakdown: [
        { type: 'Base Commission', amount: 7500, percentage: 88.24 },
        { type: 'Target Achievement', amount: 1000, percentage: 11.76 }
      ]
    }
  ]);

  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [workflowComment, setWorkflowComment] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Approved': return 'secondary';
      case 'Requested': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary flex items-center">
                <CreditCard className="w-6 h-6 mr-2" />
                Payout Management
              </h1>
              <p className="text-sm text-muted-foreground">Manage commission and reward payouts</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search payouts..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">₹48,500</div>
              <p className="text-sm text-muted-foreground">Total Payouts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">₹15,000</div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">₹25,000</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">₹8,500</div>
              <p className="text-sm text-muted-foreground">Paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Payouts Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>Commission and reward payout requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Agent / Organization</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Ref</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.id}</TableCell>
                    <TableCell>{payout.agentOrg}</TableCell>
                    <TableCell className="text-right font-medium">₹{payout.amount.toLocaleString()}</TableCell>
                    <TableCell>{payout.requestDate}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(payout.status)}>{payout.status}</Badge>
                    </TableCell>
                    <TableCell>{payout.paymentRef || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayout(payout)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Payout Details - {selectedPayout?.id}</DialogTitle>
                              <DialogDescription>
                                Review payout breakdown and take action
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPayout && (
                              <div className="mt-6 space-y-6">
                                {/* Payout Summary */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm">Payout Summary</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium">Recipient</p>
                                        <p className="text-lg">{selectedPayout.agentOrg}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Total Amount</p>
                                        <p className="text-2xl font-bold">₹{selectedPayout.amount.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Request Date</p>
                                        <p className="text-lg">{selectedPayout.requestDate}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Status</p>
                                        <Badge variant={getStatusColor(selectedPayout.status)}>
                                          {selectedPayout.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Breakdown */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm">Allocation Breakdown</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Type</TableHead>
                                          <TableHead className="text-right">Amount</TableHead>
                                          <TableHead className="text-right">Percentage</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {selectedPayout.breakdown.map((item, index) => (
                                          <TableRow key={index}>
                                            <TableCell>{item.type}</TableCell>
                                            <TableCell className="text-right">₹{item.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </CardContent>
                                </Card>

                                {/* Workflow Actions */}
                                {selectedPayout.status === 'Requested' && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Workflow Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium">Comments</label>
                                        <Textarea
                                          placeholder="Add workflow comments..."
                                          value={workflowComment}
                                          onChange={(e) => setWorkflowComment(e.target.value)}
                                        />
                                      </div>
                                      <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1">
                                          <Check className="w-4 h-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button variant="outline" className="flex-1">
                                          <X className="w-4 h-4 mr-2" />
                                          Reject
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Mark as Paid */}
                                {selectedPayout.status === 'Approved' && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Payment Processing</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Button className="w-full">
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Mark as Paid
                                      </Button>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {payout.status === 'Requested' && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {payout.status === 'Approved' && (
                          <Button variant="ghost" size="sm">
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PayoutManagement;