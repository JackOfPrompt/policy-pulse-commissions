import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, CheckCircle, MoreHorizontal, Phone, Mail } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAgents, type Agent } from '@/hooks/useAgents';
import { CreateAgentModal } from '@/components/CreateAgentModal';
import { AgentDetailModal } from '@/components/AgentDetailModal';
import { ApprovalModal } from '@/components/ApprovalModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ListView, GridView, KanbanView, ViewToggle, useViewMode } from '@/components/ui/list-views';

export const AgentList = () => {
  const { agents, loading, fetchAgents } = useAgents();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useViewMode({ defaultView: 'list', storageKey: 'agents-view' });
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    loadAgents();
  }, [activeTab, statusFilter, typeFilter, searchTerm]);

  const loadAgents = async () => {
    try {
      const filters: any = {};
      
      if (activeTab !== 'all') {
        if (activeTab === 'pending') filters.status = 'PENDING';
        else if (activeTab === 'approved') filters.status = 'APPROVED';
        else if (activeTab === 'posp') filters.agent_type = 'POSP';
        else if (activeTab === 'misp') filters.agent_type = 'MISP';
      }
      
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.agent_type = typeFilter;
      if (searchTerm) filters.search = searchTerm;

      await fetchAgents(filters);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'EXAM_PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Exam Pending</Badge>;
      case 'EXAM_PASSED':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Exam Passed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewAgent = (agent: Agent) => {
    navigate(`/tenant-admin-dashboard/management/agent-management/details/${agent.agent_id}`);
  };

  const handleApproveReject = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowApprovalModal(true);
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = searchTerm === '' || 
      agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agent_id.toString().includes(searchTerm);
    
    return matchesSearch;
  });

  // Status configuration for Kanban view
  const statusConfig = {
    PENDING: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100 text-yellow-800' },
    EXAM_PENDING: { label: 'Exam Pending', color: 'text-orange-600', bgColor: 'bg-orange-100 text-orange-800' },
    EXAM_PASSED: { label: 'Exam Passed', color: 'text-blue-600', bgColor: 'bg-blue-100 text-blue-800' },
    APPROVED: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100 text-red-800' }
  };

  // List view columns configuration
  const listColumns = [
    { key: 'agent_id', header: 'Agent ID', className: 'font-medium' },
    { 
      key: 'full_name', 
      header: 'Name', 
      render: (agent: Agent) => agent.full_name 
    },
    { 
      key: 'agent_type', 
      header: 'Type', 
      render: (agent: Agent) => <Badge variant="outline">{agent.agent_type}</Badge>
    },
    { key: 'email', header: 'Email', render: (agent: Agent) => agent.email || '-' },
    { key: 'phone', header: 'Phone', render: (agent: Agent) => agent.phone || '-' },
    { 
      key: 'status', 
      header: 'Status', 
      render: (agent: Agent) => getStatusBadge(agent.status)
    },
    { 
      key: 'created_at', 
      header: 'Created At', 
      render: (agent: Agent) => new Date(agent.created_at).toLocaleDateString()
    }
  ];

  // Grid/Card render function
  const renderAgentCard = (agent: Agent, actions?: React.ReactNode) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{agent.full_name}</CardTitle>
            <CardDescription>ID: {agent.agent_id}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{agent.agent_type}</Badge>
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {agent.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {agent.email}
            </div>
          )}
          {agent.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {agent.phone}
            </div>
          )}
          <div className="flex items-center justify-between">
            {getStatusBadge(agent.status)}
            <span className="text-xs text-muted-foreground">
              {new Date(agent.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Actions component
  const renderActions = (agent: Agent) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
        <DropdownMenuItem onClick={() => handleViewAgent(agent)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        {(agent.status === 'PENDING' || agent.status === 'EXAM_PASSED') && (
          <DropdownMenuItem onClick={() => handleApproveReject(agent)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve/Reject
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">Manage POSP and MISP agents</p>
        </div>
        <Button onClick={() => navigate('/tenant-admin-dashboard/management/agent-management/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>View and manage all agents in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Agents</TabsTrigger>
              <TabsTrigger value="posp">POSP</TabsTrigger>
              <TabsTrigger value="misp">MISP</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search agents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="EXAM_PENDING">Exam Pending</SelectItem>
                      <SelectItem value="EXAM_PASSED">Exam Passed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="POSP">POSP</SelectItem>
                      <SelectItem value="MISP">MISP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </div>

            <TabsContent value={activeTab}>
              {viewMode === 'list' && (
                <ListView
                  data={filteredAgents}
                  columns={listColumns}
                  loading={loading}
                  onItemClick={handleViewAgent}
                  actions={renderActions}
                  className="border rounded-lg"
                />
              )}

              {(viewMode === 'grid-small' || viewMode === 'grid-medium' || viewMode === 'grid-large') && (
                <GridView
                  data={filteredAgents}
                  loading={loading}
                  onItemClick={handleViewAgent}
                  renderCard={renderAgentCard}
                  actions={renderActions}
                  viewMode={viewMode}
                />
              )}

              {viewMode === 'kanban' && (
                <KanbanView
                  data={filteredAgents}
                  loading={loading}
                  onItemClick={handleViewAgent}
                  renderCard={renderAgentCard}
                  actions={renderActions}
                  getItemStatus={(agent) => agent.status}
                  statusConfig={statusConfig}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateAgentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={loadAgents}
      />

      {selectedAgent && (
        <>
          <AgentDetailModal
            agent={selectedAgent}
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
            onSuccess={loadAgents}
          />
          <ApprovalModal
            agent={selectedAgent}
            open={showApprovalModal}
            onOpenChange={setShowApprovalModal}
            onSuccess={loadAgents}
          />
        </>
      )}
    </div>
  );
};