import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Check, X, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Settlement {
  id: string;
  period: string;
  insurer: string;
  expected: number;
  received: number;
  variance: number;
  status: 'Pending' | 'Reconciled' | 'Disputed';
  approvedBy?: string;
}

const SettlementsWorkbench = () => {
  const [settlements] = useState<Settlement[]>([
    {
      id: 'STL001',
      period: '2024-01',
      insurer: 'XYZ Insurance Co.',
      expected: 150000,
      received: 148500,
      variance: -1500,
      status: 'Pending',
    },
    {
      id: 'STL002',
      period: '2024-01',
      insurer: 'ABC Life Insurance',
      expected: 200000,
      received: 200000,
      variance: 0,
      status: 'Reconciled',
      approvedBy: 'Finance Manager'
    },
    {
      id: 'STL003',
      period: '2024-01',
      insurer: 'DEF General Insurance',
      expected: 75000,
      received: 70000,
      variance: -5000,
      status: 'Disputed',
    }
  ]);

  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reconciled': return 'default';
      case 'Pending': return 'secondary';
      case 'Disputed': return 'destructive';
      default: return 'outline';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-blue-600';
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
                <FileText className="w-6 h-6 mr-2" />
                Settlements Workbench
              </h1>
              <p className="text-sm text-muted-foreground">Manage insurer settlement reconciliation</p>
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
                placeholder="Search settlements..."
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
              <div className="text-2xl font-bold">3</div>
              <p className="text-sm text-muted-foreground">Total Settlements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">1</div>
              <p className="text-sm text-muted-foreground">Reconciled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">1</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">1</div>
              <p className="text-sm text-muted-foreground">Disputed</p>
            </CardContent>
          </Card>
        </div>

        {/* Settlements Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Settlement Records</CardTitle>
            <CardDescription>Insurer settlement reconciliation status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-medium">{settlement.id}</TableCell>
                    <TableCell>{settlement.period}</TableCell>
                    <TableCell>{settlement.insurer}</TableCell>
                    <TableCell className="text-right">₹{settlement.expected.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{settlement.received.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-medium ${getVarianceColor(settlement.variance)}`}>
                      {settlement.variance === 0 ? '—' : `₹${settlement.variance.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(settlement.status)}>{settlement.status}</Badge>
                    </TableCell>
                    <TableCell>{settlement.approvedBy || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSettlement(settlement)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Settlement Reconciliation - {selectedSettlement?.id}</DialogTitle>
                              <DialogDescription>
                                Review insurer statement vs revenue records
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSettlement && (
                              <div className="mt-6">
                                {/* Settlement Summary */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Expected (Our Records)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">₹{selectedSettlement.expected.toLocaleString()}</div>
                                      <p className="text-sm text-muted-foreground">Based on premium records</p>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Received (Insurer Statement)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">₹{selectedSettlement.received.toLocaleString()}</div>
                                      <p className="text-sm text-muted-foreground">Per insurer statement</p>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Variance Analysis */}
                                {selectedSettlement.variance !== 0 && (
                                  <Card className="mb-6">
                                    <CardHeader>
                                      <CardTitle className="text-sm">Variance Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className={`text-xl font-bold ${getVarianceColor(selectedSettlement.variance)}`}>
                                        ₹{selectedSettlement.variance.toLocaleString()}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedSettlement.variance < 0 ? 'Shortfall' : 'Excess'} in settlement
                                      </p>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                  {selectedSettlement.status === 'Pending' && (
                                    <>
                                      <Button variant="outline" className="flex-1">
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Button variant="outline" className="flex-1">
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  <Button className="flex-1">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Post to Finance
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {settlement.status === 'Pending' && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
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

export default SettlementsWorkbench;