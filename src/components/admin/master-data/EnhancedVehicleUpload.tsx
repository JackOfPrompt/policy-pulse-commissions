import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, FileText, Database, Download, Car, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SUPPORTED_DATA_TYPES = [
  { value: 'vehicle_data', label: 'Vehicle Data', description: 'Upload vehicle makes, models and specifications' },
  { value: 'cities', label: 'Cities & Pincodes', description: 'Upload city and pincode data' },
  { value: 'addons', label: 'Add-ons', description: 'Upload insurance add-on data' },
  { value: 'benefits', label: 'Benefits', description: 'Upload insurance benefit data' },
  { value: 'health_conditions', label: 'Health Conditions', description: 'Upload health condition data' },
  { value: 'business_categories', label: 'Business Categories', description: 'Upload business category data' },
  { value: 'occupations', label: 'Occupations', description: 'Upload occupation data' },
  { value: 'uin_codes', label: 'UIN Codes', description: 'Upload UIN code data' }
];

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  uploadId?: string;
  processedRecords?: number;
  totalRecords?: number;
  failedRecords?: number;
  errorReportPath?: string;
}

export const EnhancedVehicleUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<string>('vehicle_data');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [vehicleCompanies, setVehicleCompanies] = useState<any[]>([]);
  const [showCompanies, setShowCompanies] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV or Excel file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus({
        status: 'idle',
        progress: 0,
        message: `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  const pollUploadStatus = async (uploadId: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes with 1-second intervals
    
    const poll = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('master_data_file_uploads')
          .select('*')
          .eq('id', uploadId)
          .single();
        
        if (error) throw error;
        
        const progress = data.total_records > 0 
          ? Math.round((data.processed_records / data.total_records) * 100)
          : 0;
        
        setUploadStatus({
          status: data.upload_status === 'completed' || data.upload_status === 'completed_with_errors' 
            ? 'completed' 
            : data.upload_status === 'failed' 
              ? 'failed' 
              : 'processing',
          progress,
          message: `Processing... ${data.processed_records}/${data.total_records} records`,
          uploadId,
          processedRecords: data.processed_records,
          totalRecords: data.total_records,
          failedRecords: data.failed_records,
          errorReportPath: (data as any).error_report_path
        });
        
        if (data.upload_status === 'completed' || data.upload_status === 'completed_with_errors') {
          const hasErrors = data.failed_records > 0;
          toast({
            title: hasErrors ? "Upload completed with warnings" : "Upload completed successfully",
            description: `Processed ${data.processed_records} records${hasErrors ? ` (${data.failed_records} failed)` : ''}`,
            variant: hasErrors ? "default" : "default"
          });
          return;
        }
        
        if (data.upload_status === 'failed') {
          const errorMessage = typeof data.error_details === 'object' && data.error_details 
            ? (data.error_details as any).message || 'Processing failed'
            : 'Processing failed';
          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive"
          });
          return;
        }
        
        // Continue polling if still processing
        if (attempts < maxAttempts && data.upload_status === 'processing') {
          attempts++;
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setUploadStatus(prev => ({
          ...prev,
          status: 'failed',
          message: 'Failed to check processing status'
        }));
      }
    };
    
    setTimeout(poll, 1000);
  };

  const handleUpload = async () => {
    if (!selectedFile || !dataType) {
      toast({
        title: "Missing information",
        description: "Please select a file and data type",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadStatus({
        status: 'uploading',
        progress: 0,
        message: 'Uploading file...'
      });

      // Create unique file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${dataType}-${timestamp}-${selectedFile.name}`;
      const filePath = `uploads/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('master-data-files')
        .upload(filePath, selectedFile, {
          upsert: false,
          contentType: selectedFile.type
        });

      if (uploadError) throw uploadError;

      setUploadStatus({
        status: 'uploading',
        progress: 50,
        message: 'File uploaded, creating processing record...'
      });

      // Create upload record
      const { data: uploadRecord, error: recordError } = await supabase
        .from('master_data_file_uploads')
        .insert({
          file_name: selectedFile.name,
          file_path: filePath,
          entity_type: dataType,
          upload_status: 'pending'
        })
        .select()
        .single();

      if (recordError) throw recordError;

      setUploadStatus({
        status: 'processing',
        progress: 75,
        message: 'Starting data processing...',
        uploadId: uploadRecord.id
      });

      // Call edge function to process file
      const { data: processResult, error: processError } = await supabase.functions
        .invoke('process-master-data-file', {
          body: {
            filePath,
            dataType,
            uploadId: uploadRecord.id
          }
        });

      if (processError) {
        console.error('Edge function error:', processError);
        throw new Error(`Processing failed: ${processError.message}`);
      }

      if (!processResult?.success) {
        throw new Error(processResult?.error || 'Unknown processing error');
      }

      // Start polling for status updates
      pollUploadStatus(uploadRecord.id);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'failed',
        progress: 0,
        message: `Upload failed: ${error.message}`
      });
      
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setDataType('vehicle_data');
    setUploadStatus({
      status: 'idle',
      progress: 0,
      message: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadErrorReport = async () => {
    if (!uploadStatus.errorReportPath) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('master-data-files')
        .download(uploadStatus.errorReportPath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download error report",
        variant: "destructive"
      });
    }
  };

  const fetchVehicleCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('master_vehicle_data')
        .select('make')
        .order('make');
      
      if (error) throw error;
      
      // Group by make and count manually
      const companies = (data || []).reduce((acc: any[], curr: any) => {
        const existing = acc.find(c => c.make === curr.make);
        if (existing) {
          existing.model_count += 1;
        } else {
          acc.push({ make: curr.make, model_count: 1 });
        }
        return acc;
      }, []);
      
      companies.sort((a, b) => b.model_count - a.model_count);
      setVehicleCompanies(companies);
      setShowCompanies(true);
    } catch (error) {
      toast({
        title: "Failed to fetch companies",
        description: "Could not load vehicle companies",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
      case 'uploading':
        return <Database className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Vehicle Data Upload Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Data Upload
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={fetchVehicleCompanies}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              View Companies
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="dataType">Data Type</Label>
          <Select value={dataType} onValueChange={setDataType} disabled={uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}>
            <SelectTrigger>
              <SelectValue placeholder="Select data type to upload" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_DATA_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
              className="flex-1"
            />
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetUpload}
                disabled={uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Status Display */}
        {uploadStatus.message && (
          <Alert>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <AlertDescription className="flex-1">
                {uploadStatus.message}
              </AlertDescription>
            </div>
            {uploadStatus.status === 'processing' && (
              <div className="mt-2">
                <Progress value={uploadStatus.progress} className="w-full" />
                <div className="text-sm text-muted-foreground mt-1">
                  {uploadStatus.processedRecords && uploadStatus.totalRecords && (
                    <>
                      {uploadStatus.processedRecords} of {uploadStatus.totalRecords} records processed
                      {uploadStatus.failedRecords > 0 && (
                        <span className="text-amber-600 ml-2">
                          ({uploadStatus.failedRecords} failed)
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </Alert>
        )}

        {/* Upload Instructions */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h4 className="font-medium">Upload Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Supported formats: CSV, Excel (.xlsx, .xls)</li>
            <li>• Maximum file size: 50MB</li>
            <li>• For vehicle data: Include columns like make, model, variant, fuel_type, etc.</li>
            <li>• First row should contain column headers</li>
            <li>• Data will be validated and processed automatically</li>
            <li>• Error reports will be generated for failed records</li>
          </ul>
        </div>

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !dataType || uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
            className="flex-1"
          >
            {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
              <>
                <Database className="h-4 w-4 mr-2 animate-pulse" />
                {uploadStatus.status === 'uploading' ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Process
              </>
            )}
          </Button>
          
          {uploadStatus.status === 'completed' && (
            <>
              <Button variant="outline" onClick={resetUpload}>
                Upload Another
              </Button>
              {uploadStatus.failedRecords > 0 && uploadStatus.errorReportPath && (
                <Button variant="outline" onClick={downloadErrorReport} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Error Report
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Vehicle Companies Card View */}
    {showCompanies && (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Motor Vehicle Companies
            </CardTitle>
            <Button variant="outline" onClick={() => setShowCompanies(false)}>
              Hide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicleCompanies.map((company, index) => (
              <div 
                key={index}
                className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {company.make}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {company.model_count} {company.model_count === 1 ? 'model' : 'models'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {vehicleCompanies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vehicle data found. Upload vehicle data to see companies.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )}
  </div>
  );
};