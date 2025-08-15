import React, { useState } from "react";
import { Upload, Download, X, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'categories' | 'subcategories' | 'policy-tenure';
  onImportComplete: () => void;
}

export function BulkImportDialog({ open, onOpenChange, type, onImportComplete }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [step, setStep] = useState<'select' | 'uploading' | 'complete'>('select');
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    let fileName = '';

    if (type === 'categories') {
      csvContent = 'category_code,category_name,category_desc,is_active\n';
      csvContent += 'SAMPLE_CODE,Sample Category Name,Sample description,true\n';
      fileName = 'category_template.csv';
    } else if (type === 'subcategories') {
      csvContent = 'category_code,subcategory_code,subcategory_name,subcategory_desc,is_active\n';
      csvContent += 'HEALTH_INDIV,SAMPLE_SUB,Sample Subcategory,Sample subcategory description,true\n';
      fileName = 'subcategory_template.csv';
    } else if (type === 'policy-tenure') {
      csvContent = 'tenure_name,duration_value,duration_unit,is_active\n';
      csvContent += '1 Year,1,Years,true\n';
      csvContent += '5 Years,5,Years,true\n';
      fileName = 'policy_tenure_template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!result || result.errors.length === 0) return;

    let csvContent = 'Row,Error,Data\n';
    result.errors.forEach(error => {
      const dataStr = JSON.stringify(error.data).replace(/"/g, '""');
      csvContent += `${error.row},"${error.error}","${dataStr}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_import_errors.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStep('uploading');
    setProgress(0);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      setProgress(20);

      const endpoint = type === 'categories' ? 'bulk-import-categories' : 
                      type === 'subcategories' ? 'bulk-import-subcategories' : 'bulk-import-policy-tenure';
      
      const { data: response, error } = await supabase.functions.invoke(endpoint, {
        body: { data },
      });

      setProgress(100);

      if (error) throw error;

      if (response?.success) {
        setResult(response.result);
        setStep('complete');
        onImportComplete();
        
        toast({
          title: "Import completed",
          description: `Successfully imported ${response.result.successful} out of ${response.result.total} records`,
        });
      } else {
        throw new Error(response?.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
      setStep('select');
    } finally {
      setUploading(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setResult(null);
    setStep('select');
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Bulk Import {type === 'categories' ? 'Categories' : 
                        type === 'subcategories' ? 'Subcategories' : 'Policy Tenure'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload a CSV file to bulk import {type}. Download the template below to see the required format.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to select CSV file or drag and drop
                  </p>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file}>
                <Upload className="mr-2 h-4 w-4" />
                Start Import
              </Button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium">Processing Import</h3>
              <p className="text-gray-600">Please wait while we process your file...</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </div>
        )}

        {step === 'complete' && result && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{result.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Successful</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                </CardContent>
              </Card>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-red-600">Import Errors</h4>
                  <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Report
                  </Button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.errors.slice(0, 5).map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Row {error.row}:</strong> {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      And {result.errors.length - 5} more errors. Download the full report for details.
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.failed === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All records imported successfully! 🎉
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={resetDialog}>
                Import More
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}