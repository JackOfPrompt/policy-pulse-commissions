import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  Plus, 
  Upload, 
  Download, 
  Filter, 
  Search,
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Premium {
  premium_id: number;
  tenant_id: string;
  org_id?: number;
  insurer_id: number;
  product_id: number;
  policy_id: number;
  gross_premium: number;
  net_premium: number;
  receipt_date: string;
  ref_no?: string;
  status: 'Received' | 'Reconciled' | 'Pending' | 'Disputed';
  created_at: string;
  updated_at: string;
  insurer_name?: string;
  product_name?: string;
  policy_number?: string;
  org_name?: string;
}

interface Adjustment {
  adjustment_id: number;
  premium_id: number;
  adjustment_type: 'refund' | 'chargeback' | 'endorsement';
  amount: number;
  reason?: string;
  created_at: string;
  created_by: string;
}

const PremiumManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [premiums, setPremiums] = useState<Premium[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [selectedPremium, setSelectedPremium] = useState<Premium | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receipts');

  const [filters, setFilters] = useState({
    search: '',
    org_id: '',
    insurer_id: '',
    status: '',
    from_date: '',
    to_date: ''
  });

  const [formData, setFormData] = useState({
    org_id: '',
    insurer_id: '',
    product_id: '',
    policy_id: '',
    gross_premium: '',
    net_premium: '',
    receipt_date: '',
    ref_no: ''
  });

  const [adjustmentData, setAdjustmentData] = useState({
    adjustment_type: '',
    amount: '',
    reason: ''
  });

  useEffect(() => {
    fetchPremiums();
    if (activeTab === 'adjustments') {
      fetchAdjustments();
    }
  }, [filters, activeTab]);

  const fetchPremiums = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('revenue-premiums', {
        body: { action: 'list', filters }
      });

      if (error) throw error;
      setPremiums(data || []);
    } catch (error) {
      console.error('Error fetching premiums:', error);
      toast({
        title: "Error",
        description: "Failed to load premium data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('revenue-premiums', {
        body: { action: 'list_adjustments' }
      });

      if (error) throw error;
      setAdjustments(data || []);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const handleCreatePremium = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.functions.invoke('revenue-premiums', {
        body: {
          action: 'create',
          ...formData,
          gross_premium: parseFloat(formData.gross_premium),
          net_premium: parseFloat(formData.net_premium),
          policy_id: parseInt(formData.policy_id),
          product_id: parseInt(formData.product_id),
          insurer_id: parseInt(formData.insurer_id),
          org_id: formData.org_id ? parseInt(formData.org_id) : null
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Premium receipt created successfully"
      });

      setIsCreateDialogOpen(false);
      setFormData({
        org_id: '',
        insurer_id: '',
        product_id: '',
        policy_id: '',
        gross_premium: '',
        net_premium: '',
        receipt_date: '',
        ref_no: ''
      });
      fetchPremiums();
    } catch (error) {
      console.error('Error creating premium:', error);
      toast({
        title: "Error",
        description: "Failed to create premium receipt",
        variant: "destructive"
      });
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPremium) return;

    try {
      const { error } = await supabase.functions.invoke('revenue-premiums', {
        body: {
          action: 'create_adjustment',
          premium_id: selectedPremium.premium_id,
          ...adjustmentData,
          amount: parseFloat(adjustmentData.amount)
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Adjustment created successfully"
      });

      setIsAdjustmentDialogOpen(false);
      setAdjustmentData({
        adjustment_type: '',
        amount: '',
        reason: ''
      });
      fetchPremiums();
      fetchAdjustments();
    } catch (error) {
      console.error('Error creating adjustment:', error);
      toast({
        title: "Error",
        description: "Failed to create adjustment",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Reconciled':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Disputed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reconciled':
        return 'default';
      case 'Disputed':
        return 'destructive';
      case 'Pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BackButton />
              <div className="ml-4">
                <h1 className="text-xl font-bold text-primary flex items-center">
                  <Receipt className="w-6 h-6 mr-2" />
                  Premium Management
                </h1>
                <p className="text-sm text-muted-foreground">Track and manage premium collections and allocations</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Capture Receipt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Capture Premium Receipt</DialogTitle>
                    <DialogDescription>
                      Record a new premium collection
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePremium} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="policy_id">Policy ID</Label>
                        <Input 
                          id="policy_id"
                          value={formData.policy_id}
                          onChange={(e) => setFormData({...formData, policy_id: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="org_id">Organization</Label>
                        <Select onValueChange={(value) => setFormData({...formData, org_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select org" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Add org options */}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gross_premium">Gross Premium (₹)</Label>
                        <Input 
                          id="gross_premium"
                          type="number"
                          step="0.01"
                          value={formData.gross_premium}
                          onChange={(e) => setFormData({...formData, gross_premium: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="net_premium">Net Premium (₹)</Label>
                        <Input 
                          id="net_premium"
                          type="number"
                          step="0.01"
                          value={formData.net_premium}
                          onChange={(e) => setFormData({...formData, net_premium: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="receipt_date">Receipt Date</Label>
                      <Input 
                        id="receipt_date"
                        type="date"
                        value={formData.receipt_date}
                        onChange={(e) => setFormData({...formData, receipt_date: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="ref_no">Reference Number</Label>
                      <Input 
                        id="ref_no"
                        value={formData.ref_no}
                        onChange={(e) => setFormData({...formData, ref_no: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Receipt</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="receipts">Premium Receipts</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          </TabsList>

          <TabsContent value="receipts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Premium Receipts</CardTitle>
                    <CardDescription>Track all premium collections and their reconciliation status</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search receipts..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Insurer</TableHead>
                      <TableHead>Gross Premium</TableHead>
                      <TableHead>Net Premium</TableHead>
                      <TableHead>Receipt Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {premiums.map((premium) => (
                      <TableRow key={premium.premium_id}>
                        <TableCell className="font-medium">
                          {premium.policy_number || `#${premium.policy_id}`}
                        </TableCell>
                        <TableCell>{premium.org_name || 'N/A'}</TableCell>
                        <TableCell>{premium.insurer_name || 'N/A'}</TableCell>
                        <TableCell>₹{premium.gross_premium.toLocaleString()}</TableCell>
                        <TableCell>₹{premium.net_premium.toLocaleString()}</TableCell>
                        <TableCell>{new Date(premium.receipt_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(premium.status)} className="flex items-center w-fit">
                            {getStatusIcon(premium.status)}
                            <span className="ml-1">{premium.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedPremium(premium);
                                setIsAdjustmentDialogOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjustments">
            <Card>
              <CardHeader>
                <CardTitle>Premium Adjustments</CardTitle>
                <CardDescription>Track refunds, chargebacks, and endorsements</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Premium ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Created By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => (
                      <TableRow key={adjustment.adjustment_id}>
                        <TableCell>#{adjustment.premium_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{adjustment.adjustment_type}</Badge>
                        </TableCell>
                        <TableCell>₹{adjustment.amount.toLocaleString()}</TableCell>
                        <TableCell>{adjustment.reason || 'N/A'}</TableCell>
                        <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{adjustment.created_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Status</CardTitle>
                <CardDescription>Match premium receipts with insurer statements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Reconciliation module will be implemented here</p>
                  <p className="text-sm">Auto-match receipts with insurer statement items</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Adjustment Dialog */}
        <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Adjustment</DialogTitle>
              <DialogDescription>
                Add an adjustment for premium {selectedPremium?.policy_number || `#${selectedPremium?.policy_id}`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <Label htmlFor="adjustment_type">Adjustment Type</Label>
                <Select onValueChange={(value) => setAdjustmentData({...adjustmentData, adjustment_type: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select adjustment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="chargeback">Chargeback</SelectItem>
                    <SelectItem value="endorsement">Endorsement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input 
                  id="amount"
                  type="number"
                  step="0.01"
                  value={adjustmentData.amount}
                  onChange={(e) => setAdjustmentData({...adjustmentData, amount: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input 
                  id="reason"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                  placeholder="Optional reason for adjustment"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Adjustment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PremiumManagement;