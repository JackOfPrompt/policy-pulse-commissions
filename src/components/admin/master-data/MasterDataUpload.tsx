import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MapPin,
  Play
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseCSVContent, BulkUploadLogger } from "@/utils/bulkUploadUtils";

interface MasterDataField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

interface MasterDataUploadProps {
  entityType: string;
  tableName: string;
  fields: MasterDataField[];
}

interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'idle' | 'mapping' | 'validating' | 'uploading' | 'completed' | 'failed';
}

export function MasterDataUpload({ entityType, tableName, fields }: MasterDataUploadProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    status: 'idle'
  });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [uploadLogger, setUploadLogger] = useState<BulkUploadLogger | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const data = parseCSVContent(text);
        setCsvData(data);
        
        // Ensure an upload logger exists for this session so processing errors are captured even without validation
        setUploadLogger(new BulkUploadLogger(entityType));
        
        // Auto-map columns
        const autoMapping: Record<string, string> = {};
        const csvHeaders = data.length > 0 ? Object.keys(data[0]) : [];
        
        fields.forEach(field => {
          const matchingHeader = csvHeaders.find(header => 
            header.toLowerCase().includes(field.name.toLowerCase()) ||
            header.toLowerCase().includes(field.label.toLowerCase())
          );
          if (matchingHeader) {
            autoMapping[field.name] = matchingHeader;
          }
        });
        
        setColumnMapping(autoMapping);
        setProgress(prev => ({ ...prev, status: 'mapping', total: data.length }));
      };
      reader.readAsText(file);
    }
  }, [fields]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const validateData = () => {
    const errors: any[] = [];
    const logger = new BulkUploadLogger(entityType);
    setUploadLogger(logger);

    setProgress(prev => ({ ...prev, status: 'validating' }));

    csvData.forEach((row, index) => {
      const mappedRow: any = {};
      const rowErrors: string[] = [];

      // Map columns
      fields.forEach(field => {
        const csvColumn = columnMapping[field.name];
        if (csvColumn) {
          mappedRow[field.name] = row[csvColumn];
        }
      });

      // Validate required fields
      fields.forEach(field => {
        if (field.required && !mappedRow[field.name]) {
          rowErrors.push(`${field.label} is required`);
        }

        // Type-specific validation
        if (mappedRow[field.name]) {
          switch (field.type) {
            case 'number':
              if (isNaN(Number(mappedRow[field.name]))) {
                rowErrors.push(`${field.label} must be a number`);
              }
              break;
            case 'select':
              if (field.options && !field.options.includes(mappedRow[field.name])) {
                rowErrors.push(`${field.label} must be one of: ${field.options.join(', ')}`);
              }
              break;
          }
        }
      });

      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, data: mappedRow, errors: rowErrors });
        logger.logValidationError(index + 1, mappedRow, rowErrors);
      }
    });

    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setProgress(prev => ({ ...prev, status: 'mapping' }));
      toast({
        title: "Validation Successful",
        description: `All ${csvData.length} rows are valid and ready for upload`,
      });
    } else {
      toast({
        title: "Validation Failed",
        description: `${errors.length} rows have validation errors`,
        variant: "destructive",
      });
    }
  };

  const processUpload = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Cannot Upload",
        description: "Please fix validation errors before uploading",
        variant: "destructive",
      });
      return;
    }

    setProgress(prev => ({ ...prev, status: 'uploading', processed: 0, successful: 0, failed: 0 }));

    // Initial status update
    toast({
      title: "Upload Started",
      description: `Processing ${csvData.length} records...`,
    });

    try {
      const { data: user } = await supabase.auth.getUser();
      const batchSize = 10; // Process in batches for better performance
      
      // Ensure we have a logger for processing errors even if validation wasn't run
      const loggerRef = uploadLogger ?? new BulkUploadLogger(entityType);
      if (!uploadLogger) setUploadLogger(loggerRef);
      
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const mappedRow: any = {
          created_by: user.user?.id,
          last_updated_by: user.user?.id,
          source_file_name: uploadedFile?.name
        };

        // Map columns
        fields.forEach(field => {
          const csvColumn = columnMapping[field.name];
          if (csvColumn && row[csvColumn]) {
            let value = row[csvColumn];
            
            // Type conversion
            switch (field.type) {
              case 'number':
                value = Number(value);
                break;
              case 'checkbox':
                value = ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
                break;
              case 'multiselect':
                value = Array.isArray(value) ? value : [value];
                break;
            }
            
            mappedRow[field.name] = value;
          }
        });

        try {
          const { error } = await supabase
            .from(tableName as any)
            .insert(mappedRow);

          if (error) throw error;
          
          setProgress(prev => ({
            ...prev,
            processed: i + 1,
            successful: prev.successful + 1
          }));

          // Show intermediate progress updates
          if ((i + 1) % 50 === 0 || i === csvData.length - 1) {
            toast({
              title: "Upload Progress",
              description: `Processed ${i + 1} of ${csvData.length} records`,
            });
          }

        } catch (error: any) {
          console.error(`Error inserting row ${i + 1}:`, error);
          
          // Format error message for better understanding
          let errorMessage = String(error);
          if (error?.message) {
            errorMessage = error.message;
            // Handle specific RLS policy errors
            if (errorMessage.includes('row-level security policy')) {
              if (tableName === 'master_cities') {
                errorMessage = 'Cities data validation failed. Please check the data format and try again.';
              } else {
                errorMessage = 'Access denied: Row-level security policy violation. Check user permissions or data validation rules.';
              }
            }
          }
          
          loggerRef.logProcessingError(i + 1, mappedRow, errorMessage);
          
          setProgress(prev => ({
            ...prev,
            processed: i + 1,
            failed: prev.failed + 1
          }));
        }

        // Add small delay between batches to prevent overwhelming the database
        if ((i + 1) % batchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setProgress(prev => ({ ...prev, status: 'completed' }));
      
      const finalProgress = progress.successful + 1; // Account for final increment
      toast({
        title: "Upload Completed Successfully!",
        description: `✅ Successfully uploaded ${finalProgress} ${entityType === 'cities' ? 'cities & pincode' : entityType.replace(/_/g, ' ')} records${progress.failed > 0 ? `. ${progress.failed} records failed.` : '.'}`,
      });

    } catch (error) {
      console.error('Upload failed:', error);
      setProgress(prev => ({ ...prev, status: 'failed' }));
      toast({
        title: "Upload Failed",
        description: "An error occurred during upload. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const headers = fields.map(field => field.label).join(',');
    
    // Generate sample data based on entity type
    let sampleRows: string[] = [];
    
    if (entityType === 'cities') {
      // Enhanced Cities & Pincodes template with multiple sample rows
      sampleRows = [
        'Mumbai,Maharashtra,400001,Mumbai,Western,Tier 1',
        'Delhi,Delhi,110001,Central Delhi,Northern,Tier 1',
        'Bangalore,Karnataka,560001,Bangalore Urban,Southern,Tier 1',
        'Chennai,Tamil Nadu,600001,Chennai,Southern,Tier 1',
        'Kolkata,West Bengal,700001,Kolkata,Eastern,Tier 1',
        'Pune,Maharashtra,411001,Pune,Western,Tier 1',
        'Hyderabad,Telangana,500001,Hyderabad,Southern,Tier 1',
        'Ahmedabad,Gujarat,380001,Ahmedabad,Western,Tier 1',
        'Jaipur,Rajasthan,302001,Jaipur,Western,Tier 2',
        'Lucknow,Uttar Pradesh,226001,Lucknow,Northern,Tier 2'
      ];
    } else {
      // Default sample data for other entities
      sampleRows = [fields.map(field => {
        switch (field.type) {
          case 'select':
            return field.options?.[0] || 'N/A';
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
    
    // Show status update
    toast({
      title: "Template Downloaded",
      description: `${entityType === 'cities' ? 'Cities & Pincodes' : entityType.replace(/_/g, ' ')} template downloaded with sample data`,
    });
  };

  const downloadErrors = () => {
    if (validationErrors.length > 0) {
      // Generate CSV from current validation errors
      const headers = ['Row Number', 'Error Details', 'Data'];
      const rows = validationErrors.map(error => [
        error.row.toString(),
        error.errors.join('; '),
        JSON.stringify(error.data)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType.toLowerCase()}_validation_errors_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Error Report Downloaded",
        description: `Downloaded ${validationErrors.length} validation errors`,
      });
    } else if (uploadLogger) {
      // Use the logger's method for processing errors
      uploadLogger.downloadErrorReport();
    } else {
      toast({
        title: "No Errors Found",
        description: "There are no errors to download",
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setCsvData([]);
    setColumnMapping({});
    setValidationErrors([]);
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'idle'
    });
    setUploadLogger(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Upload Data</CardTitle>
            <CardDescription>
              Upload Excel or CSV files to bulk import {entityType.replace(/_/g, " ")} data
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload {entityType.replace(/_/g, " ").toUpperCase()}</DialogTitle>
                  <DialogDescription>
                    Upload and map your data file
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {progress.status === 'idle' && (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        {isDragActive 
                          ? 'Drop the file here' 
                          : 'Drag & drop your file here, or click to select'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV, XLS, and XLSX files
                      </p>
                    </div>
                  )}

                  {uploadedFile && progress.status === 'mapping' && (
                    <div className="space-y-4">
                      <Alert>
                        <MapPin className="h-4 w-4" />
                        <AlertDescription>
                          Map your CSV columns to the required fields. Auto-mapping has been applied where possible.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map((field) => (
                          <div key={field.name} className="space-y-2">
                            <Label>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            <Select
                              value={columnMapping[field.name] || ""}
                              onValueChange={(value) =>
                                setColumnMapping(prev => ({ ...prev, [field.name]: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select CSV column" />
                              </SelectTrigger>
                               <SelectContent>
                                 {csvData.length > 0 && Object.keys(csvData[0])
                                   .filter(header => header && header.trim() !== '')
                                   .map((header) => (
                                   <SelectItem key={header} value={header}>
                                     {header}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={validateData} variant="outline">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Validate Data
                        </Button>
                        {validationErrors.length === 0 && progress.total > 0 && (
                          <Button onClick={processUpload}>
                            <Play className="w-4 h-4 mr-2" />
                            Start Upload
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {validationErrors.length > 0 && (
                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {validationErrors.length} rows have validation errors. 
                          <Button 
                            variant="link" 
                            className="h-auto p-0 ml-2"
                            onClick={downloadErrors}
                          >
                            Download error report
                          </Button>
                        </AlertDescription>
                      </Alert>

                      <div className="max-h-60 overflow-y-auto border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Errors</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationErrors.slice(0, 10).map((error, index) => (
                              <TableRow key={index}>
                                <TableCell>{error.row}</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {error.errors.map((err: string, i: number) => (
                                      <Badge key={i} variant="destructive" className="mr-1">
                                        {err}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {['validating', 'uploading'].includes(progress.status) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {progress.status === 'validating' ? 'Validating data...' : 'Uploading data...'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {progress.processed} / {progress.total}
                        </span>
                      </div>
                      <Progress value={(progress.processed / progress.total) * 100} />
                      
                      {progress.status === 'uploading' && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
                            <div className="text-xs text-muted-foreground">Successful</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                            <div className="text-xs text-muted-foreground">Failed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{progress.total - progress.processed}</div>
                            <div className="text-xs text-muted-foreground">Remaining</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {progress.status === 'completed' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Upload completed successfully! {progress.successful} records uploaded.
                        {progress.failed > 0 && (
                          <>
                            {" "}{progress.failed} records failed.
                            <Button 
                              variant="link" 
                              className="h-auto p-0 ml-2"
                              onClick={downloadErrors}
                            >
                              Download error report
                            </Button>
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {progress.status !== 'uploading' && (
                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                      Close
                    </Button>
                  )}
                  {progress.status === 'completed' && (
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
          Use the template to ensure your data matches the required format. 
          Required fields are marked with an asterisk (*).
        </div>
      </CardContent>
    </Card>
  );
}