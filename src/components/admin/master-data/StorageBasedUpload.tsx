import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Cloud,
  Clock,
  FileX
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseCSVContent } from "@/utils/bulkUploadUtils";

interface MasterDataField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

interface StorageBasedUploadProps {
  entityType: string;
  tableName: string;
  fields: MasterDataField[];
}

interface FileUploadRecord {
  id: string;
  file_name: string;
  file_path: string;
  entity_type: string;
  file_size: number;
  upload_status: string;
  processing_status: string;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  uploaded_at: string;
  processed_at?: string;
}

interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
}

export function StorageBasedUpload({ entityType, tableName, fields }: StorageBasedUploadProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    status: 'idle'
  });
  const [uploadHistory, setUploadHistory] = useState<FileUploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, status: 'uploading' }));
    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Upload file to storage
      const fileName = `${entityType}_${Date.now()}_${file.name}`;
      const filePath = `${entityType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('master-data-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Read and validate CSV content
      const text = await file.text();
      const csvData = parseCSVContent(text);

      // Create file upload record
      const { error: recordError } = await supabase
        .from('master_data_file_uploads')
        .insert({
          file_name: fileName,
          file_path: filePath,
          entity_type: entityType,
          file_size: file.size,
          total_records: csvData.length,
          uploaded_by: user.user.id
        });

      if (recordError) throw recordError;

      toast({
        title: "File Uploaded Successfully",
        description: `${file.name} uploaded to storage with ${csvData.length} records`,
      });

      setUploadProgress(prev => ({ ...prev, status: 'completed' }));
      loadUploadHistory();

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => ({ ...prev, status: 'failed' }));
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const loadUploadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('master_data_file_uploads')
        .select('*')
        .eq('entity_type', entityType)
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUploadHistory(data || []);
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  };

  const processFile = async (fileRecord: FileUploadRecord) => {
    setUploadProgress(prev => ({ ...prev, status: 'processing' }));
    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('master-data-files')
        .download(fileRecord.file_path);

      if (downloadError) throw downloadError;

      // Parse CSV content
      const text = await fileData.text();
      const csvData = parseCSVContent(text);

      let successful = 0;
      let failed = 0;

      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const mappedRow: any = {
          created_by: user.user.id,
          last_updated_by: user.user.id,
          source_file_name: fileRecord.file_name
        };

        // Map columns based on field configuration
        fields.forEach(field => {
          const value = row[field.label] || row[field.name];
          if (value) {
            switch (field.type) {
              case 'number':
                mappedRow[field.name] = Number(value);
                break;
              case 'checkbox':
                mappedRow[field.name] = ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
                break;
              default:
                mappedRow[field.name] = value;
            }
          }
        });

        try {
          const { error } = await supabase
            .from(tableName as any)
            .insert(mappedRow);

          if (error) throw error;
          successful++;
        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error);
          failed++;
        }

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          processed: i + 1,
          successful,
          failed,
          total: csvData.length
        }));
      }

      // Update file record
      await supabase
        .from('master_data_file_uploads')
        .update({
          processing_status: 'completed',
          processed_records: csvData.length,
          successful_records: successful,
          failed_records: failed,
          processed_by: user.user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', fileRecord.id);

      toast({
        title: "Processing Completed",
        description: `Successfully processed ${successful} records, ${failed} failed`,
      });

      setUploadProgress(prev => ({ ...prev, status: 'completed' }));
      loadUploadHistory();

    } catch (error: any) {
      console.error('Processing failed:', error);
      setUploadProgress(prev => ({ ...prev, status: 'failed' }));
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = fields.map(field => field.label).join(',');
    
    let sampleRows: string[] = [];
    if (entityType === 'cities') {
      sampleRows = [
        'Mumbai,Maharashtra,400001,Mumbai,Western,Tier 1',
        'Delhi,Delhi,110001,Central Delhi,Northern,Tier 1',
        'Bangalore,Karnataka,560001,Bangalore Urban,Southern,Tier 1'
      ];
    } else {
      sampleRows = [fields.map(field => {
        switch (field.type) {
          case 'select':
            return field.options?.[0] || 'Sample';
          case 'number':
            return '100';
          case 'checkbox':
            return 'Yes';
          case 'date':
            return '2024-01-01';
          default:
            return `Sample ${field.label}`;
        }
      }).join(',')];
    }
    
    const csvContent = `${headers}\n${sampleRows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: `${entityType.replace(/_/g, ' ')} template downloaded with sample data`,
    });
  };

  const resetUpload = () => {
    setUploadProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'idle'
    });
  };

  // Load upload history when dialog opens
  const handleDialogOpen = (open: boolean) => {
    setIsUploadDialogOpen(open);
    if (open) {
      loadUploadHistory();
      resetUpload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Storage Upload
            </CardTitle>
            <CardDescription>
              Upload files to cloud storage and process them into {entityType.replace(/_/g, " ")} database
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Dialog open={isUploadDialogOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to Storage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Storage-Based Upload - {entityType.replace(/_/g, " ").toUpperCase()}</DialogTitle>
                  <DialogDescription>
                    Upload files to secure cloud storage and process them into the database
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Upload New File</h3>
                    
                    {uploadProgress.status === 'idle' && (
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isDragActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Cloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">
                          {isDragActive 
                            ? 'Drop the file here' 
                            : 'Drag & drop or click to upload'
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Files will be securely stored in cloud storage
                        </p>
                      </div>
                    )}

                    {['uploading', 'processing'].includes(uploadProgress.status) && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {uploadProgress.status === 'uploading' ? 'Uploading to storage...' : 'Processing data...'}
                          </span>
                          {uploadProgress.total > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {uploadProgress.processed} / {uploadProgress.total}
                            </span>
                          )}
                        </div>
                        <Progress value={uploadProgress.total > 0 ? (uploadProgress.processed / uploadProgress.total) * 100 : 0} />
                        
                        {uploadProgress.status === 'processing' && (
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-green-600">{uploadProgress.successful}</div>
                              <div className="text-xs text-muted-foreground">Successful</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600">{uploadProgress.failed}</div>
                              <div className="text-xs text-muted-foreground">Failed</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold">{uploadProgress.total - uploadProgress.processed}</div>
                              <div className="text-xs text-muted-foreground">Remaining</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadProgress.status === 'completed' && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          {uploadProgress.processed > 0 
                            ? `Processing completed! ${uploadProgress.successful} records processed successfully.`
                            : 'File uploaded successfully to storage!'
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    {uploadProgress.status === 'failed' && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          Upload or processing failed. Please try again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Upload History Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Upload History</h3>
                    
                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Records</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadHistory.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">{record.file_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(record.uploaded_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Badge variant={record.processing_status === 'completed' ? 'default' : 
                                               record.processing_status === 'pending' ? 'secondary' : 'destructive'}>
                                    {record.processing_status}
                                  </Badge>
                                  {record.processing_status === 'pending' && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Awaiting processing
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>Total: {record.total_records}</div>
                                  {record.processing_status === 'completed' && (
                                    <div className="text-xs text-muted-foreground">
                                      ✓ {record.successful_records} | ✗ {record.failed_records}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {record.processing_status === 'pending' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => processFile(record)}
                                    disabled={isLoading}
                                  >
                                    Process
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {uploadHistory.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                <FileX className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                No uploads yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Close
                  </Button>
                  {uploadProgress.status === 'completed' && (
                    <Button onClick={resetUpload}>
                      Upload Another File
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Files are securely stored in cloud storage and can be processed into the database. 
          This allows for better tracking, audit trails, and re-processing capabilities.
        </div>
      </CardContent>
    </Card>
  );
}