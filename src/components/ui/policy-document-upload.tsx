import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Eye, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PolicyDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  validation_status: 'pending' | 'validated' | 'rejected';
  validation_notes?: string;
  is_mandatory: boolean;
}

interface PolicyDocumentUploadProps {
  policyId?: string;
  policyNumber?: string;
  onDocumentsChange?: (documents: PolicyDocument[]) => void;
  readonly?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'policy_copy', label: 'Policy Copy', mandatory: true },
  { value: 'proposal_form', label: 'Proposal Form', mandatory: true },
  { value: 'kyc_documents', label: 'KYC Documents', mandatory: true },
  { value: 'medical_reports', label: 'Medical Reports', mandatory: false },
  { value: 'inspection_report', label: 'Inspection Report', mandatory: false },
  { value: 'endorsements', label: 'Endorsements', mandatory: false },
  { value: 'claims_documents', label: 'Claims Documents', mandatory: false },
  { value: 'other', label: 'Other Documents', mandatory: false }
];

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const PolicyDocumentUpload: React.FC<PolicyDocumentUploadProps> = ({
  policyId,
  policyNumber,
  onDocumentsChange,
  readonly = false
}) => {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const { toast } = useToast();

  // Fetch existing documents
  useEffect(() => {
    if (policyId) {
      fetchDocuments();
    }
  }, [policyId]);

  const fetchDocuments = async () => {
    if (!policyId) return;

    try {
      const { data, error } = await supabase
        .from('policy_documents')
        .select('*')
        .eq('policy_id', policyId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const documentsData = data as PolicyDocument[];
      setDocuments(documentsData);
      onDocumentsChange?.(documentsData);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedDocumentType) {
      toast({
        title: "Please select document type",
        description: "Select a document type before uploading",
        variant: "destructive"
      });
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ACCEPTED_FILE_TYPES.split(',').map(ext => ext.replace('.', '').trim());
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: `Only ${ACCEPTED_FILE_TYPES} files are allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Create folder structure: policy-number/document-type/
      const folder = policyNumber ? `${policyNumber}/${selectedDocumentType}` : selectedDocumentType;
      const fileName = `${folder}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('policy-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save metadata to database (only if policy is already created)
      if (policyId) {
        const documentTypeInfo = DOCUMENT_TYPES.find(dt => dt.value === selectedDocumentType);
        
        const { error: dbError } = await supabase
          .from('policy_documents')
          .insert({
            policy_id: policyId,
            document_type: selectedDocumentType,
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            is_mandatory: documentTypeInfo?.mandatory || false
          });

        if (dbError) throw dbError;

        // Refresh documents list
        await fetchDocuments();
      }

      toast({
        title: "Upload successful",
        description: "Document uploaded successfully"
      });

      // Reset selection
      setSelectedDocumentType('');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [selectedDocumentType, policyId, policyNumber, onDocumentsChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    disabled: readonly || uploading || !selectedDocumentType
  });

  const handleRemoveDocument = async (documentId: string, filePath: string) => {
    try {
      // Remove from storage
      await supabase.storage
        .from('policy-documents')
        .remove([filePath]);

      // Remove from database
      const { error } = await supabase
        .from('policy_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Refresh documents list
      await fetchDocuments();

      toast({
        title: "Success",
        description: "Document removed successfully"
      });
    } catch (error: any) {
      console.error('Error removing document:', error);
      toast({
        title: "Error",
        description: "Failed to remove document",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('policy-documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const getValidationStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge variant="default" className="bg-green-100 text-green-800">Validated</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getMandatoryDocumentStatus = () => {
    const mandatoryTypes = DOCUMENT_TYPES.filter(dt => dt.mandatory);
    const uploadedMandatoryTypes = documents
      .filter(doc => doc.validation_status !== 'rejected')
      .map(doc => doc.document_type);
    
    const missingMandatory = mandatoryTypes.filter(
      type => !uploadedMandatoryTypes.includes(type.value)
    );

    return {
      total: mandatoryTypes.length,
      uploaded: mandatoryTypes.length - missingMandatory.length,
      missing: missingMandatory
    };
  };

  const mandatoryStatus = getMandatoryDocumentStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Policy Documents
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Mandatory: {mandatoryStatus.uploaded}/{mandatoryStatus.total}</span>
          <span>Total Documents: {documents.length}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Missing Mandatory Documents Alert */}
        {mandatoryStatus.missing.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
              <AlertCircle className="h-4 w-4" />
              Missing Mandatory Documents
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {mandatoryStatus.missing.map(doc => (
                <li key={doc.value}>• {doc.label}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Section */}
        {!readonly && (
          <div className="space-y-4">
            <div>
              <Label>Document Type</Label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} {type.mandatory && <span className="text-red-500">*</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                (uploading || !selectedDocumentType) && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      {isDragActive
                        ? "Drop the document here"
                        : selectedDocumentType 
                          ? "Drag & drop a document here, or click to select"
                          : "Select document type first"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: {ACCEPTED_FILE_TYPES} • Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <Label>Uploaded Documents</Label>
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.file_name}</span>
                      {getValidationStatusIcon(doc.validation_status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {DOCUMENT_TYPES.find(dt => dt.value === doc.document_type)?.label} • 
                      {Math.round(doc.file_size / 1024)} KB • 
                      {format(new Date(doc.uploaded_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getValidationStatusBadge(doc.validation_status)}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {!readonly && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveDocument(doc.id, doc.file_path)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && policyId && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};