import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Agent, useAgents } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, User, Mail, Phone, Calendar } from 'lucide-react';

interface AgentDetailModalProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AgentDetailModal = ({ agent, open, onOpenChange, onSuccess }: AgentDetailModalProps) => {
  const { getAgentDetail, submitExam } = useAgents();
  const { toast } = useToast();
  
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [examScore, setExamScore] = useState('');
  const [submittingExam, setSubmittingExam] = useState(false);

  useEffect(() => {
    if (open && agent) {
      loadAgentDetail();
    }
  }, [open, agent]);

  const loadAgentDetail = async () => {
    try {
      setLoading(true);
      const response = await getAgentDetail(agent.agent_id);
      if (response?.success) {
        setDetailData(response.data);
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

  const handleExamSubmit = async () => {
    const score = parseInt(examScore);
    if (!examScore || score < 0 || score > 100) {
      toast({
        title: "Error",
        description: "Please enter a valid score between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingExam(true);
      await submitExam(agent.agent_id, {
        score,
        status: score >= 70 ? 'PASSED' : 'FAILED' // Assuming 70% is pass mark
      });

      toast({
        title: "Success",
        description: `Exam submitted. Score: ${score}% (${score >= 70 ? 'Passed' : 'Failed'})`,
      });

      setExamScore('');
      onSuccess();
      loadAgentDetail();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit exam result",
        variant: "destructive",
      });
    } finally {
      setSubmittingExam(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agent Details - {agent.full_name}
          </DialogTitle>
          <DialogDescription>
            View detailed information and manage agent status
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Agent ID</Label>
                    <p className="text-sm text-muted-foreground">{agent.agent_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Agent Type</Label>
                    <p className="text-sm text-muted-foreground">
                      <Badge variant="outline">{agent.agent_type}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm text-muted-foreground">{agent.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm text-muted-foreground">{getStatusBadge(agent.status)}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{agent.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-muted-foreground">{agent.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Created At</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(agent.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam Information (for POSP) */}
            {agent.agent_type === 'POSP' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Exam Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailData?.exam ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Exam Status</Label>
                          <p className="text-sm text-muted-foreground">
                            <Badge variant={detailData.exam.status === 'PASSED' ? 'default' : 'destructive'}>
                              {detailData.exam.status}
                            </Badge>
                          </p>
                        </div>
                        {detailData.exam.score && (
                          <div>
                            <Label className="text-sm font-medium">Score</Label>
                            <p className="text-sm text-muted-foreground">{detailData.exam.score}%</p>
                          </div>
                        )}
                      </div>
                      {detailData.exam.exam_date && (
                        <div>
                          <Label className="text-sm font-medium">Exam Date</Label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(detailData.exam.exam_date).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : agent.status === 'EXAM_PENDING' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">No exam record found. Submit exam result:</p>
                      <div className="flex gap-3">
                        <Input
                          type="number"
                          placeholder="Enter score (0-100)"
                          value={examScore}
                          onChange={(e) => setExamScore(e.target.value)}
                          min="0"
                          max="100"
                        />
                        <Button onClick={handleExamSubmit} disabled={submittingExam}>
                          {submittingExam ? 'Submitting...' : 'Submit Result'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Exam not assigned yet</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Approval History */}
            {detailData?.approvals && detailData.approvals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Approval History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {detailData.approvals.map((approval: any, index: number) => (
                      <div key={approval.approval_id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant={approval.decision === 'APPROVED' ? 'default' : 
                              approval.decision === 'REJECTED' ? 'destructive' : 'secondary'}>
                              {approval.decision}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Level {approval.level} • {new Date(approval.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {approval.comments && (
                          <p className="text-sm mt-2 text-muted-foreground">{approval.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};