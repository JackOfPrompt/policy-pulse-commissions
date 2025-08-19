import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X,
  Eye,
  FileDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkUploadRow {
  rowIndex: number;
  lob: string;
  provider: string;
  productName: string;
  productCode: string;
  planType: string;
  variant: string;
  sumInsured: number;
  policyTerm: number;
  premiumPaymentTerm: number;
  premiumMin: number;
  premiumMax: number;
  description?: string;
  isValid: boolean;
  errors: string[];
}

interface BulkProductUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UPLOAD_STEPS = [
  { id: 1, title: 'Download Template', description: 'Get the CSV template' },
  { id: 2, title: 'Upload File', description: 'Upload your CSV file' },
  { id: 3, title: 'Preview Data', description: 'Review and validate data' },
  { id: 4, title: 'Confirm Upload', description: 'Save to database' },
];

export const BulkProductUploadModal: React.FC<BulkProductUploadModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BulkUploadRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    totalRows: number;
    successCount: number;
    errorCount: number;
    errorFileUrl?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleClose = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedData([]);
    setUploadResult(null);
    setUploadProgress(0);
    onOpenChange(false);
  };

  const downloadTemplate = async () => {
    try {
      // Generate CSV template
      const headers = [
        'LOB',
        'Provider',
        'Product Name',
        'Product Code',
        'Plan Type',
        'Variant',
        'Sum Insured',
        'Policy Term (Years)',
        'Premium Payment Term (Years)',
        'Premium Min',
        'Premium Max',
        'Description'
      ];

      const sampleData = [
        [
          'Health Insurance',
          'Care Health Insurance Ltd.',
          'Health Guard',
          'HG01',
          'Family Floater Plan',
          'Platinum',
          '1000000',
          '1',
          '1',
          '15000',
          '20000',
          'Comprehensive family health coverage'
        ],
        [
          'Life Insurance',
          'HDFC ERGO Health Insurance Ltd.',
          'Sanchay Plus',
          'SP01',
          'Endowment Plan',
          'Classic',
          '500000',
          '15',
          '10',
          '20000',
          '25000',
          'Guaranteed maturity benefit'
        ],
        [
          'Motor Insurance',
          'ICICI Lombard General Insurance Co. Ltd.',
          'Motor Secure',
          'MS01',
          'Comprehensive Plan',
          'Gold',
          '500000',
          '1',
          '1',
          '8000',
          '12000',
          'Own damage + Third party coverage'
        ]
      ];

      const csvContent = [headers, ...sampleData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'bulk_products_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Template Downloaded",
        description: "CSV template has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (csvText: string): BulkUploadRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const errors: string[] = [];

      // Basic validation
      if (!values[0]) errors.push('LOB is required');
      if (!values[2]) errors.push('Product Name is required');
      if (!values[3]) errors.push('Product Code is required');
      if (!values[6] || isNaN(Number(values[6]))) errors.push('Sum Insured must be a valid number');
      if (!values[9] || isNaN(Number(values[9]))) errors.push('Premium Min must be a valid number');
      if (!values[10] || isNaN(Number(values[10]))) errors.push('Premium Max must be a valid number');

      return {
        rowIndex: index + 2, // +2 because we skip header and arrays are 0-indexed
        lob: values[0] || '',
        provider: values[1] || '',
        productName: values[2] || '',
        productCode: values[3] || '',
        planType: values[4] || '',
        variant: values[5] || '',
        sumInsured: Number(values[6]) || 0,
        policyTerm: Number(values[7]) || 1,
        premiumPaymentTerm: Number(values[8]) || 1,
        premiumMin: Number(values[9]) || 0,
        premiumMax: Number(values[10]) || 0,
        description: values[11] || '',
        isValid: errors.length === 0,
        errors,
      };
    });
  };

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setParsedData(parsed);
        setCurrentStep(3);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find(file => 
        file.type === 'text/csv' || 
        file.name.endsWith('.csv')
      );
      
      if (csvFile) {
        handleFileUpload(csvFile);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    },
    [handleFileUpload, toast]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const processUpload = async () => {
    if (!parsedData.length) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const validRows = parsedData.filter(row => row.isValid);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Call the edge function to process the bulk upload
      const { data, error } = await supabase.functions.invoke('bulk-product-upload', {
        body: { products: validRows }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      setUploadResult({
        totalRows: parsedData.length,
        successCount: data.successCount,
        errorCount: data.errorCount,
        errorFileUrl: data.errorFileUrl,
      });

      setCurrentStep(4);
      
      if (data.successCount > 0) {
        toast({
          title: "Upload Complete",
          description: `${data.successCount} products uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process bulk upload",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validRows = parsedData.filter(row => row.isValid);
  const invalidRows = parsedData.filter(row => !row.isValid);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Step 1: Download Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download the CSV template with predefined columns for LOB, Provider, Product details, Plan Types, Variants, and Coverage options.
              </p>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Bulk Products Template</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Contains sample data and all required columns for product upload
                </p>
                <Button onClick={downloadTemplate} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Fill in the template with your product data. All LOBs and Providers should already exist in the system.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)} variant="outline">
                  Skip to Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Step 2: Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Drop your CSV file here</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse and select a file
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Step 3: Preview & Validate Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">File: {uploadedFile?.name}</h3>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{validRows.length} Valid rows</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>{invalidRows.length} Invalid rows</span>
                    </div>
                  </div>
                </div>
                <Badge variant={invalidRows.length === 0 ? 'default' : 'destructive'}>
                  Total: {parsedData.length} rows
                </Badge>
              </div>

              {invalidRows.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidRows.length} row(s) have validation errors. Please fix them before proceeding.
                  </AlertDescription>
                </Alert>
              )}

              <div className="max-h-96 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>LOB</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.rowIndex} className={row.isValid ? '' : 'bg-red-50'}>
                        <TableCell>{row.rowIndex}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>{row.lob}</TableCell>
                        <TableCell>{row.provider || 'Direct'}</TableCell>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>{row.planType}</TableCell>
                        <TableCell>{row.variant}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <div className="text-xs text-red-600 space-y-1">
                              {row.errors.map((error, idx) => (
                                <div key={idx}>• {error}</div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={processUpload} 
                  disabled={validRows.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Upload ${validRows.length} Valid Rows`}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Upload Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {uploadResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{uploadResult.totalRows}</div>
                      <div className="text-sm text-muted-foreground">Total Rows</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{uploadResult.successCount}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{uploadResult.errorCount}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>

                  {uploadResult.errorFileUrl && (
                    <Alert>
                      <FileDown className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>Error report available for download</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={uploadResult.errorFileUrl} download>
                            Download Errors
                          </a>
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => { onSuccess(); handleClose(); }} className="flex-1">
                      Done
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Upload More
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Bulk Product Upload
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {UPLOAD_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${index < UPLOAD_STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="text-center mt-2 max-w-24">
                  <div className="text-xs font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < UPLOAD_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};