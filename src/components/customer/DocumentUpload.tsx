import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Clock, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import documentsData from "@/data/customer/documents.json";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'uploaded' | 'ai_extracting' | 'verified' | 'failed';
  docType: 'kyc' | 'policy' | 'claim';
}

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [documents] = useState(documentsData);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = droppedFiles.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
      status: 'uploading',
      docType: 'kyc'
    }));

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach((file) => simulateUpload(file.id));
  }, []);

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'ai_extracting' } : f
          ));
          
          setTimeout(() => {
            setFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, status: Math.random() > 0.2 ? 'verified' : 'failed' }
                : f
            ));
          }, 2000);
        }, 1000);
      }
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadProgress: Math.min(progress, 100) }
          : f
      ));
    }, 300);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'uploaded':
        return <Clock className="h-4 w-4" />;
      case 'ai_extracting':
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'ai_extracting':
      case 'processing':
        return 'info';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload your policy documents, KYC documents, or claim-related files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Drop your documents here</h3>
            <p className="text-muted-foreground mb-4">
              or click to browse your files
            </p>
            <Button variant="outline">
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Supports PDF, JPG, PNG up to 10MB
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium">Uploading Files</h4>
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select 
                        value={file.docType} 
                        onValueChange={(value: 'kyc' | 'policy' | 'claim') => {
                          setFiles(prev => prev.map(f => 
                            f.id === file.id ? { ...f, docType: value } : f
                          ));
                        }}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kyc">KYC</SelectItem>
                          <SelectItem value="policy">Policy</SelectItem>
                          <SelectItem value="claim">Claim</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {file.uploadProgress < 100 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Uploading...</span>
                        <span>{Math.round(file.uploadProgress)}%</span>
                      </div>
                      <Progress value={file.uploadProgress} className="h-2" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(file.status)}
                        <span className="text-sm">
                          {file.status === 'uploaded' && 'Upload complete'}
                          {file.status === 'ai_extracting' && 'Processing document...'}
                          {file.status === 'verified' && 'Document verified'}
                          {file.status === 'failed' && 'Verification failed'}
                        </span>
                      </div>
                      <StatusChip variant={getStatusVariant(file.status) as any}>
                        {file.status}
                      </StatusChip>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>
            View and manage your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusChip variant="secondary">
                      {doc.type.toUpperCase()}
                    </StatusChip>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.size}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.status)}
                      <StatusChip variant={getStatusVariant(doc.status) as any}>
                        {doc.status}
                      </StatusChip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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