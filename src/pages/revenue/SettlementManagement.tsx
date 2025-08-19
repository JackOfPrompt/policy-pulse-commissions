import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Banknote, 
  Upload, 
  Download, 
  Search,
  Filter,
  Link2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Eye,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InsurerStatementItem {
  item_id: number;
  tenant_id: number;
  insurer_id: number;
  statement_period: string;
  policy_number?: string;
  premium_amount?: number;
  commission_amount?: number;
  item_date?: string;
  matched_status: 'Unmatched' | 'Matched' | 'Disputed';
  confidence?: number;
  created_at: string;
  insurer_name?: string;
}

interface SettlementLink {
  link_id: number;
  earning_id: number;
  item_id: number;
  matched_amount: number;
  confidence: number;
  created_at: string;
  policy_number?: string;
  commission_amount?: number;
  item_commission?: number;
  variance?: number;
}

interface ReconciliationSummary {
  total_statements: number;
  matched_items: number;
  unmatched_items: number;
  disputed_items: number;
  total_variance: number;
  reconciliation_rate: number;
}

const SettlementManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statementItems, setStatementItems] = useState<InsurerStatementItem[]>([]);
  const [settlementLinks, setSettlementLinks] = useState<SettlementLink[]>([]);
  const [reconciliationSummary, setReconciliationSummary] = useState<ReconciliationSummary | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('statements');
  const [matchingLoading, setMatchingLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    insurer_id: '',
    statement_period: '',
    matched_status: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    fetchStatementItems();
    fetchSettlementLinks();
    fetchReconciliationSummary();
  }, [filters]);

  const fetchStatementItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('revenue-settlements', {
        body: { action: 'list_statements', filters }
      });

      if (error) throw error;
      setStatementItems(data || []);
    } catch (error) {
      console.error('Error fetching statement items:', error);
      toast({
        title: "Error",
        description: "Failed to load insurer statement items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlementLinks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('revenue-settlements', {
        body: { action: 'list_links' }
      });

      if (error) throw error;
      setSettlementLinks(data || []);
    } catch (error) {
      console.error('Error fetching settlement links:', error);
    }
  };

  const fetchReconciliationSummary = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('revenue-settlements', {
        body: { action: 'reconciliation_summary', filters }
      });

      if (error) throw error;
      setReconciliationSummary(data);
    } catch (error) {
      console.error('Error fetching reconciliation summary:', error);
    }
  };

  const handleAutoMatch = async () => {
    try {
      setMatchingLoading(true);
      const { data, error } = await supabase.functions.invoke('revenue-settlements', {
        body: { action: 'auto_match' }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Auto-matched ${data.matched_count} statement items`
      });

      fetchStatementItems();
      fetchSettlementLinks();
      fetchReconciliationSummary();
    } catch (error) {
      console.error('Error auto-matching:', error);
      toast({
        title: "Error",
        description: "Failed to auto-match statement items",
        variant: "destructive"
      });
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleManualMatch = async (itemId: number, earningId: number) => {
    try {
      const { error } = await supabase.functions.invoke('revenue-settlements', {
        body: { 
          action: 'manual_match',
          item_id: itemId,
          earning_id: earningId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Statement item matched successfully"
      });

      fetchStatementItems();
      fetchSettlementLinks();
      fetchReconciliationSummary();
    } catch (error) {
      console.error('Error manual matching:', error);
      toast({
        title: "Error",
        description: "Failed to match statement item",
        variant: "destructive"
      });
    }
  };

  const handleUnmatch = async (linkId: number) => {
    try {
      const { error } = await supabase.functions.invoke('revenue-settlements', {
        body: { 
          action: 'unmatch',
          link_id: linkId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Statement item unmatched successfully"
      });

      fetchStatementItems();
      fetchSettlementLinks();
      fetchReconciliationSummary();
    } catch (error) {
      console.error('Error unmatching:', error);
      toast({
        title: "Error",
        description: "Failed to unmatch statement item",
        variant: "destructive"
      });
    }
  };

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'Matched':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Disputed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'Matched':
        return 'default';
      case 'Disputed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) < 10) return 'text-green-600';
    if (Math.abs(variance) < 100) return 'text-yellow-600';
    return 'text-red-600';
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
                  <Banknote className="w-6 h-6 mr-2" />
                  Settlement Management
                </h1>
                <p className="text-sm text-muted-foreground">Track settlements and reconciliation with insurers</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import Statements
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button 
                size="sm"
                onClick={handleAutoMatch}
                disabled={matchingLoading}
              >
                <Link2 className={`w-4 h-4 mr-2 ${matchingLoading ? 'animate-spin' : ''}`} />
                Auto Match
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reconciliation Summary */}
        {reconciliationSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reconciliationSummary.total_statements}
                </div>
                <p className="text-sm text-muted-foreground">Statement items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Matched
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {reconciliationSummary.matched_items}
                </div>
                <p className="text-sm text-muted-foreground">Successfully matched</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                  Unmatched
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {reconciliationSummary.unmatched_items}
                </div>
                <p className="text-sm text-muted-foreground">Require matching</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <XCircle className="w-5 h-5 mr-2 text-red-600" />
                  Disputed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {reconciliationSummary.disputed_items}
                </div>
                <p className="text-sm text-muted-foreground">Need resolution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Reconciliation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {reconciliationSummary.reconciliation_rate.toFixed(1)}%
                </div>
                <Progress value={reconciliationSummary.reconciliation_rate} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="statements">Insurer Statements</TabsTrigger>
            <TabsTrigger value="matches">Settlement Links</TabsTrigger>
            <TabsTrigger value="variances">Variance Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="statements">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Insurer Statement Items</CardTitle>
                    <CardDescription>Match statement items with commission earnings</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search statements..."
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
                      <TableHead>Insurer</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Premium Amount</TableHead>
                      <TableHead>Commission Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Match Status</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statementItems.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium">{item.insurer_name || 'N/A'}</TableCell>
                        <TableCell>{item.statement_period}</TableCell>
                        <TableCell>{item.policy_number || 'N/A'}</TableCell>
                        <TableCell>₹{item.premium_amount?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>₹{item.commission_amount?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>
                          {item.item_date ? new Date(item.item_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getMatchStatusColor(item.matched_status)} className="flex items-center w-fit">
                            {getMatchStatusIcon(item.matched_status)}
                            <span className="ml-1">{item.matched_status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.confidence ? `${item.confidence}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {item.matched_status === 'Unmatched' && (
                              <Button variant="ghost" size="sm">
                                <Link2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
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

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Settlement Links</CardTitle>
                <CardDescription>View and manage matched statement items</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Earning Commission</TableHead>
                      <TableHead>Statement Commission</TableHead>
                      <TableHead>Matched Amount</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlementLinks.map((link) => (
                      <TableRow key={link.link_id}>
                        <TableCell className="font-medium">{link.policy_number || 'N/A'}</TableCell>
                        <TableCell>₹{link.commission_amount?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>₹{link.item_commission?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>₹{link.matched_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${getVarianceColor(link.variance || 0)}`}>
                            ₹{link.variance?.toLocaleString() || '0'}
                          </span>
                        </TableCell>
                        <TableCell>{link.confidence}%</TableCell>
                        <TableCell>{new Date(link.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUnmatch(link.link_id)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
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

          <TabsContent value="variances">
            <Card>
              <CardHeader>
                <CardTitle>Variance Analysis</CardTitle>
                <CardDescription>Analyze discrepancies between earnings and statement items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Variance analysis dashboard will be implemented here</p>
                  <p className="text-sm">Track and resolve commission discrepancies</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SettlementManagement;