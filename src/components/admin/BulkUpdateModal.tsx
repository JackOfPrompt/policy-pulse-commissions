import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, CheckCircle, XCircle, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  BulkUploadLogger, 
  ProgressTracker, 
  ProcessingProgress,
  parseCSVContent,
  downloadCSVTemplate 
} from "@/utils/bulkUploadUtils";
import ProgressIndicator from "@/components/ui/progress-indicator";

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  onSuccess: () => void;
  templateColumns: string[];
  sampleData?: Record<string, any>[];
  validateRow?: (row: Record<string, any>) => string[] | Promise<string[]>;
  processRow?: (row: Record<string, any>) => Promise<any>;
  customDownloadTemplate?: () => Promise<void>; // New prop for custom template download
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

const BulkUpdateModal = ({
  isOpen,
  onClose,
  entityType,
  onSuccess,
  templateColumns,
  sampleData = [],
  validateRow,
  processRow,
  customDownloadTemplate
}: BulkUpdateModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);
  const [bulkUploadLogger] = useState(() => new BulkUploadLogger(entityType));
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0
  });
  const [progressTracker] = useState(() => new ProgressTracker(setProcessingProgress));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = async () => {
    try {
      if (customDownloadTemplate) {
        await customDownloadTemplate();
      } else {
        downloadCSVTemplate(entityType, templateColumns, sampleData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const downloadErrorReport = () => {
    bulkUploadLogger.downloadErrorReport();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const data = parseCSVContent(content);
      
      const parsed: ParsedRow[] = data.map((row, index) => ({
        rowNumber: index + 2, // +2 because row 1 is headers
        data: row,
        errors: [],
        isValid: true
      }));
      
      setParsedData(parsed);
      setValidationComplete(false);
      setImportSummary(null);
    };
    
    reader.readAsText(selectedFile);
  };

  const validateData = async () => {
    if (!validateRow || parsedData.length === 0) return;
    
    setIsValidating(true);
    bulkUploadLogger.clear();
    
    const validated: ParsedRow[] = [];
    
    for (const row of parsedData) {
      try {
        const errors = await validateRow(row.data);
        const isValid = errors.length === 0;
        
        validated.push({
          ...row,
          errors,
          isValid
        });
        
        if (!isValid) {
          bulkUploadLogger.logError(row.rowNumber, row.data, errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
        validated.push({
          ...row,
          errors: [errorMessage],
          isValid: false
        });
        
        bulkUploadLogger.logError(row.rowNumber, row.data, [errorMessage]);
      }
    }
    
    setParsedData(validated);
    setValidationComplete(true);
    setIsValidating(false);
    
    const validCount = validated.filter(row => row.isValid).length;
    const invalidCount = validated.length - validCount;
    
    toast({
      title: "Validation Complete",
      description: `${validCount} valid rows, ${invalidCount} invalid rows`,
      variant: invalidCount > 0 ? "destructive" : "default",
    });
  };

  const importData = async () => {
    if (!processRow) return;
    
    const validRows = parsedData.filter(row => row.isValid);
    if (validRows.length === 0) {
      toast({
        title: "No valid data",
        description: "Please fix validation errors before importing",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    progressTracker.reset(validRows.length);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const row of validRows) {
      try {
        await processRow(row.data);
        successCount++;
        progressTracker.incrementSuccess();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
        bulkUploadLogger.logError(row.rowNumber, row.data, [errorMessage]);
        failedCount++;
        progressTracker.incrementFailed();
      }
    }
    
    setImportSummary({
      total: validRows.length,
      success: successCount,
      failed: failedCount
    });
    
    setIsImporting(false);
    
    if (successCount > 0) {
      onSuccess();
      toast({
        title: "Bulk Update Complete",
        description: `${successCount} records updated successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        variant: failedCount > 0 ? "destructive" : "default",
      });
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setValidationComplete(false);
    setImportSummary(null);
    bulkUploadLogger.clear();
    progressTracker.reset(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const validRowsCount = parsedData.filter(row => row.isValid).length;
  const invalidRowsCount = parsedData.length - validRowsCount;
  const hasErrors = bulkUploadLogger.getErrorCount() > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Bulk Update - {entityType}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This bulk update functionality allows you to update existing records only. 
                Master data fields are managed through the Master Data module. Only non-master data fields can be updated here.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-4">
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Update Template
              </Button>
              {hasErrors && (
                <Button onClick={downloadErrorReport} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Error Report
                </Button>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="file-upload">Upload CSV File for Bulk Update</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
          </div>

          {/* Progress Indicator */}
          {(isValidating || isImporting) && (
            <ProgressIndicator
              total={processingProgress.total}
              processed={processingProgress.processed}
              successful={processingProgress.successful}
              failed={processingProgress.failed}
              isProcessing={isValidating || isImporting}
              stage={isValidating ? 'validation' : isImporting ? 'processing' : 'completed'}
            />
          )}

          {/* Validation Results */}
          {parsedData.length > 0 && !isValidating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Valid: {validRowsCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Invalid: {invalidRowsCount}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!validationComplete && (
                    <Button onClick={validateData} disabled={isValidating}>
                      {isValidating ? "Validating..." : "Validate Data"}
                    </Button>
                  )}
                  {validationComplete && validRowsCount > 0 && (
                    <Button 
                      onClick={importData} 
                      disabled={isImporting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isImporting ? "Updating..." : `Update ${validRowsCount} Records`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Data Preview */}
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Status</TableHead>
                      {templateColumns.slice(0, 4).map(col => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((row, index) => (
                      <TableRow key={index} className={row.isValid ? "" : "bg-red-50"}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </TableCell>
                        {templateColumns.slice(0, 4).map(col => (
                          <TableCell key={col}>
                            {String(row.data[col] || '-').substring(0, 50)}
                          </TableCell>
                        ))}
                        <TableCell>
                          {row.errors.length > 0 && (
                            <div className="text-red-600 text-sm">
                              {row.errors.slice(0, 2).join(', ')}
                              {row.errors.length > 2 && '...'}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 50 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Showing first 50 rows of {parsedData.length} total rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Summary */}
          {importSummary && (
            <Alert className={importSummary.failed > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Update Complete:</strong> {importSummary.success} records updated successfully
                {importSummary.failed > 0 && `, ${importSummary.failed} failed`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUpdateModal;