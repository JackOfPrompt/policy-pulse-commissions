import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  onSuccess: () => void;
  templateColumns: string[];
  sampleData?: Record<string, any>[];
  validateRow?: (row: Record<string, any>) => string[] | Promise<string[]>;
  processRow?: (row: Record<string, any>) => Promise<any>;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

const BulkUploadModal = ({
  isOpen,
  onClose,
  entityType,
  onSuccess,
  templateColumns,
  sampleData = [],
  validateRow,
  processRow
}: BulkUploadModalProps) => {
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
    if (!validateRow) {
      setValidationComplete(true);
      return;
    }

    setIsValidating(true);
    
    try {
      const validated = await Promise.all(
        parsedData.map(async (row) => {
          const errors = await Promise.resolve(validateRow(row.data));
          return {
            ...row,
            errors,
            isValid: errors.length === 0
          };
        })
      );
      
      setParsedData(validated);
      setValidationComplete(true);

      const validRows = validated.filter(row => row.isValid);
      toast({
        title: "Validation complete",
        description: `${validRows.length} out of ${validated.length} rows are valid`,
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
    if (!processRow) return;

    setIsImporting(true);
    const validRows = parsedData.filter(row => row.isValid);
    let successCount = 0;
    let failedCount = 0;

    try {
      // Enhanced processing with error logging
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
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await bulkUploadLogger.logProcessingError(row.rowNumber, row.data, errorMessage);
        }

        // Update progress
        progressTracker.updateProgress({
          total,
          processed: i + 1,
          successful: successCount,
          failed: failedCount,
          currentRow: row.rowNumber
        });
      }

      setImportSummary({
        total: validRows.length,
        success: successCount,
        failed: failedCount
      });

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} out of ${validRows.length} records`,
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedData([]);
    setValidationComplete(false);
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validRowsCount = parsedData.filter(row => row.isValid).length;
  const canImport = validationComplete && validRowsCount > 0 && !isImporting;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload {entityType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <span className="text-sm text-muted-foreground">
              Download the CSV template with sample data
            </span>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csvFile">Upload CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
          </div>

          {/* Preview and Validation */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={validateData}
                  disabled={isValidating || validationComplete}
                >
                  {isValidating ? "Validating..." : "Validate Data"}
                </Button>
                
                {validationComplete && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {validRowsCount} valid rows out of {parsedData.length}
                    </span>
                  </div>
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

          {/* Data Preview */}
              <div className="border rounded-lg max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Status</TableHead>
                      {templateColumns.map(col => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                      {validationComplete && <TableHead>Errors</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>
                          {validationComplete ? (
                            row.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : (
                            <div className="h-4 w-4 bg-gray-300 rounded" />
                          )}
                        </TableCell>
                        {templateColumns.map(col => (
                          <TableCell key={`${row.rowNumber}-${col}`}>{row.data[col]}</TableCell>
                        ))}
                        {validationComplete && (
                          <TableCell>
                            {row.errors.length > 0 && (
                              <div className="text-xs text-red-600">
                                 {row.errors.slice(0, 2).map((error, i) => (
                                   <div key={`${row.rowNumber}-error-${i}`}>{error}</div>
                                 ))}
                                {row.errors.length > 2 && (
                                  <div className="text-muted-foreground">
                                    +{row.errors.length - 2} more...
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 10 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Showing first 10 rows of {parsedData.length}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Button */}
          {canImport && (
            <Button 
              onClick={importData}
              disabled={!canImport}
              className="bg-gradient-primary"
            >
              Import {validRowsCount} Valid Records
            </Button>
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

              {(importSummary.failed > 0 || bulkUploadLogger.getErrors().length > 0) && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={downloadErrorReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;