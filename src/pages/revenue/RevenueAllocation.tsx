import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  Settings,
  Calendar,
  Target,
  Percent,
  AlertCircle
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AllocationRule {
  rule_id: number;
  tenant_id: number;
  scope_level: 'tenant' | 'org' | 'product' | 'lob';
  scope_ref?: number;
  effective_from: string;
  effective_to?: string;
  splits: {
    tenant_percent: number;
    branch_percent: number;
    team_percent: number;
    agent_percent: number;
    partner_percent?: number;
  };
  priority?: number;
  status: 'Active' | 'Inactive' | 'Draft';
}

interface AllocationPreview {
  earning_id: number;
  policy_number: string;
  total_commission: number;
  allocations: {
    org_id: number;
    org_name: string;
    org_type: string;
    allocated_amount: number;
    percentage: number;
  }[];
}

const RevenueAllocation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allocationRules, setAllocationRules] = useState<AllocationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AllocationRule | null>(null);
  const [allocationPreview, setAllocationPreview] = useState<AllocationPreview | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules');

  const [formData, setFormData] = useState({
    scope_level: '',
    scope_ref: '',
    effective_from: '',
    effective_to: '',
    tenant_percent: '',
    branch_percent: '',
    team_percent: '',
    agent_percent: '',
    partner_percent: '',
    priority: ''
  });

  const [previewEarningId, setPreviewEarningId] = useState('');

  useEffect(() => {
    fetchAllocationRules();
  }, []);

  const fetchAllocationRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('revenue-allocation', {
        body: { action: 'list_rules' }
      });

      if (error) throw error;
      setAllocationRules(data || []);
    } catch (error) {
      console.error('Error fetching allocation rules:', error);
      toast({
        title: "Error",
        description: "Failed to load allocation rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate percentages sum to 100
    const totalPercent = 
      parseFloat(formData.tenant_percent || '0') +
      parseFloat(formData.branch_percent || '0') +
      parseFloat(formData.team_percent || '0') +
      parseFloat(formData.agent_percent || '0') +
      parseFloat(formData.partner_percent || '0');

    if (totalPercent !== 100) {
      toast({
        title: "Validation Error",
        description: "Allocation percentages must sum to 100%",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('revenue-allocation', {
        body: {
          action: 'create_rule',
          scope_level: formData.scope_level,
          scope_ref: formData.scope_ref ? parseInt(formData.scope_ref) : null,
          effective_from: formData.effective_from,
          effective_to: formData.effective_to || null,
          splits: {
            tenant_percent: parseFloat(formData.tenant_percent || '0'),
            branch_percent: parseFloat(formData.branch_percent || '0'),
            team_percent: parseFloat(formData.team_percent || '0'),
            agent_percent: parseFloat(formData.agent_percent || '0'),
            partner_percent: parseFloat(formData.partner_percent || '0')
          },
          priority: formData.priority ? parseInt(formData.priority) : null
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Allocation rule created successfully"
      });

      setIsCreateDialogOpen(false);
      setFormData({
        scope_level: '',
        scope_ref: '',
        effective_from: '',
        effective_to: '',
        tenant_percent: '',
        branch_percent: '',
        team_percent: '',
        agent_percent: '',
        partner_percent: '',
        priority: ''
      });
      fetchAllocationRules();
    } catch (error) {
      console.error('Error creating allocation rule:', error);
      toast({
        title: "Error",
        description: "Failed to create allocation rule",
        variant: "destructive"
      });
    }
  };

  const handlePreviewAllocation = async () => {
    if (!previewEarningId) {
      toast({
        title: "Validation Error",
        description: "Please enter an earning ID for preview",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('revenue-allocation', {
        body: { 
          action: 'preview', 
          earning_id: parseInt(previewEarningId)
        }
      });

      if (error) throw error;
      
      setAllocationPreview(data);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate allocation preview",
        variant: "destructive"
      });
    }
  };

  const handleApplyAllocation = async (earningId: number) => {
    try {
      const { error } = await supabase.functions.invoke('revenue-allocation', {
        body: { 
          action: 'apply', 
          earning_id: earningId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Revenue allocation applied successfully"
      });

      setIsPreviewDialogOpen(false);
    } catch (error) {
      console.error('Error applying allocation:', error);
      toast({
        title: "Error",
        description: "Failed to apply revenue allocation",
        variant: "destructive"
      });
    }
  };

  const getScopeLabel = (level: string, ref?: number) => {
    switch (level) {
      case 'tenant':
        return 'Tenant-wide';
      case 'org':
        return `Organization #${ref}`;
      case 'product':
        return `Product #${ref}`;
      case 'lob':
        return `LOB #${ref}`;
      default:
        return level;
    }
  };

  const renderSplitsChart = (splits: AllocationRule['splits']) => {
    const data = [
      { name: 'Tenant', value: splits.tenant_percent, color: 'bg-blue-600' },
      { name: 'Branch', value: splits.branch_percent, color: 'bg-green-600' },
      { name: 'Team', value: splits.team_percent, color: 'bg-purple-600' },
      { name: 'Agent', value: splits.agent_percent, color: 'bg-orange-600' },
      { name: 'Partner', value: splits.partner_percent || 0, color: 'bg-red-600' }
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm">{item.name}</span>
            </div>
            <span className="text-sm font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    );
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
                  <PieChart className="w-6 h-6 mr-2" />
                  Revenue Allocation
                </h1>
                <p className="text-sm text-muted-foreground">Manage revenue sharing across organizational levels</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 border-r pr-4 mr-2">
                <Input
                  placeholder="Earning ID"
                  value={previewEarningId}
                  onChange={(e) => setPreviewEarningId(e.target.value)}
                  className="w-32"
                />
                <Button variant="outline" size="sm" onClick={handlePreviewAllocation}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Allocation Rule</DialogTitle>
                    <DialogDescription>
                      Define how commission should be split across organizational levels
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRule} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="scope_level">Scope Level</Label>
                        <Select onValueChange={(value) => setFormData({...formData, scope_level: value})} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tenant">Tenant-wide</SelectItem>
                            <SelectItem value="org">Organization</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="lob">Line of Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="scope_ref">Scope Reference ID</Label>
                        <Input 
                          id="scope_ref"
                          value={formData.scope_ref}
                          onChange={(e) => setFormData({...formData, scope_ref: e.target.value})}
                          placeholder="Optional for tenant-wide"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="effective_from">Effective From</Label>
                        <Input 
                          id="effective_from"
                          type="date"
                          value={formData.effective_from}
                          onChange={(e) => setFormData({...formData, effective_from: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="effective_to">Effective To</Label>
                        <Input 
                          id="effective_to"
                          type="date"
                          value={formData.effective_to}
                          onChange={(e) => setFormData({...formData, effective_to: e.target.value})}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Revenue Split Percentages</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="tenant_percent">Tenant %</Label>
                          <Input 
                            id="tenant_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.tenant_percent}
                            onChange={(e) => setFormData({...formData, tenant_percent: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="branch_percent">Branch %</Label>
                          <Input 
                            id="branch_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.branch_percent}
                            onChange={(e) => setFormData({...formData, branch_percent: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="team_percent">Team %</Label>
                          <Input 
                            id="team_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.team_percent}
                            onChange={(e) => setFormData({...formData, team_percent: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="agent_percent">Agent %</Label>
                          <Input 
                            id="agent_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.agent_percent}
                            onChange={(e) => setFormData({...formData, agent_percent: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="partner_percent">Partner %</Label>
                          <Input 
                            id="partner_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.partner_percent}
                            onChange={(e) => setFormData({...formData, partner_percent: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Input 
                            id="priority"
                            type="number"
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                            placeholder="1"
                          />
                        </div>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          All percentages must sum to exactly 100%
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Rule</Button>
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
            <TabsTrigger value="rules">Allocation Rules</TabsTrigger>
            <TabsTrigger value="matrix">Split Matrix</TabsTrigger>
            <TabsTrigger value="performance">Performance View</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle>Allocation Rules</CardTitle>
                <CardDescription>Manage revenue sharing rules by scope and priority</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scope</TableHead>
                      <TableHead>Effective Period</TableHead>
                      <TableHead>Tenant %</TableHead>
                      <TableHead>Branch %</TableHead>
                      <TableHead>Team %</TableHead>
                      <TableHead>Agent %</TableHead>
                      <TableHead>Partner %</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocationRules.map((rule) => (
                      <TableRow key={rule.rule_id}>
                        <TableCell className="font-medium">
                          {getScopeLabel(rule.scope_level, rule.scope_ref)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(rule.effective_from).toLocaleDateString()}
                            {rule.effective_to && ` - ${new Date(rule.effective_to).toLocaleDateString()}`}
                          </div>
                        </TableCell>
                        <TableCell>{rule.splits.tenant_percent}%</TableCell>
                        <TableCell>{rule.splits.branch_percent}%</TableCell>
                        <TableCell>{rule.splits.team_percent}%</TableCell>
                        <TableCell>{rule.splits.agent_percent}%</TableCell>
                        <TableCell>{rule.splits.partner_percent || 0}%</TableCell>
                        <TableCell>{rule.priority || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                            {rule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
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

          <TabsContent value="matrix">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allocationRules.filter(rule => rule.status === 'Active').map((rule) => (
                <Card key={rule.rule_id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Percent className="w-5 h-5 mr-2" />
                      {getScopeLabel(rule.scope_level, rule.scope_ref)}
                    </CardTitle>
                    <CardDescription>
                      Effective: {new Date(rule.effective_from).toLocaleDateString()}
                      {rule.effective_to && ` - ${new Date(rule.effective_to).toLocaleDateString()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderSplitsChart(rule.splits)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance View</CardTitle>
                <CardDescription>Track allocated amounts by organization and time period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Performance analytics will be implemented here</p>
                  <p className="text-sm">Track allocated revenue by org unit and time period</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Allocation Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Revenue Allocation Preview</DialogTitle>
              <DialogDescription>
                Preview allocation for {allocationPreview?.policy_number}
              </DialogDescription>
            </DialogHeader>
            
            {allocationPreview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Total Commission</Label>
                    <div className="text-2xl font-bold">₹{allocationPreview.total_commission.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Policy</Label>
                    <div className="text-lg font-semibold">{allocationPreview.policy_number}</div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocationPreview.allocations.map((allocation, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{allocation.org_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{allocation.org_type}</Badge>
                        </TableCell>
                        <TableCell>{allocation.percentage}%</TableCell>
                        <TableCell className="font-semibold">₹{allocation.allocated_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleApplyAllocation(allocationPreview.earning_id)}>
                    Apply Allocation
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default RevenueAllocation;