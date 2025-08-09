import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Smartphone, Building, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSimulationProps {
  selectedQuote: any;
  selectedAddOns: any[];
  finalPremium: number;
  onPaymentSuccess: (paymentDetails: PaymentResult) => void;
  onPrevious: () => void;
}

interface PaymentResult {
  success: boolean;
  paymentId: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  timestamp: string;
  gateway: 'razorpay' | 'paytm';
  paymentRecordId: string;
  error?: string;
}

export const PaymentSimulation: React.FC<PaymentSimulationProps> = ({
  selectedQuote,
  selectedAddOns,
  finalPremium,
  onPaymentSuccess,
  onPrevious,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [paymentGateway, setPaymentGateway] = useState<'razorpay' | 'paytm'>('razorpay');
  const [processing, setProcessing] = useState(false);
  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const { toast } = useToast();

  const paymentGateways = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Secure & Fast Payments',
      methods: ['UPI', 'Cards', 'Net Banking', 'Wallets']
    },
    {
      id: 'paytm',
      name: 'Paytm',
      description: 'Pay with Paytm Wallet & more',
      methods: ['Paytm Wallet', 'UPI', 'Cards']
    }
  ];

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, Rupay',
      processingFee: 0,
      popular: true,
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Google Pay, PhonePe, Paytm',
      processingFee: 0,
      recommended: true,
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'All major banks',
      processingFee: 0,
    },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    setPaymentAttempted(true);

    try {
      // Create payment record first
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          amount: finalPremium,
          gateway: paymentGateway,
          status: 'pending',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate payment success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        const transactionId = `${paymentGateway.toUpperCase()}_${Date.now()}`;
        
        // Update payment record
        await supabase
          .from('payment_records')
          .update({
            status: 'success',
            transaction_id: transactionId,
            gateway_response: {
              gateway: paymentGateway,
              method: selectedPaymentMethod,
              success: true
            }
          })
          .eq('id', paymentRecord.id);

        const paymentResult: PaymentResult = {
          success: true,
          paymentId: `PAY_${Date.now()}`,
          transactionId,
          paymentMethod: selectedPaymentMethod,
          amount: finalPremium,
          timestamp: new Date().toISOString(),
          gateway: paymentGateway,
          paymentRecordId: paymentRecord.id
        };

        toast({
          title: "Payment Successful!",
          description: `Payment of ${formatCurrency(finalPremium)} processed successfully.`,
        });

        onPaymentSuccess(paymentResult);
      } else {
        // Update payment record as failed
        await supabase
          .from('payment_records')
          .update({
            status: 'failed',
            gateway_response: {
              gateway: paymentGateway,
              method: selectedPaymentMethod,
              success: false,
              error: 'Payment declined by gateway'
            }
          })
          .eq('id', paymentRecord.id);

        throw new Error('Payment failed due to insufficient funds');
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : 'Payment failed',
        variant: "destructive",
      });

      // Reset for retry
      setProcessing(false);
      setPaymentAttempted(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAddOnsPremium = () => {
    return selectedAddOns.reduce((total, addOn) => total + addOn.premium, 0);
  };

  const renderPaymentMethod = (method: any) => {
    const Icon = method.icon;
    const isSelected = selectedPaymentMethod === method.id;

    return (
      <div
        key={method.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setSelectedPaymentMethod(method.id)}
      >
        <div className="flex items-start gap-3">
          <RadioGroupItem value={method.id} id={method.id} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-5 h-5" />
              <Label htmlFor={method.id} className="font-medium">
                {method.name}
              </Label>
              {method.popular && (
                <Badge className="bg-green-100 text-green-800 text-xs">Popular</Badge>
              )}
              {method.recommended && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">Recommended</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{method.description}</p>
            {method.processingFee > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Processing fee: {formatCurrency(method.processingFee)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
        <p className="text-muted-foreground">
          Choose your preferred payment method to secure your insurance policy
        </p>
      </div>

      {/* Payment Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Base Premium ({selectedQuote?.paymentFrequency})</span>
              <span>{formatCurrency(selectedQuote?.premium || 0)}</span>
            </div>
            
            {selectedAddOns.length > 0 && (
              <div className="flex justify-between">
                <span>Add-ons ({selectedAddOns.length} selected)</span>
                <span>{formatCurrency(getAddOnsPremium())}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span>{formatCurrency((selectedQuote?.premium || 0 + getAddOnsPremium()) * 0.18)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total Premium</span>
              <span className="text-primary">{formatCurrency(finalPremium)}</span>
            </div>
          </div>

          {/* Policy Details */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Insurer</p>
                <p className="text-muted-foreground">{selectedQuote?.providerName}</p>
              </div>
              <div>
                <p className="font-medium">Product</p>
                <p className="text-muted-foreground">{selectedQuote?.productName}</p>
              </div>
              <div>
                <p className="font-medium">Sum Insured</p>
                <p className="text-muted-foreground">{formatCurrency(selectedQuote?.sumInsured || 0)}</p>
              </div>
              <div>
                <p className="font-medium">Payment Frequency</p>
                <p className="text-muted-foreground">{selectedQuote?.paymentFrequency}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateway Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={paymentGateway} 
            onValueChange={(value) => setPaymentGateway(value as 'razorpay' | 'paytm')}
            className="space-y-3"
          >
            {paymentGateways.map((gateway) => (
              <div key={gateway.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value={gateway.id} id={gateway.id} />
                <Label htmlFor={gateway.id} className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{gateway.name}</div>
                      <div className="text-sm text-muted-foreground">{gateway.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Supports: {gateway.methods.join(', ')}
                      </div>
                    </div>
                    {gateway.id === 'razorpay' && (
                      <Badge variant="secondary">Recommended</Badge>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Select Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
            <div className="space-y-3">
              {paymentMethods.map(renderPaymentMethod)}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Secure Payment</p>
              <p className="text-sm text-green-700">
                Your payment is processed securely using industry-standard encryption. 
                We do not store your payment information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      {paymentAttempted && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {processing ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className="font-medium text-blue-800">
                  {processing ? 'Processing Payment...' : 'Payment Failed'}
                </p>
                <p className="text-sm text-blue-700">
                  {processing 
                    ? 'Please wait while we process your payment. Do not refresh the page.'
                    : 'You can try again with a different payment method.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={processing}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button 
          onClick={handlePayment} 
          disabled={processing}
          className="min-w-32"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay {formatCurrency(finalPremium)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};