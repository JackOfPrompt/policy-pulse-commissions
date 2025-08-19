import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { type Agent, useAgents } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalModalProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ApprovalModal = ({ agent, open, onOpenChange, onSuccess }: ApprovalModalProps) => {
  const { processApproval } = useAgents();
  const { toast } = useToast();
  
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApproval = async (decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !comments.trim()) {
      toast({
        title: "Error",
        description: "Please provide comments for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await processApproval(agent.agent_id, {
        approver_id: '00000000-0000-0000-0000-000000000001', // TODO: Get from auth context
        decision,
        comments: comments.trim() || undefined,
        level: 1, // TODO: Implement proper approval levels
      });

      toast({
        title: "Success",
        description: `Agent ${decision.toLowerCase()} successfully`,
      });

      setComments('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${decision.toLowerCase()} agent`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canApprove = agent.status === 'PENDING' || 
    (agent.agent_type === 'POSP' && agent.status === 'EXAM_PASSED');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Agent Approval
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject the agent application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Agent Information Summary */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Agent Name:</span>
                <span>{agent.full_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Agent Type:</span>
                <Badge variant="outline">{agent.agent_type}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Current Status:</span>
                <Badge variant={agent.status === 'EXAM_PASSED' ? 'default' : 'secondary'}>
                  {agent.status.replace('_', ' ')}
                </Badge>
              </div>
              {agent.email && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{agent.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Check Messages */}
          {agent.agent_type === 'POSP' && agent.status !== 'EXAM_PASSED' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                POSP agents must pass the exam before approval.
              </p>
            </div>
          )}

          {canApprove && (
            <>
              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments about the approval/rejection..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproval('REJECTED')}
                  disabled={loading}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleApproval('APPROVED')}
                  disabled={loading}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </>
          )}

          {!canApprove && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600 text-center">
                This agent cannot be approved in its current status.
              </p>
              <div className="flex justify-center mt-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};