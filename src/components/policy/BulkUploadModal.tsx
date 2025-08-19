import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkUploadModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationRow {
  row: number;
  policyNumber: string;
  holderName: string;
  status: 'valid' | 'invalid';
  errors: string[];
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  tenantId,
  isOpen,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [validationData, setValidationData] = useState<ValidationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.match(/\.(csv|xlsx)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    // Mock validation data
    setTimeout(() => {
      const mockData: ValidationRow[] = [
        {
          row: 1,
          policyNumber: 'POL001236',
          holderName: 'Alice Johnson',
          status: 'valid',
          errors: []
        },
        {
          row: 2,
          policyNumber: 'POL001237',
          holderName: 'Bob Wilson',
          status: 'invalid',
          errors: ['Invalid premium amount', 'Missing expiry date']
        }
      ];
      
      setValidationData(mockData);
      setStep('preview');
      setLoading(false);
    }, 1500);
  };

  const handleImport = async () => {
    setLoading(true);
    
    try {
      // Stub for bulk import API
      // await fetch(`/api/v1/tenant-admin/${tenantId}/policies/bulk-import`, {
      //   method: 'POST',
      //   body: formData
      // });

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const validRows = validationData.filter(row => row.status === 'valid').length;
      
      toast({
        title: "Bulk import completed",
        description: `Successfully imported ${validRows} policies`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import policies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validRows = validationData.filter(row => row.status === 'valid').length;
  const invalidRows = validationData.filter(row => row.status === 'invalid').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Policies</DialogTitle>
          <DialogDescription>
            Upload multiple policies using CSV or Excel file
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download Template</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
            </div>

            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Upload your policy file</p>
                <p className="text-sm text-muted-foreground">CSV or Excel format accepted</p>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>

            {loading && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Validating file...</p>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Validation Results</h3>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{validRows} Valid</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>{invalidRows} Invalid</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Holder Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationData.map((row) => (
                    <TableRow key={row.row}>
                      <TableCell>{row.row}</TableCell>
                      <TableCell>{row.policyNumber}</TableCell>
                      <TableCell>{row.holderName}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'valid' ? 'default' : 'destructive'}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <div className="text-xs text-red-600">
                            {row.errors.join(', ')}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === 'preview' && (
            <Button onClick={handleImport} disabled={loading || validRows === 0}>
              {loading ? 'Importing...' : `Import ${validRows} Valid Policies`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};