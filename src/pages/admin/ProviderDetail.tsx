import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Download, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProviderForm } from "@/components/admin/ProviderForm";
import { format } from "date-fns";

interface Provider {
  id: string;
  provider_name: string;
  irdai_code: string;
  provider_type: 'General' | 'Life' | 'Health' | 'Motor';
  status: 'Active' | 'Inactive';
  contact_person: string;
  support_email: string;
  phone_number: string;
  contract_start_date: string;
  contract_end_date: string;
  api_key: string;
  api_endpoint: string;
  documents_folder: string;
  created_at: string;
  updated_at: string;
}

interface Document {
  name: string;
  id: string;
  created_at: string;
}

const ProviderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProvider();
      fetchDocuments();
    }
  }, [id]);

  const fetchProvider = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProvider(data as Provider);
    } catch (error: any) {
      console.error('Error fetching provider:', error);
      toast({
        title: "Error",
        description: "Failed to fetch provider details",
        variant: "destructive"
      });
      navigate('/admin/insurers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('provider-documents')
        .list(id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
    }
  };

  const downloadDocument = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('provider-documents')
        .download(`${id}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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

  const handleDeactivate = async () => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('insurance_providers')
        .update({ status: 'Inactive' })
        .eq('id', provider.id);

      if (error) throw error;

      setProvider({ ...provider, status: 'Inactive' });
      toast({
        title: "Success",
        description: "Provider has been deactivated"
      });
    } catch (error: any) {
      console.error('Error deactivating provider:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate provider",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    fetchProvider();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading provider details...
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          Provider not found
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
            <BreadcrumbLink href="/admin/insurers">Insurance Providers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{provider.provider_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/insurers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Providers
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {provider.provider_name}
              <Badge variant={provider.status === 'Active' ? 'default' : 'secondary'}>
                {provider.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              IRDAI Code: {provider.irdai_code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {provider.status === 'Active' && (
            <Button
              variant="destructive"
              onClick={handleDeactivate}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Deactivate Provider
            </Button>
          )}
        </div>
      </div>

      {/* Provider Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Provider Name</label>
              <p className="text-lg font-semibold">{provider.provider_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">IRDAI Code</label>
              <p>{provider.irdai_code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="mt-1">
                <Badge variant="outline">{provider.provider_type}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={provider.status === 'Active' ? 'default' : 'secondary'}>
                  {provider.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
              <p>{provider.contact_person || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Support Email</label>
              <p>{provider.support_email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <p>{provider.phone_number || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contract Start Date</label>
              <p>{provider.contract_start_date ? format(new Date(provider.contract_start_date), 'PPP') : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contract End Date</label>
              <p>{provider.contract_end_date ? format(new Date(provider.contract_end_date), 'PPP') : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">API Endpoint</label>
              <p className="break-all">{provider.api_endpoint || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">API Key</label>
              <p>{provider.api_key ? '••••••••••••••••' : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground">No documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {format(new Date(doc.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(doc.name)}
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

      {/* Edit Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
          </DialogHeader>
          <ProviderForm
            provider={provider}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderDetail;