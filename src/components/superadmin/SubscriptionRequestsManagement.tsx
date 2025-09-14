import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useSubscriptionRequests } from '@/hooks/useSubscriptionRequests';
import { toast } from 'sonner';

export default function SubscriptionRequestsManagement() {
  const { requests, loading, reviewRequest } = useSubscriptionRequests();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const filteredRequests = requests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  const handleApprove = async (requestId: string) => {
    const success = await reviewRequest(requestId, 'approved');
    if (success) {
      toast.success('Request approved and subscription updated');
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await reviewRequest(requestId, 'rejected');
    if (success) {
      toast.success('Request rejected');
    }
  };

  const downloadFile = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return <div>Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subscription Upgrade Requests</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{requests.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {requests.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.organization?.name}
                  </TableCell>
                  <TableCell>{request.current_plan?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.requested_plan?.name}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Request Details</DialogTitle>
                            <DialogDescription>
                              Upgrade request from {selectedRequest?.organization?.name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Current Plan</label>
                                  <p>{selectedRequest.current_plan?.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Requested Plan</label>
                                  <p>{selectedRequest.requested_plan?.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <div>{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Created By</label>
                                  <p>{selectedRequest.creator?.full_name}</p>
                                </div>
                              </div>

                              {selectedRequest.justification && (
                                <div>
                                  <label className="text-sm font-medium">Justification</label>
                                  <div className="mt-1 p-3 bg-muted rounded">
                                    {selectedRequest.justification}
                                  </div>
                                </div>
                              )}

                              {selectedRequest.attachment_urls?.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium">Attachments</label>
                                  <div className="mt-1 space-y-2">
                                    {selectedRequest.attachment_urls.map((url: string, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                        <span className="text-sm">Attachment {index + 1}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => downloadFile(url, `attachment-${index + 1}`)}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {selectedRequest.status === 'pending' && (
                                <div className="flex gap-2 pt-4 border-t">
                                  <Button
                                    onClick={() => handleApprove(selectedRequest.id)}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleReject(selectedRequest.id)}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}