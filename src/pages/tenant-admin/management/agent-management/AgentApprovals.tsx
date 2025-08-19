import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAgents, type Agent } from '@/hooks/useAgents';
import { ApprovalModal } from '@/components/ApprovalModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const AgentApprovals = () => {
  const { agents, loading, fetchAgents } = useAgents();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    loadPendingAgents();
  }, []);

  const loadPendingAgents = async () => {
    try {
      await fetchAgents({ status: 'PENDING' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pending agents",
        variant: "destructive",
      });
    }
  };

  const handleApproval = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowApprovalModal(true);
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

  const pendingAgents = agents.filter(agent => 
    agent.status === 'PENDING' || agent.status === 'EXAM_PASSED'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/tenant-admin-dashboard/management/agent-management')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agent List
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Agent Approvals</h1>
          <p className="text-muted-foreground">Review and approve pending agent applications</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            {pendingAgents.length} agent{pendingAgents.length !== 1 ? 's' : ''} awaiting approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading pending agents...</div>
          ) : pendingAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agents pending approval
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAgents.map((agent) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell className="font-medium">{agent.agent_id}</TableCell>
                      <TableCell>{agent.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agent.agent_type}</Badge>
                      </TableCell>
                      <TableCell>{agent.email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(agent.status)}</TableCell>
                      <TableCell>{new Date(agent.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tenant-admin-dashboard/management/agent-management/details/${agent.agent_id}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproval(agent)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAgent && (
        <ApprovalModal
          agent={selectedAgent}
          open={showApprovalModal}
          onOpenChange={setShowApprovalModal}
          onSuccess={loadPendingAgents}
        />
      )}
    </div>
  );
};