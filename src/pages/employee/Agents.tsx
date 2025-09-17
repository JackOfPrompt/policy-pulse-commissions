import { useState } from "react";
import { Search, Eye, Filter, Plus, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AgentProfileModal } from "@/components/agents/AgentProfileModal";
import { useAgents, Agent } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import users from "@/data/users.json";

export default function EmployeeAgents() {
  const user = users.employee;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const { agents, loading, createAgent, updateAgent } = useAgents();

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || agent.kyc_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setProfileModalOpen(true);
  };

  const handleCreateAgent = () => {
    setEditingAgent(undefined);
    setProfileModalOpen(true);
  };

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setViewDialogOpen(true);
  };

  const handleSaveAgent = async (agentData: Partial<Agent>) => {
    if (editingAgent) {
      return await updateAgent(editingAgent.id, agentData);
    } else {
      // Get first organization for new agents (in real app, this should be user's org)
      const orgData = await supabase.from('organizations').select('id').limit(1).single();
      if (orgData.data) {
        agentData.org_id = orgData.data.id;
      }
      return await createAgent(agentData);
    }
  };

  return (
    <DashboardLayout role="employee" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agent Management</h1>
            <p className="text-muted-foreground">
              Manage agents and their KYC documentation
            </p>
          </div>
          <Button onClick={handleCreateAgent} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Agent
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent List</CardTitle>
            <CardDescription>
              View and manage all agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading agents...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.agent_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agent.agent_type}</Badge>
                      </TableCell>
                      <TableCell>{agent.email || 'N/A'}</TableCell>
                      <TableCell>{agent.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <StatusChip
                          variant={
                            agent.kyc_status === 'approved' ? 'success' :
                            agent.kyc_status === 'pending' ? 'warning' : 'destructive'
                          }
                        >
                          {agent.kyc_status}
                        </StatusChip>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          variant={
                            agent.status === 'active' ? 'success' :
                            agent.status === 'suspended' ? 'destructive' : 'secondary'
                          }
                        >
                          {agent.status}
                        </StatusChip>
                      </TableCell>
                      <TableCell>
                        {new Date(agent.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAgent(agent)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAgent(agent)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AgentProfileModal
          agent={editingAgent}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          onSave={handleSaveAgent}
        />

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedAgent?.agent_name}</DialogTitle>
              <DialogDescription>
                Agent profile and details
              </DialogDescription>
            </DialogHeader>
            {selectedAgent && (
              <Tabs defaultValue="profile" className="mt-4">
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Agent Type</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.agent_type}</p>
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.dob ? new Date(selectedAgent.dob).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label>Qualification</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.qualification || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>KYC Status</Label>
                      <StatusChip
                        variant={
                          selectedAgent.kyc_status === 'approved' ? 'success' :
                          selectedAgent.kyc_status === 'pending' ? 'warning' : 'destructive'
                        }
                      >
                        {selectedAgent.kyc_status}
                      </StatusChip>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <StatusChip
                        variant={
                          selectedAgent.status === 'active' ? 'success' :
                          selectedAgent.status === 'suspended' ? 'destructive' : 'secondary'
                        }
                      >
                        {selectedAgent.status}
                      </StatusChip>
                    </div>
                    <div className="col-span-2">
                      <Label>Reference</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.reference || 'N/A'}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>SMS Permissions</Label>
                      <Badge variant={selectedAgent.mobilepermissions ? 'default' : 'secondary'}>
                        {selectedAgent.mobilepermissions ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Email Permissions</Label>
                      <Badge variant={selectedAgent.emailpermissions ? 'default' : 'secondary'}>
                        {selectedAgent.emailpermissions ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Label>Address</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.address || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>City</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.city || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>State</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.state || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Pincode</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.pincode || 'N/A'}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>PAN Card</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.pan_card || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Aadhaar Card</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.aadhar_card || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>PAN Document</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.pan_url ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                    <div>
                      <Label>Aadhaar Document</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.aadhar_url ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                    <div>
                      <Label>Degree Certificate</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.degree_doc_url ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                    <div>
                      <Label>Cancelled Cheque</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.cheque_doc_url ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="bank" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Holder Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.account_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Bank Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.account_number ? '****' + selectedAgent.account_number.slice(-4) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label>IFSC Code</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.ifsc_code || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <p className="text-sm text-muted-foreground capitalize">{selectedAgent.account_type || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Commission Percentage</Label>
                      <p className="text-sm text-muted-foreground">{selectedAgent.base_percentage || 0}%</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}