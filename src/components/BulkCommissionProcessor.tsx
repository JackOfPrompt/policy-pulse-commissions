import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCcw,
  FileText,
  PlayCircle,
  PauseCircle,
  XCircle
} from "lucide-react";

interface BatchProcessingJob {
  id: string;
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  errors: ProcessingError[];
}

interface ProcessingError {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ProcessingError[];
  warnings: string[];
  totalRows: number;
}

export function BulkCommissionProcessor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [processingJobs, setProcessingJobs] = useState<BatchProcessingJob[]>([
    {
      id: '1',
      fileName: 'commission_batch_001.csv',
      totalRecords: 1250,
      processedRecords: 1250,
      successCount: 1180,
      errorCount: 70,
      status: 'completed',
      startTime: '2024-01-15 09:30:00',
      endTime: '2024-01-15 09:35:22',
      errors: []
    },
    {
      id: '2',
      fileName: 'commission_batch_002.xlsx',
      totalRecords: 850,
      processedRecords: 420,
      successCount: 410,
      errorCount: 10,
      status: 'processing',
      startTime: '2024-01-15 10:15:00',
      errors: []
    }
  ]);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    validateFile(file);
  };

  const validateFile = (file: File) => {
    // Simulate file validation
    setTimeout(() => {
      const mockValidation: ValidationResult = {
        isValid: true,
        errors: [
          {
            row: 15,
            field: 'commission_rate',
            value: '150%',
            error: 'Commission rate cannot exceed 100%'
          },
          {
            row: 23,
            field: 'policy_number',
            value: '',
            error: 'Policy number is required'
          }
        ],
        warnings: [
          'Duplicate agent found on row 45',
          'Premium amount seems unusually high on row 67'
        ],
        totalRows: 500
      };
      setValidationResult(mockValidation);
      
      toast({
        title: "File Validated",
        description: `${mockValidation.totalRows} records found with ${mockValidation.errors.length} errors`,
      });
    }, 2000);
  };

  const startProcessing = () => {
    if (!uploadedFile || !validationResult) return;

    const newJob: BatchProcessingJob = {
      id: Date.now().toString(),
      fileName: uploadedFile.name,
      totalRecords: validationResult.totalRows,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      status: 'pending',
      startTime: new Date().toLocaleString(),
      errors: []
    };

    setProcessingJobs(prev => [newJob, ...prev]);
    simulateProcessing(newJob.id);

    toast({
      title: "Processing Started",
      description: `Batch processing initiated for ${uploadedFile.name}`,
    });
  };

  const simulateProcessing = (jobId: string) => {
    const interval = setInterval(() => {
      setProcessingJobs(prev => prev.map(job => {
        if (job.id === jobId && job.status === 'pending') {
          return { ...job, status: 'processing' as const };
        }
        if (job.id === jobId && job.status === 'processing') {
          const newProcessed = Math.min(job.processedRecords + Math.floor(Math.random() * 20) + 5, job.totalRecords);
          const newSuccess = Math.floor(newProcessed * 0.95);
          const newErrors = newProcessed - newSuccess;
          
          if (newProcessed >= job.totalRecords) {
            clearInterval(interval);
            return {
              ...job,
              processedRecords: newProcessed,
              successCount: newSuccess,
              errorCount: newErrors,
              status: 'completed' as const,
              endTime: new Date().toLocaleString()
            };
          }
          
          return {
            ...job,
            processedRecords: newProcessed,
            successCount: newSuccess,
            errorCount: newErrors
          };
        }
        return job;
      }));
    }, 500);
  };

  const downloadTemplate = () => {
    const csvContent = `policy_number,agent_name,agent_id,policy_type,premium_amount,commission_rate,effective_date
POL-2024-001,John Smith,AGT001,Auto Insurance,2500.00,5.5,2024-01-01
POL-2024-002,Sarah Johnson,AGT002,Home Insurance,1850.00,4.8,2024-01-01`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commission_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Commission template CSV file downloaded successfully",
    });
  };

  const getStatusIcon = (status: BatchProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'processing':
        return <PlayCircle className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: BatchProcessingJob['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'secondary',
      failed: 'destructive',
      paused: 'secondary'
    } as const;

    const colors = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      processing: 'bg-primary/10 text-primary border-primary/20',
      completed: 'bg-success/10 text-success border-success/20',
      failed: 'bg-destructive/10 text-destructive border-destructive/20',
      paused: 'bg-muted/10 text-muted-foreground border-muted/20'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload & Validate
          </TabsTrigger>
          <TabsTrigger value="processing" className="gap-2">
            <PlayCircle className="w-4 h-4" />
            Batch Processing
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Upload & Validation */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Bulk Commission Upload
              </CardTitle>
              <CardDescription>
                Upload CSV or Excel files for batch commission processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Download */}
              <Alert>
                <Download className="w-4 h-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Download the template file to ensure proper formatting</span>
                  <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                </AlertDescription>
              </Alert>

              {/* File Upload Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={false}
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Drop your file here or click to browse</h3>
                    <p className="text-sm text-muted-foreground">
                      Supports CSV, XLSX, and XLS files up to 10MB
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose File
                  </Button>
                </div>
              </div>

              {/* File Info & Validation Results */}
              {uploadedFile && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Ready for validation</Badge>
                  </div>

                  {validationResult && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-success" />
                            <div>
                              <p className="text-sm text-muted-foreground">Total Records</p>
                              <p className="text-xl font-bold">{validationResult.totalRows}</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <div>
                              <p className="text-sm text-muted-foreground">Errors Found</p>
                              <p className="text-xl font-bold text-destructive">{validationResult.errors.length}</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-warning" />
                            <div>
                              <p className="text-sm text-muted-foreground">Warnings</p>
                              <p className="text-xl font-bold text-warning">{validationResult.warnings.length}</p>
                            </div>
                          </div>
                        </Card>
                      </div>

                      {validationResult.errors.length > 0 && (
                        <Card className="p-4">
                          <h4 className="font-medium mb-3 text-destructive">Validation Errors</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {validationResult.errors.map((error, index) => (
                              <div key={index} className="text-sm p-2 bg-destructive/5 rounded border-l-2 border-destructive">
                                <strong>Row {error.row}:</strong> {error.error} 
                                <span className="text-muted-foreground"> (Field: {error.field}, Value: "{error.value}")</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          onClick={startProcessing} 
                          disabled={validationResult.errors.length > 0}
                          className="gap-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Start Processing
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Re-validate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Processing */}
        <TabsContent value="processing" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                Batch Processing Queue
              </CardTitle>
              <CardDescription>
                Monitor and manage bulk commission processing jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processingJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-medium">{job.fileName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Started: {job.startTime}
                            {job.endTime && ` • Completed: ${job.endTime}`}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>

                    {job.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {job.processedRecords} / {job.totalRecords}</span>
                          <span>{Math.round((job.processedRecords / job.totalRecords) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(job.processedRecords / job.totalRecords) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-2 bg-success/10 rounded">
                        <p className="font-medium text-success">{job.successCount}</p>
                        <p className="text-muted-foreground">Successful</p>
                      </div>
                      <div className="text-center p-2 bg-destructive/10 rounded">
                        <p className="font-medium text-destructive">{job.errorCount}</p>
                        <p className="text-muted-foreground">Errors</p>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <p className="font-medium">{job.totalRecords}</p>
                        <p className="text-muted-foreground">Total</p>
                      </div>
                    </div>

                    {job.status === 'processing' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <PauseCircle className="w-4 h-4" />
                          Pause
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    )}

                    {job.status === 'completed' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                          Download Report
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Rollback
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Processing Reports
              </CardTitle>
              <CardDescription>
                Detailed reports and analytics for batch processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing Reports</h3>
                <p className="text-muted-foreground mb-6">Advanced reporting features coming soon</p>
                <Button variant="outline">
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}