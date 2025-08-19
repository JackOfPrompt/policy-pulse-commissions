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
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Policy {
  id: string;
  policyNumber: string;
  holderName: string;
  expiryDate: string;
}

interface RenewPolicyModalProps {
  policy: Policy;
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export const RenewPolicyModal: React.FC<RenewPolicyModalProps> = ({
  policy,
  isOpen,
  onClose,
  tenantId
}) => {
  const [newExpiryDate, setNewExpiryDate] = useState<Date>();
  const [renewalPremium, setRenewalPremium] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setUploadedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file",
          variant: "destructive",
        });
      }
    }
  };

  const handleRenewal = async () => {
    if (!newExpiryDate || !renewalPremium) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Stub for API call
      // const response = await fetch(`/api/v1/tenant-admin/${tenantId}/policies/${policy.id}/renewals`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     newExpiryDate: newExpiryDate.toISOString(),
      //     renewalPremium: parseFloat(renewalPremium),
      //     hasDocument: !!uploadedFile
      //   })
      // });

      // if (uploadedFile) {
      //   const formData = new FormData();
      //   formData.append('document', uploadedFile);
      //   await fetch(`/api/v1/tenant-admin/${tenantId}/policies/${policy.id}/documents`, {
      //     method: 'POST',
      //     body: formData
      //   });
      // }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Policy renewed successfully",
        description: `Policy ${policy.policyNumber} has been renewed until ${format(newExpiryDate, 'PPP')}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Renewal failed",
        description: "Failed to renew policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Renew Policy</DialogTitle>
          <DialogDescription>
            Renew policy {policy.policyNumber} for {policy.holderName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Expiry Date</Label>
            <Input 
              value={format(new Date(policy.expiryDate), 'PPP')} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-expiry">New Expiry Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newExpiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newExpiryDate ? format(newExpiryDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newExpiryDate}
                  onSelect={setNewExpiryDate}
                  disabled={(date) => date < new Date(policy.expiryDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal-premium">Renewal Premium (₹) *</Label>
            <Input
              id="renewal-premium"
              type="number"
              placeholder="Enter renewal premium amount"
              value={renewalPremium}
              onChange={(e) => setRenewalPremium(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy-document">Updated Policy Document (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="policy-document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-muted file:text-muted-foreground"
              />
              {uploadedFile && (
                <div className="text-sm text-muted-foreground">
                  {uploadedFile.name}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 10MB)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRenewal} disabled={loading}>
            {loading ? "Renewing..." : "Renew Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};