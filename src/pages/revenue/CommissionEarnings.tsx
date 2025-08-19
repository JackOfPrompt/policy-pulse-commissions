import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Shield
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommissionEarning {
  earning_id: number;
  tenant_id: number;
  org_id?: number;
  insurer_id: number;
  product_id: number;
  policy_id: number;
  premium_id?: number;
  rule_id?: number;
  base_amount: number;
  bonus_amount: number;
  renewal_amount: number;
  total_amount: number;
  compliance_status: 'Within' | 'Above' | 'Critical';
  locked: boolean;
  created_at: string;
  updated_at: string;
  policy_number?: string;
  insurer_name?: string;
  product_name?: string;
  org_name?: string;
  rule_name?: string;
}

interface ComplianceMetrics {
  total_earnings: number;
  within_limit: number;
  above_limit: number;
  critical_limit: number;
  compliance_percentage: number;
}

const CommissionEarnings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<CommissionEarning[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null);
  const [selectedEarnings, setSelectedEarnings] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [recomputeLoading, setRecomputeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('earnings');

  const [filters, setFilters] = useState({
    search: '',
    org_id: '',
    insurer_id: '',
    product_id: '',
    compliance_status: '',
    locked: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    fetchEarnings();
    fetchComplianceMetrics();
  }, [filters]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('revenue-earnings', {
        body: { action: 'list', filters }
      });

      if (error) throw error;
      setEarnings(data || []);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: "Error",
        description: "Failed to load commission earnings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('revenue-earnings', {
        body: { action: 'compliance_metrics', filters }
      });

      if (error) throw error;
      setComplianceMetrics(data);
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
    }
  };

  const handleRecompute = async (earningIds?: number[]) => {
    try {
      setRecomputeLoading(true);
      const ids = earningIds || Array.from(selectedEarnings);
      
      if (ids.length === 0) {
        toast({
          title: "Warning",
          description: "Please select earnings to recompute",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.functions.invoke('revenue-earnings', {
        body: { action: 'recompute', earning_ids: ids }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Recomputed ${ids.length} commission earnings`
      });

      setSelectedEarnings(new Set());
      fetchEarnings();
      fetchComplianceMetrics();
    } catch (error) {
      console.error('Error recomputing earnings:', error);
      toast({
        title: "Error",
        description: "Failed to recompute commission earnings",
        variant: "destructive"
      });
    } finally {
      setRecomputeLoading(false);
    }
  };

  const handleLockToggle = async (earningId: number, locked: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('revenue-earnings', {
        body: { 
          action: locked ? 'unlock' : 'lock', 
          earning_id: earningId 
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Commission earning ${locked ? 'unlocked' : 'locked'} successfully`
      });

      fetchEarnings();
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast({
        title: "Error",
        description: "Failed to update lock status",
        variant: "destructive"
      });
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'Within':
        return 'default';
      case 'Above':
        return 'secondary';
      case 'Critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'Within':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Above':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'Critical':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const handleSelectAll = () => {
    if (selectedEarnings.size === earnings.length) {
      setSelectedEarnings(new Set());
    } else {
      setSelectedEarnings(new Set(earnings.map(e => e.earning_id)));
    }
  };

  const handleSelectEarning = (earningId: number) => {
    const newSelected = new Set(selectedEarnings);
    if (newSelected.has(earningId)) {
      newSelected.delete(earningId);
    } else {
      newSelected.add(earningId);
    }
    setSelectedEarnings(newSelected);
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
                  <Calculator className="w-6 h-6 mr-2" />
                  Commission Earnings
                </h1>
                <p className="text-sm text-muted-foreground">Calculate and track commission earnings by organization</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRecompute()}
                disabled={recomputeLoading || selectedEarnings.size === 0}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${recomputeLoading ? 'animate-spin' : ''}`} />
                Recompute Selected ({selectedEarnings.size})
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="earnings">Earnings Grid</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Monitor</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Commission Earnings</CardTitle>
                    <CardDescription>Track commission calculations with recompute and lock controls</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search earnings..."
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
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedEarnings.size === earnings.length && earnings.length > 0}
                          onChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Policy</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Insurer</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Renewal</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map((earning) => (
                      <TableRow key={earning.earning_id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedEarnings.has(earning.earning_id)}
                            onChange={() => handleSelectEarning(earning.earning_id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {earning.policy_number || `#${earning.policy_id}`}
                        </TableCell>
                        <TableCell>{earning.org_name || 'N/A'}</TableCell>
                        <TableCell>{earning.insurer_name || 'N/A'}</TableCell>
                        <TableCell>₹{earning.base_amount.toLocaleString()}</TableCell>
                        <TableCell>₹{earning.bonus_amount.toLocaleString()}</TableCell>
                        <TableCell>₹{earning.renewal_amount.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">₹{earning.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getComplianceColor(earning.compliance_status)} className="flex items-center w-fit">
                            {getComplianceIcon(earning.compliance_status)}
                            <span className="ml-1">{earning.compliance_status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={earning.locked ? 'secondary' : 'outline'}>
                            {earning.locked ? 'Locked' : 'Unlocked'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRecompute([earning.earning_id])}
                              disabled={earning.locked}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLockToggle(earning.earning_id, earning.locked)}
                            >
                              {earning.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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

          <TabsContent value="compliance">
            <div className="space-y-6">
              {complianceMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        Within Limits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {complianceMetrics.within_limit}
                      </div>
                      <p className="text-sm text-muted-foreground">Compliant earnings</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                        Above Limits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">
                        {complianceMetrics.above_limit}
                      </div>
                      <p className="text-sm text-muted-foreground">Requires review</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-red-600" />
                        Critical
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {complianceMetrics.critical_limit}
                      </div>
                      <p className="text-sm text-muted-foreground">Immediate attention</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                        Compliance Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {complianceMetrics.compliance_percentage.toFixed(1)}%
                      </div>
                      <Progress value={complianceMetrics.compliance_percentage} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {complianceMetrics && complianceMetrics.critical_limit > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {complianceMetrics.critical_limit} commission earnings exceed IRDAI regulatory caps and require immediate review.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>IRDAI Compliance Dashboard</CardTitle>
                  <CardDescription>Monitor commission rates against regulatory guidelines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed compliance monitoring will be implemented here</p>
                    <p className="text-sm">Track against IRDAI caps by LOB, channel, and policy year</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Commission trends and organizational performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Performance analytics dashboard will be implemented here</p>
                  <p className="text-sm">Track commission trends, top performers, and growth metrics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CommissionEarnings;