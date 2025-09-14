import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

interface PolicyUploadProps {
  role?: 'admin' | 'employee' | 'agent';
}

export function PolicyUpload({ role = 'admin' }: PolicyUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();

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
      extractionStatus: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });
  }, []);

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        // Start AI extraction simulation
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, extractionStatus: 'processing' }
              : f
          ));
          
          setTimeout(() => {
            setFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, extractionStatus: Math.random() > 0.2 ? 'completed' : 'failed' }
                : f
            ));
            
            // Navigate to policy extraction page after successful extraction
            if (Math.random() > 0.2) { // If extraction was successful
              setTimeout(() => {
                navigate(`/policy-extraction?role=${role}`);
              }, 1000);
            }
          }, 3000);
        }, 1000);
      }
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadProgress: Math.min(progress, 100) }
          : f
      ));
    }, 500);
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
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Document Upload</CardTitle>
        <CardDescription>
          Upload policy documents for AI-powered data extraction
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
          <h3 className="text-lg font-medium mb-2">Drop policy documents here</h3>
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
            <h4 className="font-medium">Uploaded Files</h4>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                      {getStatusIcon(file.extractionStatus)}
                      <span className="text-sm">
                        {file.extractionStatus === 'pending' && 'AI extraction pending'}
                        {file.extractionStatus === 'processing' && 'Processing with AI...'}
                        {file.extractionStatus === 'completed' && 'Data extracted successfully'}
                        {file.extractionStatus === 'failed' && 'Extraction failed'}
                      </span>
                    </div>
                    <StatusChip variant={getStatusVariant(file.extractionStatus) as any}>
                      {file.extractionStatus}
                    </StatusChip>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}