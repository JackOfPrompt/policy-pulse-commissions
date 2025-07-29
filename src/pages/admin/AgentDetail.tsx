import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Download, FileText, UserX, UserCheck, Package, DollarSign, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AgentForm } from "@/components/admin/AgentForm";
import { format } from "date-fns";

interface Agent {
  id: string;
  name: string;
  agent_code: string;
  agent_type: 'POSP' | 'MISP';
  phone: string;
  email: string;
  pan_number: string;
  aadhar_number: string;
  status: string;
  irdai_certified: boolean;
  irdai_cert_number: string;
  joining_date: string;
  branch_id: string;
  pan_file_path: string;
  aadhar_file_path: string;
  irdai_file_path: string;
  branches: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Document {
  name: string;
  type: string;
  path: string;
}

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAgent();
    }
  }, [id]);

  const fetchAgent = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          branches (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      const agentData = data as Agent;
      setAgent(agentData);

      // Prepare documents list
      const docs: Document[] = [];
      if (agentData.pan_file_path) {
        docs.push({ name: 'PAN Card', type: 'PAN', path: agentData.pan_file_path });
      }
      if (agentData.aadhar_file_path) {
        docs.push({ name: 'Aadhar Card', type: 'Aadhar', path: agentData.aadhar_file_path });
      }
      if (agentData.irdai_file_path) {
        docs.push({ name: 'IRDAI Certificate', type: 'IRDAI', path: agentData.irdai_file_path });
      }
      setDocuments(docs);
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agent details",
        variant: "destructive"
      });
      navigate('/admin/agents');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (docPath: string, docName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('agent-documents')
        .download(docPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agent?.name}-${docName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const handleSuspend = async () => {
    if (!agent) return;

    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'Suspended' })
        .eq('id', agent.id);

      if (error) throw error;

      setAgent({ ...agent, status: 'Suspended' });
      toast({
        title: "Success",
        description: "Agent has been suspended"
      });
    } catch (error: any) {
      console.error('Error suspending agent:', error);
      toast({
        title: "Error",
        description: "Failed to suspend agent",
        variant: "destructive"
      });
    }
  };

  const handleTerminate = async () => {
    if (!agent) return;

    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'Terminated' })
        .eq('id', agent.id);

      if (error) throw error;

      setAgent({ ...agent, status: 'Terminated' });
      toast({
        title: "Success",
        description: "Agent has been terminated"
      });
    } catch (error: any) {
      console.error('Error terminating agent:', error);
      toast({
        title: "Error",
        description: "Failed to terminate agent",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    fetchAgent();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Suspended': return 'secondary';
      case 'Terminated': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading agent details...
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          Agent not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/agents">Agents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{agent.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/agents')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {agent.name}
              <Badge variant={getStatusBadgeVariant(agent.status)}>
                {agent.status}
              </Badge>
              {agent.irdai_certified && (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  IRDAI Certified
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {agent.agent_type} • Code: {agent.agent_code} • {agent.branches?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          {agent.status === 'Active' && (
            <>
              <Button
                variant="secondary"
                onClick={handleSuspend}
              >
                <UserX className="h-4 w-4 mr-2" />
                Suspend
              </Button>
              <Button
                variant="destructive"
                onClick={handleTerminate}
              >
                Terminate
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="products">Assigned Products</TabsTrigger>
          <TabsTrigger value="policies">Policy Summary</TabsTrigger>
          <TabsTrigger value="commissions">Commission Earned</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-semibold">{agent.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agent Code</label>
                  <p>{agent.agent_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">{agent.agent_type}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Branch</label>
                  <p>{agent.branches?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joining Date</label>
                  <p>{agent.joining_date ? format(new Date(agent.joining_date), 'PPP') : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                  <p>{agent.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <p>{agent.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                  <p>{agent.pan_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Aadhar Number</label>
                  <p>XXXX-XXXX-{agent.aadhar_number?.slice(-4)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IRDAI Certification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Certified Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {agent.irdai_certified ? (
                      <>
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Certified</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Not Certified</span>
                      </>
                    )}
                  </div>
                </div>
                {agent.irdai_certified && agent.irdai_cert_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Certificate Number</label>
                    <p>{agent.irdai_cert_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground">No documents uploaded</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(doc.path, doc.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Assigned Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Product assignment feature coming soon</p>
                <Button variant="outline" className="mt-4" disabled>
                  Assign Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Renewal Rate</p>
                    <p className="text-2xl font-bold">0%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Renewals</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Policy Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No policies found for this agent</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Commission Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No commission data available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payout history available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
          </DialogHeader>
          <AgentForm
            agent={agent}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDetail;