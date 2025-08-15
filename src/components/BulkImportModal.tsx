import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportResult {
  row: number;
  data?: any;
  error?: string;
  success: boolean;
}

interface ImportResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    successful: number;
    failed: number;
    results: ImportResult[];
    errorReportUrl?: string;
  };
}

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(
        'https://sezbixunulacdednlrtl.supabase.co/functions/v1/bulk-import-addons',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result: ImportResponse = await response.json();
      setImportResults(result);

      if (result.success) {
        toast({
          title: "Import Completed",
          description: result.message,
        });
        onSuccess();
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload and process the file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!importResults?.data?.results) return;

    const errorRows = importResults.data.results.filter(r => !r.success);
    if (errorRows.length === 0) return;

    const csvContent = [
      'Row,Error',
      ...errorRows.map(r => `${r.row},"${r.error}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `addon-import-errors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const templateContent = [
      'addon_code,addon_name,addon_category,description,premium_type,premium_basis,calc_value,min_amount,max_amount,waiting_period_months,is_mandatory,is_active,eligibility_json',
      'SAMPLE_CODE,Sample Add-on,Add-on,Sample description,Flat,PerPolicy,1000,500,5000,3,false,true,"{""age_min"": 18}"'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'addon-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setSelectedFile(null);
    setImportResults(null);
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import Add-ons
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Alert>
            <FileText className="w-4 h-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download the template to see the required format</span>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Select CSV File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Processing...' : 'Import Add-ons'}
                </Button>

                <Button variant="outline" onClick={resetModal} disabled={uploading}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {importResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResults.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResults.data?.total || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.data?.successful || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResults.data?.failed || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>

                {importResults.data?.failed && importResults.data.failed > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">
                        {importResults.data.failed} rows failed to import
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadErrorReport}
                      className="text-red-600 border-red-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Error Report
                    </Button>
                  </div>
                )}

                {/* Show detailed results if there are errors */}
                {importResults.data?.results && importResults.data.failed > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <div className="space-y-1 p-2">
                      {importResults.data.results
                        .filter(r => !r.success)
                        .slice(0, 10)
                        .map((result, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">Row {result.row}</Badge>
                            <span className="text-red-600">{result.error}</span>
                          </div>
                        ))}
                      {importResults.data.results.filter(r => !r.success).length > 10 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          ... and {importResults.data.results.filter(r => !r.success).length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportModal;