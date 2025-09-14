import { useState } from "react";
import { Users, Plus, Search, Edit, Eye, Trash2, Trophy, TrendingUp, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAgents, type Agent } from "@/hooks/useAgents";
import { AgentForm } from "@/components/forms/AgentForm";
import { AgentFormData } from "@/lib/schemas/agentSchema";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { supabase } from "@/integrations/supabase/client";

export default function AdminAgents() {
  const { agents, loading, error, createAgent, updateAgent, deleteAgent } = useAgents();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const getKycStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.phone && agent.phone.includes(searchTerm))
  );

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setIsFormOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsFormOpen(true);
  };

  const handleDeleteAgent = (agent: Agent) => {
    setDeletingAgent(agent);
  };

  const handleFormSubmit = async (data: AgentFormData) => {
    setFormLoading(true);
    try {
      // Add org_id (simulate current org)
      const agentData = { ...data, org_id: 'default-org-id' };
      
      if (editingAgent) {
        const result = await updateAgent(editingAgent.id, agentData);
        if (result.success) {
          toast({ title: "Agent updated successfully" });
          setIsFormOpen(false);
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      } else {
        const result = await createAgent(agentData);
        if (result.success) {
          toast({ title: "Agent created successfully" });
          setIsFormOpen(false);
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAgent) return;
    
    try {
      const result = await deleteAgent(deletingAgent.id);
      if (result.success) {
        toast({ title: "Agent deleted successfully" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setDeletingAgent(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground">
            Manage insurance agents and their performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={handleCreateAgent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : agents.length}</div>
              <p className="text-xs text-muted-foreground">Active agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Trophy className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : agents.filter(a => a.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agent Types</CardTitle>
              <TrendingUp className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : new Set(agents.map(a => a.agent_type).filter(Boolean)).size}
              </div>
              <p className="text-xs text-muted-foreground">Different types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KYC Approved</CardTitle>
              <Users className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : agents.filter(a => a.kyc_status === 'approved').length}
              </div>
              <p className="text-xs text-muted-foreground">Verified agents</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent Directory</CardTitle>
            <CardDescription>
              View and manage insurance agents and their performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading agents...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-destructive">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No agents found. Use bulk upload to add agents.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{agent.agent_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{agent.agent_name}</p>
                            <p className="text-sm text-muted-foreground">{agent.email || 'No email'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.agent_type || 'Not assigned'}</TableCell>
                      <TableCell>
                        <StatusChip 
                          variant={agent.status === 'active' ? 'success' : 'secondary'}
                        >
                          {agent.status}
                        </StatusChip>
                      </TableCell>
                      <TableCell>
                        <StatusChip variant={getKycStatusVariant(agent.kyc_status)}>
                          {agent.kyc_status}
                        </StatusChip>
                      </TableCell>
                      <TableCell>₹{(agent.percentage || 0).toLocaleString()}</TableCell>
                      <TableCell>{new Date(agent.created_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditAgent(agent)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(agent)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Agent Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
              <DialogDescription>
                {editingAgent ? 'Update agent information' : 'Add a new agent to the system'}
              </DialogDescription>
            </DialogHeader>
            <AgentForm
              agent={editingAgent}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingAgent} onOpenChange={() => setDeletingAgent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingAgent?.agent_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <BulkUploadModal
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          title="Agents"
          templateHeaders={[
            'agent_code',
            'agent_name',
            'agent_type',
            'dob',
            'phone',
            'email',
            'gender',
            'address',
            'city',
            'state',
            'pincode',
            'qualification',
            'percentage',
            'status'
          ]}
          requiredFields={['agent_code', 'agent_name']}
          onUpload={handleBulkUpload}
          validateRow={validateAgentRow}
        />
      </div>
    </AdminLayout>
  );

  function validateAgentRow(row: any) {
    const errors: string[] = [];
    
    if (row.status && !['active', 'inactive'].includes(row.status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }
    
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push('Invalid email format');
    }
    
    if (row.phone && !/^\d{10}$/.test(row.phone.replace(/\D/g, ''))) {
      errors.push('Phone must be 10 digits');
    }

    if (row.percentage && (isNaN(row.percentage) || row.percentage < 0 || row.percentage > 100)) {
      errors.push('Percentage must be between 0 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async function handleBulkUpload(data: any[], isUpdate: boolean) {
    try {
      const processedData = data.map(row => ({
        agent_code: row.agent_code,
        agent_name: row.agent_name,
        agent_type: row.agent_type || null,
        dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : null,
        phone: row.phone || null,
        email: row.email || null,
        gender: row.gender || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        pincode: row.pincode || null,
        qualification: row.qualification || null,
        percentage: row.percentage ? parseFloat(row.percentage) : null,
        status: row.status?.toLowerCase() || 'active',
        org_id: 'default-org-id', // Replace with actual org_id
        created_by: 'current-user-id' // Replace with actual user_id
      }));

      let results;
      if (isUpdate) {
        const { data: result, error } = await supabase
          .from('agents')
          .upsert(processedData, {
            onConflict: 'agent_code,org_id',
            ignoreDuplicates: false
          })
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Updated successfully' }));
      } else {
        const { data: result, error } = await supabase
          .from('agents')
          .insert(processedData)
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Inserted successfully' }));
      }

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }
}