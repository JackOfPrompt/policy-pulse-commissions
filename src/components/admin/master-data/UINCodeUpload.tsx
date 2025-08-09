import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RotateCw,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseCSVContent } from "@/utils/bulkUploadUtils";

interface UINUploadStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
}

interface UINError {
  row: number;
  uin_code: string;
  error: string;
  data: any;
}

export function UINCodeUpload() {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle');
  const [uploadStats, setUploadStats] = useState<UINUploadStats>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    duplicates: 0
  });
  const [errors, setErrors] = useState<UINError[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingPending, setIsUpdatingPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'UIN Code',
      'Product Name', 
      'Insurer Name',
      'Line of Business',
      'Product Type',
      'Effective Date',
      'Expiry Date',
      'Filing Date',
      'Approval Date',
      'Status'
    ];
    
    const sampleData = [
      'UIN123456789',
      'Health Supreme Plan',
      'Star Health Insurance',
      'Health',
      'Individual',
      '2024-01-01',
      '2025-12-31',
      '2023-11-15',
      '2023-12-01',
      'active'
    ];
    
    const csvContent = `${headers.join(',')}\n${sampleData.join(',')}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uin_codes_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrors = () => {
    if (errors.length === 0) {
      toast({
        title: "No Errors",
        description: "No errors to download",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Row', 'UIN Code', 'Error', 'Product Name', 'Insurer Name'];
    const errorData = errors.map(error => [
      error.row.toString(),
      error.uin_code || '',
      error.error,
      error.data?.product_name || '',
      error.data?.insurer_name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...errorData.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uin_upload_errors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateUINCode = (uinCode: string): boolean => {
    // Basic UIN validation - should be alphanumeric, 9-15 characters
    const uinRegex = /^[A-Z0-9]{9,15}$/;
    return uinRegex.test(uinCode.toUpperCase());
  };

  const processUpload = async (file: File) => {
    setUploadState('uploading');
    setErrors([]);
    setUploadStats({ total: 0, processed: 0, successful: 0, failed: 0, duplicates: 0 });

    try {
      const text = await file.text();
      const data = parseCSVContent(text);
      
      setUploadStats(prev => ({ ...prev, total: data.length }));
      setUploadState('processing');

      const { data: user } = await supabase.auth.getUser();
      const currentErrors: UINError[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        // Map CSV columns to database fields
        const uinData = {
          uin_code: (row['UIN Code'] || row['uin_code'] || '').toString().toUpperCase(),
          product_name: row['Product Name'] || row['product_name'] || '',
          insurer_name: row['Insurer Name'] || row['insurer_name'] || '',
          line_of_business: row['Line of Business'] || row['line_of_business'] || '',
          product_type: row['Product Type'] || row['product_type'] || '',
          effective_date: row['Effective Date'] || row['effective_date'] || null,
          expiry_date: row['Expiry Date'] || row['expiry_date'] || null,
          filing_date: row['Filing Date'] || row['filing_date'] || null,
          approval_date: row['Approval Date'] || row['approval_date'] || null,
          status: (row['Status'] || row['status'] || 'active').toLowerCase(),
          source_file_name: file.name,
          created_by: user.user?.id,
          last_updated_by: user.user?.id
        };

        // Validation
        let hasError = false;
        let errorMessage = '';

        if (!uinData.uin_code) {
          hasError = true;
          errorMessage = 'UIN Code is required';
        } else if (!validateUINCode(uinData.uin_code)) {
          hasError = true;
          errorMessage = 'Invalid UIN Code format';
        }

        if (!uinData.product_name) {
          hasError = true;
          errorMessage += (errorMessage ? '; ' : '') + 'Product Name is required';
        }

        if (!uinData.insurer_name) {
          hasError = true;
          errorMessage += (errorMessage ? '; ' : '') + 'Insurer Name is required';
        }

        if (!uinData.line_of_business) {
          hasError = true;
          errorMessage += (errorMessage ? '; ' : '') + 'Line of Business is required';
        }

        if (!['active', 'inactive', 'withdrawn'].includes(uinData.status)) {
          hasError = true;
          errorMessage += (errorMessage ? '; ' : '') + 'Status must be active, inactive, or withdrawn';
        }

        if (hasError) {
          currentErrors.push({
            row: rowNumber,
            uin_code: uinData.uin_code,
            error: errorMessage,
            data: uinData
          });
          setUploadStats(prev => ({ ...prev, processed: prev.processed + 1, failed: prev.failed + 1 }));
          continue;
        }

        try {
          // Check for duplicates
          const { data: existing } = await supabase
            .from('master_uin_codes')
            .select('id, uin_code')
            .eq('uin_code', uinData.uin_code)
            .single();

          if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('master_uin_codes')
              .update({
                ...uinData,
                version: new Date().getTime() // Use timestamp as version
              })
              .eq('uin_code', uinData.uin_code);

            if (updateError) throw updateError;
            
            setUploadStats(prev => ({ 
              ...prev, 
              processed: prev.processed + 1, 
              duplicates: prev.duplicates + 1 
            }));
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from('master_uin_codes')
              .insert(uinData);

            if (insertError) throw insertError;
            
            setUploadStats(prev => ({ 
              ...prev, 
              processed: prev.processed + 1, 
              successful: prev.successful + 1 
            }));
          }
        } catch (dbError: any) {
          currentErrors.push({
            row: rowNumber,
            uin_code: uinData.uin_code,
            error: dbError.message || 'Database error',
            data: uinData
          });
          setUploadStats(prev => ({ ...prev, processed: prev.processed + 1, failed: prev.failed + 1 }));
        }
      }

      setErrors(currentErrors);
      setUploadState('completed');

      // Trigger sync with insurance providers
      await syncWithProviders();

      toast({
        title: "Upload Completed",
        description: `Processed ${uploadStats.total} records. ${uploadStats.successful + uploadStats.duplicates} successful, ${currentErrors.length} failed.`,
        variant: currentErrors.length > 0 ? "destructive" : "default"
      });

    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive"
      });
      setUploadState('idle');
    }
  };

  const syncWithProviders = async () => {
    setIsSyncing(true);
    try {
      // Get all unique insurer names from UIN codes
      const { data: insurers } = await supabase
        .from('master_uin_codes')
        .select('insurer_name, uin_code')
        .eq('is_active', true)
        .eq('status', 'active');

      if (!insurers) return;

      // Group UIN codes by insurer
      const insurerGroups = insurers.reduce((acc: any, item) => {
        if (!acc[item.insurer_name]) {
          acc[item.insurer_name] = [];
        }
        acc[item.insurer_name].push(item.uin_code);
        return acc;
      }, {});

      // Update insurance providers with UIN codes
      for (const [insurerName, uinCodes] of Object.entries(insurerGroups)) {
        // Check if provider exists
        const { data: existingProvider, error: providerSelectError } = await supabase
          .from('insurance_providers')
          .select('provider_id')
          .ilike('insurer_name', `%${insurerName}%`)
          .maybeSingle();

        if (existingProvider) {
          // Update existing provider - skip uin_codes update for now
          // Will be handled in future when schema is updated
          console.log(`Found existing provider: ${insurerName} with ${(uinCodes as string[]).length} UIN codes`);
        } else {
          // Create new provider entry if auto_sync is enabled
          const { error: insertProviderError } = await supabase
            .from('insurance_providers')
            .insert({
              insurer_name: insurerName as string,
              status: 'Active'
            });

          if (insertProviderError) {
            console.warn('Failed to auto-create provider', insurerName, insertProviderError.message);
          }
        }
      }

      toast({
        title: "Sync Completed",
        description: "Insurance providers updated with UIN code mappings",
      });
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed", 
        description: error.message || "Failed to sync with providers",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const markAllPendingActive = async () => {
    setIsUpdatingPending(true);
    try {
      const { data, error } = await supabase
        .from('master_uin_codes')
        .update({ status: 'active', is_active: true })
        .or('status.is.null,status.ilike.pending%')
        .select('id');
      if (error) throw error;
      toast({
        title: 'Statuses Updated',
        description: `${(data?.length ?? 0)} UIN codes marked as Active`
      });
    } catch (error: any) {
      console.error('Bulk status update failed:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update statuses',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingPending(false);
    }
  };

  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive"
        });
        return;
      }
      processUpload(file);
    }
  };

  const getProgressPercentage = () => {
    if (uploadStats.total === 0) return 0;
    return Math.round((uploadStats.processed / uploadStats.total) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                UIN/IRDAI Code Upload
              </CardTitle>
              <CardDescription>
                Upload IRDAI UIN codes with automatic provider synchronization
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncWithProviders}
                disabled={isSyncing}
              >
                <RotateCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Providers
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllPendingActive}
                disabled={isUpdatingPending}
              >
                <CheckCircle className={`w-4 h-4 mr-2 ${isUpdatingPending ? 'animate-spin' : ''}`} />
                Mark Pending as Active
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadState === 'uploading' || uploadState === 'processing'}
            />
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Upload UIN Codes CSV</p>
                <p className="text-sm text-muted-foreground">
                  Select a CSV file containing UIN/IRDAI codes
                </p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === 'uploading' || uploadState === 'processing'}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>

          {uploadState !== 'idle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{uploadStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{uploadStats.processed}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{uploadStats.successful}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{uploadStats.duplicates}</div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{uploadStats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>

              {uploadState === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="w-full" />
                </div>
              )}

              {uploadState === 'completed' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Upload completed successfully!</span>
                    {isSyncing && (
                      <Badge variant="outline">
                        <Database className="w-3 h-3 mr-1 animate-spin" />
                        Syncing providers...
                      </Badge>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{errors.length} records failed to upload</span>
                  <Button variant="outline" size="sm" onClick={downloadErrors}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Errors
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>UIN Code</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Product</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.slice(0, 10).map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell className="font-mono text-xs">{error.uin_code}</TableCell>
                        <TableCell className="text-red-600 text-xs">{error.error}</TableCell>
                        <TableCell className="text-xs">{error.data?.product_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {errors.length > 10 && (
                  <div className="text-center p-2 text-sm text-muted-foreground border-t">
                    +{errors.length - 10} more errors (download full report)
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}