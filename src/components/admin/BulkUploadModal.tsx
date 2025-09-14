import { useState, useCallback } from "react";
import { Upload, Download, X, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  templateHeaders: string[];
  requiredFields: string[];
  onUpload: (data: any[], isUpdate: boolean) => Promise<{ success: boolean; results?: any[]; error?: string }>;
  validateRow?: (row: any) => { valid: boolean; errors: string[] };
}

interface UploadResult {
  row: number;
  data: any;
  status: 'success' | 'error';
  message: string;
}

export function BulkUploadModal({
  open,
  onOpenChange,
  title,
  templateHeaders,
  requiredFields,
  onUpload,
  validateRow
}: BulkUploadModalProps) {
  const { toast } = useToast();
  const [uploadMode, setUploadMode] = useState<'insert' | 'update'>('insert');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'results'>('upload');

  const validateData = useCallback((data: any[]) => {
    const errors: string[] = [];
    const validatedData: any[] = [];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          rowErrors.push(`${field} is required`);
        }
      });

      // Custom validation if provided
      if (validateRow) {
        const customValidation = validateRow(row);
        if (!customValidation.valid) {
          rowErrors.push(...customValidation.errors);
        }
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
      } else {
        validatedData.push({ ...row, _rowIndex: index + 2 });
      }
    });

    setValidationErrors(errors);
    return validatedData;
  }, [requiredFields, validateRow]);

  const parseFile = useCallback((file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          const validData = validateData(results.data as any[]);
          setParsedData(validData);
          if (validData.length > 0) {
            setCurrentStep('preview');
          }
        },
        header: true,
        skipEmptyLines: true,
        error: (error) => {
          toast({
            title: "Error parsing CSV",
            description: error.message,
            variant: "destructive"
          });
        }
      });
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const validData = validateData(jsonData);
          setParsedData(validData);
          if (validData.length > 0) {
            setCurrentStep('preview');
          }
        } catch (error) {
          toast({
            title: "Error parsing Excel file",
            description: "Please ensure the file is a valid Excel format",
            variant: "destructive"
          });
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive"
      });
    }
  }, [validateData, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      parseFile(acceptedFiles[0]);
    }
  }, [parseFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const downloadTemplate = () => {
    const csvContent = templateHeaders.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase()}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await onUpload(parsedData, uploadMode === 'update');
      
      if (result.success && result.results) {
        const results = result.results.map((res, index) => ({
          row: parsedData[index]._rowIndex || index + 1,
          data: parsedData[index],
          status: res.success ? 'success' as const : 'error' as const,
          message: res.message || (res.success ? 'Success' : 'Failed')
        }));
        setUploadResults(results);
        setCurrentStep('results');
        
        const successCount = results.filter(r => r.status === 'success').length;
        toast({
          title: "Upload completed",
          description: `${successCount} of ${results.length} records processed successfully`
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "An error occurred during upload",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const resetModal = () => {
    setParsedData([]);
    setValidationErrors([]);
    setUploadResults([]);
    setCurrentStep('upload');
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload - {title}</DialogTitle>
          <DialogDescription>
            Upload CSV or Excel files to add or update multiple records at once
          </DialogDescription>
        </DialogHeader>

        <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'insert' | 'update')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insert">Bulk Insert</TabsTrigger>
            <TabsTrigger value="update">Bulk Update</TabsTrigger>
          </TabsList>

          <TabsContent value="insert" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insert mode will create new records. Existing records with matching keys will be skipped.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="update" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Update mode will modify existing records based on matching keys. New records will be created if no match is found.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {currentStep === 'upload' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Upload File</h3>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium">Drag & drop a file here, or click to select</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports CSV and Excel files (.csv, .xlsx, .xls)
                  </p>
                </div>
              )}
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Validation Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-sm">... and {validationErrors.length - 10} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Preview Data ({parsedData.length} records)</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                  Back
                </Button>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : `${uploadMode === 'insert' ? 'Insert' : 'Update'} Records`}
                </Button>
              </div>
            </div>

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    {templateHeaders.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 100).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row._rowIndex}</TableCell>
                      {templateHeaders.map((header) => (
                        <TableCell key={header}>
                          {row[header] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {parsedData.length > 100 && (
                    <TableRow>
                      <TableCell colSpan={templateHeaders.length + 1} className="text-center text-muted-foreground">
                        ... and {parsedData.length - 100} more records
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {currentStep === 'results' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Upload Results</h3>
              <Button onClick={handleClose}>Close</Button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing records...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Successful</div>
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResults.filter(r => r.status === 'success').length}
                  </div>
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Failed</div>
                  <div className="text-2xl font-bold">
                    {uploadResults.filter(r => r.status === 'error').length}
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                    {templateHeaders.slice(0, 3).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.row}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {result.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{result.message}</TableCell>
                      {templateHeaders.slice(0, 3).map((header) => (
                        <TableCell key={header}>
                          {result.data[header] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}