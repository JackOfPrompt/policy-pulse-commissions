import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, CheckCircle, XCircle, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  BulkUploadLogger, 
  ProgressTracker, 
  ProcessingProgress,
  parseCSVContent,
  downloadCSVTemplate 
} from "@/utils/bulkUploadUtils";
import ProgressIndicator from "@/components/ui/progress-indicator";

interface EnhancedBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  onSuccess: () => void;
  templateColumns: string[];
  sampleData?: Record<string, any>[];
  validateRow: (row: Record<string, any>) => Promise<string[]>;
  processRow: (row: Record<string, any>) => Promise<any>;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  errorRows: ParsedRow[];
}

const EnhancedBulkUploadModal = ({
  isOpen,
  onClose,
  entityType,
  onSuccess,
  templateColumns,
  sampleData = [],
  validateRow,
  processRow
}: EnhancedBulkUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
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

  const downloadTemplate = () => {
    downloadCSVTemplate(entityType, templateColumns, sampleData);
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
    setIsValidating(true);
    
    try {
      const total = parsedData.length;
      setProcessingProgress({
        total,
        processed: 0,
        successful: 0,
        failed: 0
      });

      const validated = [];
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const errors = await validateRow(row.data);
        const isValid = errors.length === 0;
        
        const validatedRow = {
          ...row,
          errors,
          isValid
        };
        
        validated.push(validatedRow);

        // Log validation errors
        if (!isValid) {
          await bulkUploadLogger.logValidationError(row.rowNumber, row.data, errors);
        }

        // Update progress
        progressTracker.updateProgress({
          total,
          processed: i + 1,
          successful: validated.filter(r => r.isValid).length,
          failed: validated.filter(r => !r.isValid).length,
          currentRow: row.rowNumber
        });
      }
      
      setParsedData(validated);
      setValidationComplete(true);

      const validRows = validated.filter(row => row.isValid);
      const invalidRows = validated.filter(row => !row.isValid);

      toast({
        title: "Validation complete",
        description: `${validRows.length} out of ${validated.length} rows are valid`,
        variant: invalidRows.length > 0 ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "An error occurred during validation",
        variant: "destructive",
      });
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const importData = async () => {
    setIsImporting(true);
    const validRows = parsedData.filter(row => row.isValid);
    let successCount = 0;
    const failedRows: ParsedRow[] = [];

    try {
      const total = validRows.length;
      setProcessingProgress({
        total,
        processed: 0,
        successful: 0,
        failed: 0
      });

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        try {
          await processRow(row.data);
          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedRows.push({
            ...row,
            errors: [...row.errors, errorMessage],
            isValid: false
          });
          
          // Log import errors
          await bulkUploadLogger.logProcessingError(row.rowNumber, row.data, errorMessage);
        }

        // Update progress
        progressTracker.updateProgress({
          total,
          processed: i + 1,
          successful: successCount,
          failed: failedRows.length,
          currentRow: row.rowNumber
        });
      }

      const summary: ImportSummary = {
        total: validRows.length,
        success: successCount,
        failed: failedRows.length,
        errorRows: failedRows
      };

      setImportSummary(summary);

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} out of ${validRows.length} records`,
        });
        
        if (successCount === validRows.length) {
          onSuccess();
        }
      }

      if (failedRows.length > 0) {
        toast({
          title: "Some records failed",
          description: `${failedRows.length} records failed to import. Download error report for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setValidationComplete(false);
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload {entityType}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Download Template</h3>
              <p className="text-sm text-muted-foreground">
                Download the CSV template with sample data
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="text-sm font-medium">
                Upload CSV File
              </label>
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>

            {file && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  File loaded: {file.name} ({parsedData.length} rows)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Progress Indicator */}
          {(isValidating || isImporting) && (
            <ProgressIndicator
              total={processingProgress.total}
              processed={processingProgress.processed}
              successful={processingProgress.successful}
              failed={processingProgress.failed}
              currentRow={processingProgress.currentRow}
              estimatedTimeRemaining={processingProgress.estimatedTimeRemaining}
              isProcessing={isValidating || isImporting}
              stage={isValidating ? 'validation' : isImporting ? 'processing' : 'completed'}
            />
          )}

          {/* Validation */}
          {parsedData.length > 0 && !validationComplete && !isValidating && (
            <div className="flex justify-center">
              <Button 
                onClick={validateData} 
                disabled={isValidating}
                className="w-full max-w-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate Data
              </Button>
            </div>
          )}

          {/* Validation Results */}
          {validationComplete && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {parsedData.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {parsedData.filter(row => row.isValid).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Valid Rows</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {parsedData.filter(row => !row.isValid).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Invalid Rows</div>
                </div>
              </div>

              {parsedData.filter(row => row.isValid).length > 0 && !isImporting && (
                <div className="flex justify-center">
                  <Button 
                    onClick={importData} 
                    disabled={isImporting}
                    className="w-full max-w-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Valid Rows
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Import Summary */}
          {importSummary && !isImporting && (
            <div className="space-y-4">
              <ProgressIndicator
                total={importSummary.total}
                processed={importSummary.total}
                successful={importSummary.success}
                failed={importSummary.failed}
                isProcessing={false}
                stage="completed"
              />

              {(importSummary.errorRows.length > 0 || bulkUploadLogger.getErrors().length > 0) && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={downloadErrorReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Preview */}
          {parsedData.filter(row => !row.isValid).length > 0 && validationComplete && (
            <div className="space-y-2">
              <h3 className="font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                Validation Errors (showing first 5)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Data Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData
                      .filter(row => !row.isValid)
                      .slice(0, 5)
                      .map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.rowNumber}</TableCell>
                          <TableCell>
                            <div className="text-sm text-red-600">
                              {row.errors.slice(0, 2).map((error, i) => (
                                <div key={i}>{error}</div>
                              ))}
                              {row.errors.length > 2 && (
                                <div className="text-muted-foreground">
                                  +{row.errors.length - 2} more...
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {Object.entries(row.data)
                                .slice(0, 3)
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value).slice(0, 30)}
                                    {String(value).length > 30 && '...'}
                                  </div>
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
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedBulkUploadModal;