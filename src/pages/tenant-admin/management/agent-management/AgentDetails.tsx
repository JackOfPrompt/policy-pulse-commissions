import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useAgents, type Agent } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

export const AgentDetails = () => {
  const { getAgentDetail } = useAgents();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentDetails();
  }, [agentId]);

  const loadAgentDetails = async () => {
    if (!agentId) return;
    
    try {
      setLoading(true);
      const response = await getAgentDetail(parseInt(agentId));
      if (response?.success) {
        setAgent(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load agent details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (loading) {
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
        </div>
        <div className="text-center">Loading agent details...</div>
      </div>
    );
  }

  if (!agent) {
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
        </div>
        <div className="text-center">Agent not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold">Agent Details</h1>
            <p className="text-muted-foreground">Agent ID: {agent.agent_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Agent
          </Button>
          {(agent.status === 'PENDING' || agent.status === 'EXAM_PASSED') && (
            <Button onClick={() => navigate('/tenant-admin-dashboard/management/agent-management/approvals')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Process Approval
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Agent's personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-lg font-medium">{agent.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Agent Type</label>
              <div className="mt-1">
                <Badge variant="outline">{agent.agent_type}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{agent.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p>{agent.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                {getStatusBadge(agent.status)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Creation and update details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p>{new Date(agent.created_at).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Updated At</label>
              <p>{new Date(agent.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created By</label>
              <p>{agent.created_by || 'System'}</p>
            </div>
          </CardContent>
        </Card>

        {agent.exam && (
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
              <CardDescription>Agent's exam status and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Exam Status</label>
                <div className="mt-1">
                  <Badge variant="outline">{agent.exam.status}</Badge>
                </div>
              </div>
              {agent.exam.exam_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Exam Date</label>
                  <p>{new Date(agent.exam.exam_date).toLocaleDateString()}</p>
                </div>
              )}
              {agent.exam.score && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Score</label>
                  <p>{agent.exam.score}%</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {agent.approvals && agent.approvals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
              <CardDescription>Agent's approval workflow status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agent.approvals.map((approval) => (
                  <div key={approval.approval_id} className="border-l-2 border-muted pl-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Level {approval.level}</span>
                      <Badge variant="outline">{approval.decision}</Badge>
                    </div>
                    {approval.decision_date && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(approval.decision_date).toLocaleDateString()}
                      </p>
                    )}
                    {approval.comments && (
                      <p className="text-sm mt-1">{approval.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};