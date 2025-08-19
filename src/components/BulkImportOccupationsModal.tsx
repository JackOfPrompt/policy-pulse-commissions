import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkImportOccupationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

const BulkImportOccupationsModal = ({ isOpen, onClose, onImportComplete }: BulkImportOccupationsModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,code,description,status\n"Software Engineer","OCC001","Develops software applications","Active"\n"Doctor","OCC002","Medical practitioner","Active"\n"Teacher","OCC003","Educational instructor","Active"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'occupations_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!importResult?.errors.length) return;

    const csvContent = [
      'Row,Field,Value,Error',
      ...importResult.errors.map(error => 
        `${error.row},"${error.field}","${error.value}","${error.error}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'occupations_import_errors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processCSV = async (csvText: string): Promise<ImportResult> => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const errors: ImportError[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        // Validation
        if (!row.name) {
          errors.push({
            row: i + 1,
            field: 'name',
            value: row.name,
            error: 'Name is required'
          });
          failedCount++;
          continue;
        }

        if (row.code && row.code.length > 50) {
          errors.push({
            row: i + 1,
            field: 'code',
            value: row.code,
            error: 'Code must be 50 characters or less'
          });
          failedCount++;
          continue;
        }

        if (row.status && !['Active', 'Inactive'].includes(row.status)) {
          errors.push({
            row: i + 1,
            field: 'status',
            value: row.status,
            error: 'Status must be Active or Inactive'
          });
          failedCount++;
          continue;
        }

        // Insert into database
        const { error } = await supabase
          .from('master_occupations')
          .insert({
            occupation_name: row.name,
            occupation_code: row.code || null,
            description: row.description || null,
            is_active: row.status === 'Active'
          });

        if (error) {
          if (error.code === '23505') {
            const duplicateField = error.message.includes('name') ? 'name' : 'code';
            errors.push({
              row: i + 1,
              field: duplicateField,
              value: row[duplicateField],
              error: `${duplicateField} already exists`
            });
          } else {
            errors.push({
              row: i + 1,
              field: 'general',
              value: '',
              error: error.message
            });
          }
          failedCount++;
        } else {
          successCount++;
        }

        // Update progress
        setProgress(Math.round((i / (lines.length - 1)) * 100));
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'general',
          value: '',
          error: 'Unexpected error occurred'
        });
        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      errors
    };
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    setStep('processing');
    setProgress(0);

    try {
      const csvText = await file.text();
      const result = await processCSV(csvText);
      
      setImportResult(result);
      setStep('complete');
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.success} occupations. ${result.failed} failed.`,
        variant: result.failed > 0 ? "destructive" : "default",
      });

      if (result.success > 0) {
        onImportComplete();
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred while processing the file",
        variant: "destructive",
      });
      setStep('upload');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setImportResult(null);
    setStep('upload');
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
      <DialogContent className="max-w-2xl bg-background border shadow-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Occupations</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple occupations at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV Template
                  </CardTitle>
                  <CardDescription>
                    Download the template to ensure your data is in the correct format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={downloadTemplate} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Upload File</CardTitle>
                  <CardDescription>
                    Select a CSV file with occupation data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop your CSV file here, or click to browse
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === 'processing' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Import
                </CardTitle>
                <CardDescription>
                  Please wait while we process your file...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
              </CardContent>
            </Card>
          )}

          {step === 'complete' && importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {importResult.success} Successful
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="destructive">
                      {importResult.failed} Failed
                    </Badge>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium">Errors Found</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-muted-foreground">
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <div className="text-muted-foreground">
                          ... and {importResult.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadErrorReport}
                      className="mt-2 w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Error Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          {step === 'upload' && (
            <Button
              onClick={handleImport}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          )}
          {step === 'complete' && (
            <Button onClick={resetModal}>
              Import Another File
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportOccupationsModal;