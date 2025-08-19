import React, { useState } from 'react';
import { Search, Filter, Download, Eye, User, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Variance {
  id: string;
  type: 'Insurer' | 'Revenue' | 'Payout';
  amount: number;
  status: 'Open' | 'Under Review' | 'Resolved';
  linkedReference: string;
  createdDate: string;
  assignedTo?: string;
  description: string;
}

const VarianceWorkbench = () => {
  const [variances] = useState<Variance[]>([
    {
      id: 'VAR001',
      type: 'Insurer',
      amount: -1500,
      status: 'Open',
      linkedReference: 'STL001',
      createdDate: '2024-01-15',
      description: 'Settlement shortfall from XYZ Insurance Co.'
    },
    {
      id: 'VAR002',
      type: 'Revenue',
      amount: 2500,
      status: 'Under Review',
      linkedReference: 'REV004',
      createdDate: '2024-01-14',
      assignedTo: 'Finance Analyst',
      description: 'Excess premium recorded vs expected'
    },
    {
      id: 'VAR003',
      type: 'Payout',
      amount: -750,
      status: 'Resolved',
      linkedReference: 'PO005',
      createdDate: '2024-01-13',
      assignedTo: 'Finance Manager',
      description: 'Commission calculation discrepancy resolved'
    }
  ]);

  const [selectedVariance, setSelectedVariance] = useState<Variance | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [assignedReviewer, setAssignedReviewer] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'default';
      case 'Under Review': return 'secondary';
      case 'Open': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Insurer': return 'bg-blue-100 text-blue-800';
      case 'Revenue': return 'bg-green-100 text-green-800';
      case 'Payout': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAmountColor = (amount: number) => {
    if (amount === 0) return 'text-gray-600';
    if (amount < 0) return 'text-red-600';
    return 'text-green-600';
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
                <AlertTriangle className="w-6 h-6 mr-2" />
                Variance Workbench
              </h1>
              <p className="text-sm text-muted-foreground">Track and resolve financial variances</p>
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
                placeholder="Search variances..."
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
              <p className="text-sm text-muted-foreground">Total Variances</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">1</div>
              <p className="text-sm text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">1</div>
              <p className="text-sm text-muted-foreground">Under Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">1</div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Variances Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Records</CardTitle>
            <CardDescription>Financial discrepancies requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variance ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked Reference</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variances.map((variance) => (
                  <TableRow key={variance.id}>
                    <TableCell className="font-medium">{variance.id}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(variance.type)}`}>
                        {variance.type}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getAmountColor(variance.amount)}`}>
                      ₹{variance.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(variance.status)}>{variance.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{variance.linkedReference}</TableCell>
                    <TableCell>{variance.createdDate}</TableCell>
                    <TableCell>{variance.assignedTo || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedVariance(variance)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Variance Details - {selectedVariance?.id}</DialogTitle>
                              <DialogDescription>
                                Review variance details and take action
                              </DialogDescription>
                            </DialogHeader>
                            {selectedVariance && (
                              <div className="mt-6 space-y-6">
                                {/* Variance Summary */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm">Variance Summary</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium">Type</p>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(selectedVariance.type)}`}>
                                          {selectedVariance.type}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Amount</p>
                                        <p className={`text-2xl font-bold ${getAmountColor(selectedVariance.amount)}`}>
                                          ₹{selectedVariance.amount.toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Status</p>
                                        <Badge variant={getStatusColor(selectedVariance.status)}>
                                          {selectedVariance.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Linked Reference</p>
                                        <p className="font-mono text-sm">{selectedVariance.linkedReference}</p>
                                      </div>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-sm font-medium">Description</p>
                                      <p className="text-sm text-muted-foreground">{selectedVariance.description}</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Expected vs Received Comparison */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm">Variance Analysis</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Expected</h4>
                                        <div className="p-4 bg-muted rounded-lg">
                                          <p className="text-lg font-bold">₹50,000</p>
                                          <p className="text-sm text-muted-foreground">Based on our records</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Actual</h4>
                                        <div className="p-4 bg-muted rounded-lg">
                                          <p className="text-lg font-bold">₹48,500</p>
                                          <p className="text-sm text-muted-foreground">Received amount</p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Actions */}
                                {selectedVariance.status !== 'Resolved' && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      {selectedVariance.status === 'Open' && (
                                        <div>
                                          <label className="text-sm font-medium">Assign Reviewer</label>
                                          <Select value={assignedReviewer} onValueChange={setAssignedReviewer}>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select reviewer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="finance-analyst">Finance Analyst</SelectItem>
                                              <SelectItem value="finance-manager">Finance Manager</SelectItem>
                                              <SelectItem value="operations-head">Operations Head</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                      <div>
                                        <label className="text-sm font-medium">Resolution Comments</label>
                                        <Textarea
                                          placeholder="Add resolution comments..."
                                          value={reviewComment}
                                          onChange={(e) => setReviewComment(e.target.value)}
                                        />
                                      </div>
                                      <div className="flex gap-3">
                                        {selectedVariance.status === 'Open' && (
                                          <Button className="flex-1">
                                            <User className="w-4 h-4 mr-2" />
                                            Assign Reviewer
                                          </Button>
                                        )}
                                        <Button variant="outline" className="flex-1">
                                          <FileText className="w-4 h-4 mr-2" />
                                          {selectedVariance.status === 'Under Review' ? 'Resolve' : 'Update'}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {variance.status === 'Open' && (
                          <Button variant="ghost" size="sm">
                            <User className="w-4 h-4" />
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

export default VarianceWorkbench;