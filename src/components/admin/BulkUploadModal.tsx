import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, CheckCircle, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  onSuccess: () => void;
  templateColumns: string[];
  sampleData?: Record<string, any>[];
  validateRow?: (row: Record<string, any>) => string[];
  processRow?: (row: Record<string, any>) => Promise<any>;
}

interface ParsedRow {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csvContent = [
      templateColumns.join(','),
      ...sampleData.map(row => 
        templateColumns.map(col => row[col] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType.toLowerCase()}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvContent: string): Record<string, any>[] => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
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
      const data = parseCSV(content);
      
      const parsed: ParsedRow[] = data.map(row => ({
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
    
    const validated = parsedData.map(row => {
      const errors = validateRow(row.data);
      return {
        ...row,
        errors,
        isValid: errors.length === 0
      };
    });
    
    setParsedData(validated);
    setValidationComplete(true);
    setIsValidating(false);

    const validRows = validated.filter(row => row.isValid);
    toast({
      title: "Validation complete",
      description: `${validRows.length} out of ${validated.length} rows are valid`,
    });
  };

  const importData = async () => {
    if (!processRow) return;

    setIsImporting(true);
    const validRows = parsedData.filter(row => row.isValid);
    let successCount = 0;
    let failedCount = 0;

    try {
      // Create upload history record
      const { data: uploadRecord } = await supabase
        .from("upload_history")
        .insert({
          entity_type: entityType,
          file_name: file?.name || 'unknown',
          total_rows: validRows.length,
          status: 'Processing'
        })
        .select()
        .single();

      for (const row of validRows) {
        try {
          await processRow(row.data);
          successCount++;
        } catch (error) {
          failedCount++;
          console.error('Failed to process row:', error);
        }
      }

      // Update upload history
      if (uploadRecord) {
        await supabase
          .from("upload_history")
          .update({
            success_count: successCount,
            failure_count: failedCount,
            status: failedCount === 0 ? 'Completed' : 'Partial'
          })
          .eq('id', uploadRecord.id);
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

              {/* Data Preview */}
              <div className="border rounded-lg max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                          <TableCell key={col}>{row.data[col]}</TableCell>
                        ))}
                        {validationComplete && (
                          <TableCell>
                            {row.errors.length > 0 && (
                              <div className="text-xs text-red-600">
                                {row.errors.join(', ')}
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
          {importSummary && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Import completed: {importSummary.success} successful, {importSummary.failed} failed out of {importSummary.total} records.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;