import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, FileText, User, Building, Shield, CheckCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface ReviewSubmitProps {
  purchaseData: any;
  context: {
    initiatedByRole: 'admin' | 'employee' | 'agent' | 'customer';
    initiatedById: string;
    canSelectOnBehalf?: boolean;
  };
  onSubmit: () => void;
  onPrevious: () => void;
  loading: boolean;
}

export const ReviewSubmit: React.FC<ReviewSubmitProps> = ({
  purchaseData,
  context,
  onSubmit,
  onPrevious,
  loading,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const policyData = purchaseData.policyData || {};
  const grossPremium = policyData.grossPremium || 0;
  const netPremium = policyData.netPremium || grossPremium;
  const gstRate = policyData.selectGST || '18%';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Review & Submit</h3>
        <p className="text-muted-foreground">
          Please review your policy details before submission
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Policy Details */}
        <div className="space-y-4">
          {/* Line of Business */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Insurance Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-medium">{purchaseData.lineOfBusiness}</span>
                <Badge variant="outline">
                  {purchaseData.lineOfBusiness}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Provider */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4" />
                Insurance Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{purchaseData.providerName}</p>
            </CardContent>
          </Card>

          {/* Product */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{purchaseData.productName}</p>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {policyData.customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{policyData.customerName}</span>
                </div>
              )}
              {policyData.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{policyData.customerPhone}</span>
                </div>
              )}
              {policyData.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{policyData.customerEmail}</span>
                </div>
              )}
              {policyData.customerDOB && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="font-medium">{policyData.customerDOB}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financial Details & Summary */}
        <div className="space-y-4">
          {/* Premium Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Premium Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Premium:</span>
                <span className="font-medium">{formatCurrency(grossPremium)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({gstRate}):</span>
                <span className="font-medium">
                  {formatCurrency((grossPremium * parseFloat(gstRate)) / 100)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Net Premium:</span>
                <span className="text-primary">{formatCurrency(netPremium)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Policy Coverage */}
          {policyData.sumInsured && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Coverage Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sum Insured:</span>
                  <span className="font-medium">{policyData.sumInsured}</span>
                </div>
                {policyData.policyTerm && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Policy Term:</span>
                    <span className="font-medium">{policyData.policyTerm}</span>
                  </div>
                )}
                {policyData.paymentMode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <span className="font-medium">{policyData.paymentMode}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Source Information */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <Badge variant="default">
                  {context.initiatedByRole.charAt(0).toUpperCase() + context.initiatedByRole.slice(1)} Portal
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Type:</span>
                <span className="font-medium">Online Purchase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary">
                  Will be submitted for Underwriting
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    By submitting this policy, you agree to the terms and conditions 
                    of the insurance provider and confirm that all information provided is accurate.
                  </p>
                  <p>
                    The policy will be reviewed during underwriting and you will be 
                    notified of the status via email and SMS.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="min-w-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Submit Policy
            </>
          )}
        </Button>
      </div>
    </div>
  );
};