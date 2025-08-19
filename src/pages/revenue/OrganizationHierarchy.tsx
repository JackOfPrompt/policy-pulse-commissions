import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Target, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Plus, 
  Download, 
  Upload,
  ChevronRight,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrgUnit {
  org_id: number;
  tenant_id: string;
  parent_org_id?: number;
  org_type: 'tenant' | 'branch' | 'team' | 'agent';
  org_name: string;
  manager_user_id?: string;
  kpi_monthly_target?: number;
  status: 'Active' | 'Inactive';
  level: number;
  children?: OrgUnit[];
  expanded?: boolean;
}

const OrganizationHierarchy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orgTree, setOrgTree] = useState<OrgUnit[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgUnit | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    parent_org_id: '',
    org_type: '',
    org_name: '',
    manager_user_id: '',
    kpi_monthly_target: ''
  });

  useEffect(() => {
    fetchOrgTree();
  }, []);

  const fetchOrgTree = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('tenant-organization', {
        body: { action: 'get_tree' }
      });

      if (error) throw error;
      setOrgTree(data || []);
    } catch (error) {
      console.error('Error fetching org tree:', error);
      toast({
        title: "Error",
        description: "Failed to load organization hierarchy",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.functions.invoke('tenant-organization', {
        body: {
          action: 'create',
          ...formData,
          kpi_monthly_target: formData.kpi_monthly_target ? parseFloat(formData.kpi_monthly_target) : null
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization unit created successfully"
      });

      setIsCreateDialogOpen(false);
      setFormData({
        parent_org_id: '',
        org_type: '',
        org_name: '',
        manager_user_id: '',
        kpi_monthly_target: ''
      });
      fetchOrgTree();
    } catch (error) {
      console.error('Error creating org unit:', error);
      toast({
        title: "Error",
        description: "Failed to create organization unit",
        variant: "destructive"
      });
    }
  };

  const toggleExpanded = (orgId: number) => {
    const updateExpanded = (units: OrgUnit[]): OrgUnit[] => {
      return units.map(unit => {
        if (unit.org_id === orgId) {
          return { ...unit, expanded: !unit.expanded };
        }
        if (unit.children) {
          return { ...unit, children: updateExpanded(unit.children) };
        }
        return unit;
      });
    };
    setOrgTree(updateExpanded(orgTree));
  };

  const renderOrgNode = (unit: OrgUnit, depth = 0) => {
    const hasChildren = unit.children && unit.children.length > 0;
    const paddingLeft = depth * 24;

    return (
      <div key={unit.org_id} className="border border-border/50 rounded-lg mb-2">
        <div 
          className={`p-4 cursor-pointer hover:bg-accent/50 flex items-center justify-between ${
            selectedOrg?.org_id === unit.org_id ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 16}px` }}
          onClick={() => setSelectedOrg(unit)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <GripVertical className="w-4 h-4 text-muted-foreground mr-2" />
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(unit.org_id);
                  }}
                  className="p-0 h-auto w-auto mr-2"
                >
                  {unit.expanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                unit.org_type === 'tenant' ? 'bg-blue-600' :
                unit.org_type === 'branch' ? 'bg-green-600' :
                unit.org_type === 'team' ? 'bg-purple-600' : 'bg-orange-600'
              }`} />
              <span className="font-medium">{unit.org_name}</span>
              <Badge variant="outline">{unit.org_type}</Badge>
              <Badge variant={unit.status === 'Active' ? 'default' : 'secondary'}>
                {unit.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {unit.kpi_monthly_target && (
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                ₹{unit.kpi_monthly_target.toLocaleString()}
              </div>
            )}
            <Button variant="ghost" size="sm">
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {hasChildren && unit.expanded && (
          <div className="border-t border-border/50">
            {unit.children!.map(child => renderOrgNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
        <header className="bg-card border-b border-border/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <BackButton />
              <div className="ml-4">
                <h1 className="text-xl font-bold text-primary flex items-center">
                  <Building2 className="w-6 h-6 mr-2" />
                  Organization Hierarchy
                </h1>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading organization hierarchy...</div>
        </main>
      </div>
    );
  }

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
                  <Building2 className="w-6 h-6 mr-2" />
                  Organization Hierarchy
                </h1>
                <p className="text-sm text-muted-foreground">Manage revenue-traceable organizational structure</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Organization Unit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Organization Unit</DialogTitle>
                    <DialogDescription>
                      Add a new organizational unit to the hierarchy
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div>
                      <Label htmlFor="parent_org_id">Parent Organization</Label>
                      <Select onValueChange={(value) => setFormData({...formData, parent_org_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent organization" />
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">None (Root Level)</SelectItem>
                          {/* Add org options here */}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="org_type">Organization Type</Label>
                      <Select onValueChange={(value) => setFormData({...formData, org_type: value})} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="branch">Branch</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="org_name">Organization Name</Label>
                      <Input 
                        id="org_name"
                        value={formData.org_name}
                        onChange={(e) => setFormData({...formData, org_name: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="kpi_monthly_target">Monthly Target (₹)</Label>
                      <Input 
                        id="kpi_monthly_target"
                        type="number"
                        value={formData.kpi_monthly_target}
                        onChange={(e) => setFormData({...formData, kpi_monthly_target: e.target.value})}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create</Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Organization Tree */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Organization Tree
                </CardTitle>
                <CardDescription>
                  Drag and drop to reorder organizational units
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orgTree.map(unit => renderOrgNode(unit))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {selectedOrg ? 'Organization Details' : 'Select Organization'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrg ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-lg font-semibold">{selectedOrg.org_name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Type</Label>
                      <Badge variant="outline" className="ml-2">{selectedOrg.org_type}</Badge>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant={selectedOrg.status === 'Active' ? 'default' : 'secondary'} className="ml-2">
                        {selectedOrg.status}
                      </Badge>
                    </div>

                    {selectedOrg.kpi_monthly_target && (
                      <div>
                        <Label className="text-sm font-medium">Monthly Target</Label>
                        <div className="flex items-center mt-1">
                          <Target className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-lg font-semibold">₹{selectedOrg.kpi_monthly_target.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4">
                      <Button size="sm" className="flex-1">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Performance
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select an organization unit to view details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizationHierarchy;