import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, User, FileText, DollarSign } from 'lucide-react';

interface Lead {
  id: string;
  leadNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  productInterest: string;
  leadSource: string;
  assignedTo: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'In Discussion' | 'Converted' | 'Dropped';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  estimatedValue?: number;
  remarks?: string;
  daysSinceLastContact?: number;
}

interface ConvertToPolicyProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export const ConvertToPolicy: React.FC<ConvertToPolicyProps> = ({
  lead,
  open,
  onClose
}) => {
  const [step, setStep] = useState<'confirm' | 'form' | 'success'>('confirm');
  const [policyData, setPolicyData] = useState({
    customerName: lead.customerName,
    customerPhone: lead.phone,
    customerEmail: lead.email || '',
    productType: lead.productInterest,
    sumInsured: lead.estimatedValue?.toString() || '',
    premiumAmount: '',
    paymentFrequency: 'Annual',
    policyTerm: '',
    remarks: `Converted from lead ${lead.leadNumber}. ${lead.remarks || ''}`.trim()
  });

  const handleConfirmConversion = () => {
    setStep('form');
  };

  const handleFormSubmit = () => {
    // Validate form
    if (!policyData.sumInsured || !policyData.premiumAmount) {
      alert('Please fill in all required fields');
      return;
    }

    // Submit policy data to database
    console.log('Converting lead to policy:', {
      leadId: lead.id,
      policyData
    });

    // Show success
    setStep('success');

    // Auto close after 3 seconds
    setTimeout(() => {
      onClose();
      setStep('confirm'); // Reset for next time
    }, 3000);
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Convert Lead to Policy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'confirm' && (
            <>
              {/* Lead Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lead Number</label>
                      <p className="font-medium">{lead.leadNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div>
                        <Badge variant="default">{lead.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                      <p className="font-medium">{lead.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Product Interest</label>
                      <p className="font-medium">{lead.productInterest}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p>{lead.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Estimated Value</label>
                      <p className="font-medium text-green-600">
                        {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString()}` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmation */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-900">Ready to Convert</h3>
                      <p className="text-sm text-green-700">
                        This lead will be marked as "Converted" and a new policy entry will be created with pre-filled information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmConversion}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue to Policy Form
                </Button>
              </div>
            </>
          )}

          {step === 'form' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Policy Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer Name *</label>
                      <Input
                        value={policyData.customerName}
                        onChange={(e) => setPolicyData({...policyData, customerName: e.target.value})}
                        placeholder="Customer name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number *</label>
                      <Input
                        value={policyData.customerPhone}
                        onChange={(e) => setPolicyData({...policyData, customerPhone: e.target.value})}
                        placeholder="Phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={policyData.customerEmail}
                        onChange={(e) => setPolicyData({...policyData, customerEmail: e.target.value})}
                        placeholder="Email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product Type *</label>
                      <Select value={policyData.productType} onValueChange={(value) => setPolicyData({...policyData, productType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Motor Insurance">Motor Insurance</SelectItem>
                          <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                          <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                          <SelectItem value="Travel Insurance">Travel Insurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sum Insured *</label>
                      <Input
                        type="number"
                        value={policyData.sumInsured}
                        onChange={(e) => setPolicyData({...policyData, sumInsured: e.target.value})}
                        placeholder="Sum insured amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Premium Amount *</label>
                      <Input
                        type="number"
                        value={policyData.premiumAmount}
                        onChange={(e) => setPolicyData({...policyData, premiumAmount: e.target.value})}
                        placeholder="Premium amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Frequency</label>
                      <Select value={policyData.paymentFrequency} onValueChange={(value) => setPolicyData({...policyData, paymentFrequency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Annual">Annual</SelectItem>
                          <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Policy Term (Years)</label>
                      <Input
                        type="number"
                        value={policyData.policyTerm}
                        onChange={(e) => setPolicyData({...policyData, policyTerm: e.target.value})}
                        placeholder="Policy term in years"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Remarks</label>
                    <Textarea
                      value={policyData.remarks}
                      onChange={(e) => setPolicyData({...policyData, remarks: e.target.value})}
                      placeholder="Additional remarks"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep('confirm')}>
                  Back
                </Button>
                <Button onClick={handleFormSubmit}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Conversion Successful!</h3>
                    <p className="text-green-700">
                      Lead has been converted to policy successfully. The policy is now in underwriting status.
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-green-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Lead Number:</span>
                      <span className="text-sm">{lead.leadNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Customer:</span>
                      <span className="text-sm">{policyData.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Premium:</span>
                      <span className="text-sm font-semibold text-green-600">
                        ₹{parseInt(policyData.premiumAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    This window will close automatically in a few seconds...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};